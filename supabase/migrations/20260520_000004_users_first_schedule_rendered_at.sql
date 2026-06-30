-- Anchor for the soft paywall trigger.
--
-- The paywall fires on the first interactive action a user takes against
-- a *rendered* schedule. That requires knowing when the user first saw one,
-- which the client writes the first time useTodaySchedule observes blocks
-- and this column is still null.
--
-- Nullable on purpose: a user who has signed up but never had a schedule
-- generated yet has not crossed the trigger boundary and never sees the
-- paywall.

alter table public.users
  add column if not exists first_schedule_rendered_at timestamptz;
