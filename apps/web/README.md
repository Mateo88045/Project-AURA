# Chronos Web

Landing page for Chronos — agentic standalone calendar.

## Setup

```bash
pnpm install
cp .env.local.example .env.local  # fill in Supabase keys (optional)
pnpm --filter @chronos/web dev
```

Open http://localhost:3000

## Supabase (optional)

If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, the waitlist API returns a friendly 503. Otherwise create the table:

```sql
create table waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  name text,
  created_at timestamp with time zone default now()
);
alter table waitlist enable row level security;
create policy "Anyone can insert into waitlist"
  on waitlist for insert
  to anon, authenticated
  with check (true);
create index waitlist_created_at_idx on waitlist (created_at desc);
```

## Fonts

Sora (display) + DM Sans (body), loaded from Google Fonts.
