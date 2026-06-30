-- Server-side entitlement source of truth. Written by the RevenueCat webhook
-- in apps/api; read by Trigger.dev jobs as the gate for paid-tier work.
-- See docs/entitlement-design.md for the "frozen" enforcement decision.
--
-- The client (apps/mobile/lib/entitlement.tsx) continues to read entitlement
-- via RevenueCat's on-device SDK for UX responsiveness. This column is the
-- authoritative server copy — Trigger.dev jobs MUST NOT trust client input.

create type entitlement_status as enum ('free_preview', 'trialing', 'pro', 'lapsed');

alter table public.users
  add column if not exists entitlement_status entitlement_status not null default 'free_preview',
  add column if not exists entitlement_updated_at timestamptz,
  -- Last RevenueCat event.id we processed for this user. Used for idempotency:
  -- RC retries deliveries on 5xx, and out-of-order delivery is possible.
  add column if not exists last_entitlement_event_id text;

create index if not exists users_entitlement_status_idx
  on public.users (entitlement_status)
  where entitlement_status = 'lapsed';
