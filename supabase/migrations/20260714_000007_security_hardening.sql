-- Security + correctness hardening from the 2026-07-14 full database review.
-- Applied to the live project on 2026-07-14 (migration name: security_hardening).
--
-- Fixes:
--   1. tasks dedup key was global (source, external_id) — two students in the
--      same Google Classroom course share external_ids, so the second user's
--      nightly sync failed on insert. Scoped per user.
--   2. users_self_update RLS allowed updating ANY column, including
--      entitlement_status — a free user could self-upgrade to 'pro' with one
--      PostgREST call. Entitlement columns are server-owned (RevenueCat
--      webhook via service role). Enforced with column-level grants.
--   3. Trigger functions were executable via /rest/v1/rpc by anon
--      (advisor lints 0028/0029) and set_updated_at had a mutable
--      search_path (lint 0011).
--   4. Dispatcher window was closed on both ends — a daily_trigger_time
--      landing exactly on a cron boundary fired twice. Half-open now.
--   5. scheduled_blocks.task_id FK had no index (slow cascades/joins).
--   6. task_completions accepted negative minutes.
--   7. marketing.waitlist had an always-true ALL policy for any signed-in
--      user (read/edit/delete the whole waitlist) and was exposed via
--      GraphQL to anon.
--   8. The landing page inserts into `waitlist` against the *public* schema
--      with the anon key, but the table moved to `marketing` in June — the
--      form has 500'd since. Insert-only compatibility view restores it
--      without re-exposing reads.

-- 1) Per-user task dedup
alter table public.tasks drop constraint if exists tasks_source_external_id_key;
alter table public.tasks
  add constraint tasks_user_source_external_id_key unique (user_id, source, external_id);

-- 2) Server-owned users columns
revoke update on table public.users from anon, authenticated;
grant update (
  display_name,
  grade_level,
  onboarding_answers,
  onboarding_step,
  daily_trigger_time,
  timezone,
  push_token,
  first_schedule_rendered_at
) on table public.users to authenticated;

-- 3) Function lockdown
alter function public.set_updated_at() set search_path = public;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 4) Half-open dispatcher window
create or replace function public.users_due_for_daily_trigger(now_utc timestamptz)
returns table (id uuid)
language sql
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where
    u.entitlement_status <> 'lapsed'
    and (
      ((now_utc at time zone u.timezone)::date + u.daily_trigger_time)
        at time zone u.timezone
    ) > (now_utc - interval '15 minutes')
    and (
      ((now_utc at time zone u.timezone)::date + u.daily_trigger_time)
        at time zone u.timezone
    ) <= now_utc;
$$;

revoke all on function public.users_due_for_daily_trigger(timestamptz) from public, anon, authenticated;
grant execute on function public.users_due_for_daily_trigger(timestamptz) to service_role;

-- 5) Index the scheduled_blocks.task_id FK
create index if not exists scheduled_blocks_task_idx on public.scheduled_blocks (task_id);

-- 6) Sanity checks on completions
alter table public.task_completions
  add constraint task_completions_minutes_nonneg
  check (estimated_minutes >= 0 and actual_minutes >= 0);

-- 7) Marketing schema hardening
drop policy if exists "Authenticated can manage waitlist" on marketing.waitlist;
revoke select, update, delete on marketing.waitlist from anon, authenticated;
revoke select, update, delete on marketing.page_views from anon, authenticated;

-- 8) Insert-only compatibility view for the landing page
create or replace view public.waitlist
  with (security_invoker = on) as
  select id, email, name, created_at, source, referral_code, notes
  from marketing.waitlist;

revoke all on public.waitlist from public, anon, authenticated;
grant insert (email, name, source, referral_code) on public.waitlist to anon;
