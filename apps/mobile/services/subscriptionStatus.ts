import { supabase } from '@chronos/shared/supabase';

export type SubscriptionStatus = 'active' | 'frozen';

/**
 * Thrown by scheduling-trigger call sites (services/jobs.ts, the copilot
 * action executor) when the caller's subscription is frozen. Existing data
 * stays fully readable — this only blocks creating new scheduled work.
 */
export class SubscriptionFrozenError extends Error {
  constructor() {
    super(
      "Your Chronos Pro subscription has lapsed, so auto-scheduling is paused. Your existing schedule and tasks are still here — renew to resume.",
    );
    this.name = 'SubscriptionFrozenError';
  }
}

/**
 * Reads the server-confirmed entitlement state (written only by the
 * RevenueCat webhook — see apps/api/src/routes/revenuecat.ts). This is
 * intentionally independent of the RevenueCat native SDK, which isn't
 * installed yet (blocked on the EAS dev-client build), so enforcement works
 * as soon as the webhook + migration are live.
 *
 * Fails open (returns 'active') on a read error — a transient network hiccup
 * must not lock a paying student out of their own schedule.
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const { data, error } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', userId)
    .single();

  if (error || !data) return 'active';
  return data.subscription_status === 'frozen' ? 'frozen' : 'active';
}

/** Throws SubscriptionFrozenError if the user's subscription is frozen. */
export async function assertSchedulingAllowed(userId: string): Promise<void> {
  const status = await getSubscriptionStatus(userId);
  if (status === 'frozen') {
    throw new SubscriptionFrozenError();
  }
}
