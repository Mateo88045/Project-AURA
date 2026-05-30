-- pg_cron schedules that POST to Aura's Edge Functions.
--
-- Prerequisites (must be set OUTSIDE this migration by an admin):
--   1. Project URL stored in vault:
--        select vault.create_secret(
--          'https://YOUR-PROJECT.supabase.co',
--          'project_url'
--        );
--
--   2. Cron secret stored in vault — a random token the Edge Functions check
--      against the Authorization header to verify cron-originated invocations:
--        select vault.create_secret(
--          'random-string-set-once-and-keep-secret',
--          'cron_secret'
--        );
--
--      Also set the same value as a Supabase Function env var:
--        supabase secrets set CRON_SECRET=<same-value>
--
-- This migration assumes pg_cron and pg_net are enabled in the initial schema.
-- We add pg_net here in case the initial schema doesn't (idempotent).

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Drop any prior schedules so the migration is idempotent
do $$
declare
  job_name text;
begin
  foreach job_name in array array['daily-trigger', 'sunday-briefing']
  loop
    perform cron.unschedule(job_name)
    where exists (select 1 from cron.job where jobname = job_name);
  end loop;
end $$;

-- ─── daily-trigger: every 15 minutes ─────────────────────────────────────────
-- The function itself checks each user's daily_trigger_time against the window,
-- so calling it every 15 min covers every user at most once per day.
select cron.schedule(
  'daily-trigger',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/daily-trigger',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- ─── sunday-briefing: Sundays at 18:00 UTC ───────────────────────────────────
select cron.schedule(
  'sunday-briefing',
  '0 18 * * 0',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/sunday-briefing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- ── Inspection helper ───────────────────────────────────────────────────────
-- View all currently scheduled jobs:    select * from cron.job;
-- View recent run history:              select * from cron.job_run_details order by start_time desc limit 20;
-- Manually fire daily-trigger NOW:      select net.http_post(...);
