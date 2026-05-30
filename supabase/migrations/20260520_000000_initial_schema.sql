-- Aura initial schema.
-- Run via: supabase db push (after `supabase link --project-ref <ref>`)
-- Or apply manually via the Supabase SQL editor.
--
-- This migration covers everything CLAUDE.md's "Database Schema Reference" section
-- defines, plus the push_token column needed for push notifications.

-- ── extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_cron";    -- optional: server-side cron

-- ── users ───────────────────────────────────────────────────────────────────
-- Mirrors auth.users with profile fields. Row created on signup via trigger below.
create table if not exists public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  display_name        text not null default '',
  grade_level         int  not null default 9 check (grade_level between 9 and 12),
  onboarding_answers  jsonb not null default '{}'::jsonb,
  daily_trigger_time  time not null default '18:00',
  timezone            text not null default 'America/New_York',
  push_token          text,                    -- Expo push token; null until device registers
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists users_push_token_idx on public.users (push_token) where push_token is not null;

-- ── connections (Google Classroom / Canvas) ─────────────────────────────────
create type connection_platform as enum ('google_classroom', 'canvas');
create type connection_status   as enum ('active', 'expired', 'error');

create table if not exists public.connections (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  platform          connection_platform not null,
  oauth_token       text not null,
  refresh_token     text not null,
  canvas_api_token  text,
  canvas_base_url   text,
  status            connection_status not null default 'active',
  last_synced_at    timestamptz,
  created_at        timestamptz not null default now(),
  unique (user_id, platform)
);

create index if not exists connections_user_idx on public.connections (user_id);

-- ── fixed_events ────────────────────────────────────────────────────────────
create table if not exists public.fixed_events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  title            text not null,
  start_time       time not null,
  end_time         time not null,
  days_of_week     int[] not null,             -- 0=Sun, 6=Sat
  recurrence_rule  text,
  color            text,
  created_at       timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists fixed_events_user_idx on public.fixed_events (user_id);

-- ── tasks ───────────────────────────────────────────────────────────────────
create type task_source as enum ('google_classroom', 'canvas', 'manual', 'photo');
create type task_type   as enum ('essay', 'problem_set', 'reading', 'project', 'study_guide', 'quiz_prep', 'other');
create type task_status as enum ('pending', 'scheduled', 'in_progress', 'completed');

create table if not exists public.tasks (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  title              text not null,
  subject            text not null default '',
  source             task_source not null,
  external_id        text,                       -- platform-provided ID for dedup
  due_date           timestamptz not null,
  difficulty         int not null check (difficulty between 1 and 5),
  estimated_minutes  int not null check (estimated_minutes > 0),
  task_type          task_type not null default 'other',
  status             task_status not null default 'pending',
  description        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (source, external_id)                  -- nulls allowed; manual/photo tasks unique by id
);

create index if not exists tasks_user_status_idx  on public.tasks (user_id, status);
create index if not exists tasks_user_due_idx     on public.tasks (user_id, due_date);

-- ── scheduled_blocks ────────────────────────────────────────────────────────
create type block_status as enum ('shadow', 'approved', 'completed');

create table if not exists public.scheduled_blocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  task_id     uuid references public.tasks(id) on delete set null,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  status      block_status not null default 'shadow',
  day         date not null,
  created_at  timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists scheduled_blocks_user_day_idx on public.scheduled_blocks (user_id, day);
create index if not exists scheduled_blocks_status_idx   on public.scheduled_blocks (user_id, status);

-- ── task_completions ───────────────────────────────────────────────────────
create type user_feedback as enum ('too_long', 'about_right', 'too_short');

create table if not exists public.task_completions (
  id                 uuid primary key default gen_random_uuid(),
  task_id            uuid not null references public.tasks(id) on delete cascade,
  user_id            uuid not null references public.users(id) on delete cascade,
  estimated_minutes  int not null,
  actual_minutes     int not null,
  completed_at       timestamptz not null default now(),
  user_feedback      user_feedback not null
);

create index if not exists task_completions_user_idx on public.task_completions (user_id, completed_at desc);

-- ── guardrails ──────────────────────────────────────────────────────────────
create type guardrail_rule_type as enum ('no_work_after', 'buffer_after_event', 'max_hours_per_day');

create table if not exists public.guardrails (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  rule_type   guardrail_rule_type not null,
  value       jsonb not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, rule_type)
);

-- ── conversations (copilot) ─────────────────────────────────────────────────
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  messages    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists conversations_user_idx on public.conversations (user_id, updated_at desc);

-- ── updated_at triggers ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_users on public.users;
create trigger set_updated_at_users before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_tasks on public.tasks;
create trigger set_updated_at_tasks before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_conversations on public.conversations;
create trigger set_updated_at_conversations before update on public.conversations
  for each row execute function public.set_updated_at();

-- ── auth.users → public.users sync ─────────────────────────────────────────
-- When a new user signs up, mirror them into public.users so every other table
-- can FK reference public.users(id) safely.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ─────────────────────────────────────────────────────
-- Default: a user can only read/write their own rows.
-- Service role (used by Edge Functions) bypasses RLS automatically.

alter table public.users             enable row level security;
alter table public.connections       enable row level security;
alter table public.fixed_events      enable row level security;
alter table public.tasks             enable row level security;
alter table public.scheduled_blocks  enable row level security;
alter table public.task_completions  enable row level security;
alter table public.guardrails        enable row level security;
alter table public.conversations     enable row level security;

-- Helper macro: one policy per table for "user can access their own rows"
do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'connections', 'fixed_events', 'tasks',
    'scheduled_blocks', 'task_completions', 'guardrails', 'conversations'
  ]
  loop
    execute format($f$
      drop policy if exists "%1$s_self_select" on public.%1$s;
      drop policy if exists "%1$s_self_insert" on public.%1$s;
      drop policy if exists "%1$s_self_update" on public.%1$s;
      drop policy if exists "%1$s_self_delete" on public.%1$s;
    $f$, t);

    -- users table uses id; others use user_id
    if t = 'users' then
      execute format($f$
        create policy "%1$s_self_select" on public.%1$s for select using (auth.uid() = id);
        create policy "%1$s_self_update" on public.%1$s for update using (auth.uid() = id);
      $f$, t);
    else
      execute format($f$
        create policy "%1$s_self_select" on public.%1$s for select using (auth.uid() = user_id);
        create policy "%1$s_self_insert" on public.%1$s for insert with check (auth.uid() = user_id);
        create policy "%1$s_self_update" on public.%1$s for update using (auth.uid() = user_id);
        create policy "%1$s_self_delete" on public.%1$s for delete using (auth.uid() = user_id);
      $f$, t);
    end if;
  end loop;
end $$;
