-- RPC used by the daily-trigger Edge Function to find users whose daily_trigger_time
-- falls inside the current 15-minute cron window, accounting for their timezone.
--
-- Called from supabase/functions/daily-trigger/index.ts.
-- Returns: { id: uuid }[]
--
-- Logic:
--   1. Convert each user's daily_trigger_time (a `time` in their timezone) to
--      today's full timestamptz in UTC.
--   2. Keep users where that timestamp is within [now_utc - 15min, now_utc].

create or replace function public.users_due_for_daily_trigger(now_utc timestamptz)
returns table (id uuid)
language sql
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where
    -- Build today's local trigger moment in the user's timezone:
    --   ( today in tz ) + daily_trigger_time   →   timestamp at tz
    -- Then compare it to the now_utc window.
    (
      ((now_utc at time zone u.timezone)::date + u.daily_trigger_time)
        at time zone u.timezone
    ) between (now_utc - interval '15 minutes') and now_utc;
$$;

-- Service role calls this; lock down to authenticated users only just in case.
revoke all on function public.users_due_for_daily_trigger(timestamptz) from public;
grant execute on function public.users_due_for_daily_trigger(timestamptz) to service_role;
