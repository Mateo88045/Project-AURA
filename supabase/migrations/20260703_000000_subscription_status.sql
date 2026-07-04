-- RevenueCat entitlement lapse-enforcement.
--
-- 'active'  — full auto-scheduling (includes free trial and all paid states).
-- 'frozen'  — subscription lapsed (expiration/billing issue). App stops
--             scheduling new work but keeps all existing data visible; the
--             RevenueCat webhook handler (apps/api/src/routes/revenuecat.ts)
--             is the only writer.
--
-- Default is 'active' so existing/new users are unaffected until a real
-- RevenueCat webhook event actually lapses them (matches the current
-- PREVIEW-mode billing state — see apps/mobile/services/purchases.ts).

alter table public.users
  add column if not exists subscription_status text not null default 'active'
    check (subscription_status in ('active', 'frozen'));

-- Row-level "self_update" RLS lets a user update any column on their own
-- users row (see 20260520_000000_initial_schema.sql). Without this guard, a
-- client could set their own subscription_status back to 'active' directly,
-- bypassing billing entirely. Only the service-role connection (used by the
-- webhook handler) may change this column.
create or replace function public.prevent_client_subscription_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.subscription_status is distinct from old.subscription_status
     and auth.role() <> 'service_role' then
    raise exception 'subscription_status can only be changed by the RevenueCat webhook handler';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_subscription_status on public.users;
create trigger guard_subscription_status
  before update on public.users
  for each row
  execute function public.prevent_client_subscription_status_change();
