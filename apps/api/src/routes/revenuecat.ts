import { Hono } from 'hono';
import { env, assertRevenueCatConfigured } from '../env.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

/**
 * Events that mean the user has (re)gained access. TEMPORARY_ENTITLEMENT_GRANT
 * covers promotional/support-granted access.
 */
const ACTIVE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
  'TEMPORARY_ENTITLEMENT_GRANT',
]);

/**
 * Events that mean the user has actually lost access. Note CANCELLATION is
 * intentionally excluded — it only means auto-renew was turned off, the user
 * keeps access until the period ends, at which point EXPIRATION fires.
 */
const FROZEN_EVENTS = new Set(['EXPIRATION', 'BILLING_ISSUE']);

/** Pure mapping, exported for unit testing without a live webhook call. */
export function resolveSubscriptionStatus(
  eventType: string,
): 'active' | 'frozen' | null {
  if (ACTIVE_EVENTS.has(eventType)) return 'active';
  if (FROZEN_EVENTS.has(eventType)) return 'frozen';
  return null;
}

export type RevenueCatWebhookBody = {
  event?: { type?: string; app_user_id?: string };
};

export type SubscriptionStatusWriter = (
  userId: string,
  status: 'active' | 'frozen',
) => Promise<{ error: string | null }>;

function buildSupabaseWriter(): SubscriptionStatusWriter {
  return async (userId, status) => {
    const { error } = await getSupabaseAdmin()
      .from('users')
      .update({ subscription_status: status })
      .eq('id', userId);
    return { error: error ? error.message : null };
  };
}

/**
 * `writeStatus` is injectable so tests can verify routing/mapping logic
 * without a live Supabase project; production use (the `revenueCatRouter`
 * export below) wires up the real service-role write.
 */
export function createRevenueCatRouter(
  writeStatus: SubscriptionStatusWriter = buildSupabaseWriter(),
) {
  const router = new Hono();

  router.post('/webhook', async (c) => {
    try {
      assertRevenueCatConfigured();
    } catch (e) {
      return c.json(
        { error: e instanceof Error ? e.message : 'Not configured' },
        503,
      );
    }

    const auth = c.req.header('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    if (!token || token !== env.revenueCatWebhookSecret) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = (await c.req.json().catch(() => null)) as RevenueCatWebhookBody | null;
    const eventType = body?.event?.type;
    const appUserId = body?.event?.app_user_id;

    if (!eventType || !appUserId) {
      return c.json({ error: 'Malformed RevenueCat event' }, 400);
    }

    const status = resolveSubscriptionStatus(eventType);
    if (!status) {
      // Event type we intentionally don't act on (e.g. CANCELLATION).
      return c.json({ ok: true as const, skipped: true as const });
    }

    const { error } = await writeStatus(appUserId, status);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[revenuecat] failed to update subscription_status', error);
      return c.json({ error: 'Failed to persist entitlement change' }, 500);
    }

    return c.json({ ok: true as const, userId: appUserId, status });
  });

  return router;
}

export const revenueCatRouter = createRevenueCatRouter();
