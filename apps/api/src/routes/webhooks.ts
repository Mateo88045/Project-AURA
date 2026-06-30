// RevenueCat → Supabase webhook.
//
// RevenueCat sends every entitlement event here. We map the event type to
// an EntitlementStatus and write it to public.users.entitlement_status,
// which Trigger.dev jobs read as the source of truth (see
// docs/entitlement-design.md — Option A "frozen").
//
// Auth: RC sends `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`. The
// secret is configured in the RC dashboard under Project → Webhooks.
//
// Idempotency: RC retries deliveries on 5xx and may deliver out of order.
// We store event.id in users.last_entitlement_event_id and skip duplicates.
//
// Event reference: https://www.revenuecat.com/docs/webhooks#event-types

import { Hono } from 'hono';
import type { EntitlementStatus } from '@chronos/shared/types';
import { env } from '../env.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

export const webhooksRouter = new Hono();

interface RevenueCatEvent {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  // Present on TRIAL_STARTED — ms epoch.
  expiration_at_ms?: number;
}

interface RevenueCatPayload {
  event?: RevenueCatEvent;
  api_version?: string;
}

// RC event type → EntitlementStatus.
// Anything not in this map is logged and ignored (200) — RC retries 5xx, and
// we don't want to retry events we genuinely don't care about (e.g. TEST).
function mapEventType(type: string): EntitlementStatus | null {
  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'UNCANCELLATION':
    case 'NON_RENEWING_PURCHASE':
      return 'pro';
    case 'TRIAL_STARTED':
      return 'trialing';
    case 'TRIAL_CONVERTED':
      return 'pro';
    case 'EXPIRATION':
    case 'BILLING_ISSUE':
    case 'TRIAL_CANCELLED':
    case 'SUBSCRIPTION_PAUSED':
      return 'lapsed';
    case 'CANCELLATION':
      // CANCELLATION means "will not renew" — the user keeps access until
      // expiration_at_ms. Don't downgrade now; the EXPIRATION event will.
      return null;
    case 'TEST':
    case 'TRANSFER':
      return null;
    default:
      return null;
  }
}

webhooksRouter.post('/revenuecat', async (c) => {
  // Refuse if not configured — fail closed.
  if (!env.revenueCatWebhookSecret) {
    console.error('[revenuecat] REVENUECAT_WEBHOOK_SECRET not set — refusing');
    return c.json({ error: 'Webhook not configured' }, 503);
  }

  const auth = c.req.header('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== env.revenueCatWebhookSecret) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  let payload: RevenueCatPayload;
  try {
    payload = (await c.req.json()) as RevenueCatPayload;
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const event = payload.event;
  if (!event?.type || !event.id) {
    return c.json({ error: 'Missing event.type or event.id' }, 400);
  }

  // RC's app_user_id is whatever we passed to Purchases.logIn — we set this
  // to the Supabase auth user id on the client.
  const userId = event.app_user_id ?? event.original_app_user_id;
  if (!userId) {
    console.warn('[revenuecat] event missing app_user_id', event.id, event.type);
    return c.json({ ok: true, ignored: 'no_app_user_id' });
  }

  const nextStatus = mapEventType(event.type);
  if (!nextStatus) {
    // Unhandled event type; ack with 200 so RC doesn't retry.
    return c.json({ ok: true, ignored: event.type });
  }

  const supabase = getSupabaseAdmin();

  // Idempotency: skip if we've already processed this event.id for this user.
  const { data: existing, error: readError } = await supabase
    .from('users')
    .select('id, last_entitlement_event_id, entitlement_status')
    .eq('id', userId)
    .maybeSingle();

  if (readError) {
    console.error('[revenuecat] supabase read failed', readError);
    return c.json({ error: 'DB read failed' }, 500);
  }

  if (!existing) {
    // User row doesn't exist yet — likely a race with signup. RC will retry.
    console.warn('[revenuecat] user row not found', userId);
    return c.json({ error: 'User not found' }, 404);
  }

  if (existing.last_entitlement_event_id === event.id) {
    return c.json({ ok: true, idempotent: true });
  }

  const { error: writeError } = await supabase
    .from('users')
    .update({
      entitlement_status: nextStatus,
      entitlement_updated_at: new Date().toISOString(),
      last_entitlement_event_id: event.id,
    })
    .eq('id', userId);

  if (writeError) {
    console.error('[revenuecat] supabase write failed', writeError);
    return c.json({ error: 'DB write failed' }, 500);
  }

  console.log(
    `[revenuecat] ${event.type} → ${nextStatus} for user ${userId} (event ${event.id})`,
  );
  return c.json({ ok: true, status: nextStatus });
});
