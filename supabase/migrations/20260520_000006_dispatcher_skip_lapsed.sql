-- Exclude lapsed users from the daily-trigger dispatcher.
-- Per docs/entitlement-design.md (Option A "frozen"), the scheduler must not
-- run for users whose subscription has lapsed — that's the paid feature.
-- This is the first line of defense; runPipelineForUser also re-checks
-- entitlement_status as belt-and-suspenders.

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
    ) between (now_utc - interval '15 minutes') and now_utc;
$$;

revoke all on function public.users_due_for_daily_trigger(timestamptz) from public;
grant execute on function public.users_due_for_daily_trigger(timestamptz) to service_role;
