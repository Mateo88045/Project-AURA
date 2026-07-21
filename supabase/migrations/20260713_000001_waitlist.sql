-- Marketing waitlist for the chronos-app.com landing page
-- (apps/web, not the mobile app). Public anon key can INSERT only — never
-- SELECT/UPDATE/DELETE, so a scraped anon key can't dump the email list.
-- Written to by apps/web/app/api/waitlist/route.ts.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

create policy "anon can join waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- No select/update/delete policy for anon or authenticated — only the
-- service role (used server-side, never shipped to a client) can read the list.
