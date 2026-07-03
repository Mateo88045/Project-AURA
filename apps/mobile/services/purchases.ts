/**
 * Subscription / in-app-purchase abstraction for Chronos.
 *
 * This module is intentionally provider-agnostic. The app talks to this
 * interface; RevenueCat is the concrete implementation, loaded lazily.
 *
 * ── Two runtime modes, selected automatically by the SDK key ────────────────
 * • PREVIEW mode (EXPO_PUBLIC_REVENUECAT_IOS_KEY unset): the native module is
 *   never imported, so the app builds and the paywall stays interactive in
 *   Expo Go / a dev client with no store setup. `purchase()` resolves to
 *   { status: 'preview' } and onboarding proceeds — safe for development, but
 *   it does NOT charge money.
 * • LIVE mode (key set): `react-native-purchases` is dynamically imported and
 *   the real RevenueCat flow runs. Requires a dev-client / EAS build — Expo Go
 *   cannot load the native module.
 *
 * Going live checklist (see LAUNCH_CHECKLIST.md §2):
 *   1. `pnpm --filter @chronos/mobile add react-native-purchases`  (done)
 *   2. Create the products in App Store Connect (see PLANS below) + a
 *      RevenueCat Offering with entitlement `pro`.
 *   3. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY (EAS env) and rebuild.
 *
 * The entitlement identifier the app checks for is `pro`.
 */

import { Linking } from 'react-native';

/** The RevenueCat entitlement id that unlocks Chronos Pro. */
const PRO_ENTITLEMENT = 'pro';

/**
 * Lazily load the native RevenueCat module. Kept out of the module's top-level
 * imports so PREVIEW builds (and Expo Go) never touch native code.
 */
async function loadPurchases() {
  const mod = await import('react-native-purchases');
  return mod.default;
}

/** Narrows an unknown thrown value into a PurchaseResult. */
function toPurchaseError(error: unknown, fallback: string): PurchaseResult {
  const e = error as { userCancelled?: boolean; message?: string };
  if (e?.userCancelled) return { status: 'cancelled' };
  return { status: 'error', message: e?.message ?? fallback };
}

export type BillingInterval = 'monthly' | 'annual';

/** Apple's account-level subscription management page. */
export const MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

/**
 * Opens the system subscription-management screen so the user can upgrade,
 * downgrade, or cancel. With RevenueCat wired you can instead call
 * `Purchases.showManageSubscriptions()`; the App Store URL works in all cases.
 */
export async function openManageSubscriptions(): Promise<void> {
  await Linking.openURL(MANAGE_SUBSCRIPTIONS_URL);
}

export interface SubscriptionPlan {
  /** App Store Connect product identifier. */
  productId: string;
  interval: BillingInterval;
  /** Price the user pays now (early-access launch pricing). */
  priceLabel: string;
  /** Regular price, shown struck-through to convey the launch discount. */
  regularPriceLabel: string;
  /** e.g. "per month" / "per year". */
  periodLabel: string;
  /** Effective monthly cost line, e.g. "$7.08/mo billed annually". */
  footnote?: string;
  /** Marketing badge, e.g. "Best value · Save 41%". */
  badge?: string;
}

export type PurchaseStatus = 'purchased' | 'restored' | 'cancelled' | 'preview' | 'error';

export interface PurchaseResult {
  status: PurchaseStatus;
  productId?: string;
  message?: string;
}

/**
 * PRICING — early-access launch pricing, with regular pricing shown struck out.
 * Product IDs must match the products you create in App Store Connect.
 */
export const PLANS: Record<BillingInterval, SubscriptionPlan> = {
  annual: {
    productId: 'chronos_early_annual',
    interval: 'annual',
    priceLabel: '$79',
    regularPriceLabel: '$100',
    periodLabel: 'per year',
    footnote: '$6.58/mo · billed annually',
    badge: 'Best value · Save 45%',
  },
  monthly: {
    productId: 'chronos_early_monthly',
    interval: 'monthly',
    priceLabel: '$8',
    regularPriceLabel: '$12',
    periodLabel: 'per month',
    footnote: 'Billed monthly · cancel anytime',
  },
};

/** Length of the introductory free trial, surfaced in the paywall + fine print. */
export const FREE_TRIAL_DAYS = 7;

const REVENUECAT_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;

/** True once a real billing provider is configured. */
export function isBillingConfigured(): boolean {
  return Boolean(REVENUECAT_KEY);
}

let configured = false;

export async function configurePurchases(userId: string): Promise<void> {
  if (configured) return;
  configured = true;

  if (!isBillingConfigured()) {
    // PREVIEW mode — nothing to configure.
    return;
  }

  const Purchases = await loadPurchases();
  Purchases.configure({ apiKey: REVENUECAT_KEY!, appUserID: userId });
}

export async function getOfferings(): Promise<SubscriptionPlan[]> {
  // REVENUECAT (optional): read live localized prices from the configured
  // Offering and merge them into PLANS so the displayed price always matches
  // the store. Falling back to PLANS is fine for launch.
  return [PLANS.annual, PLANS.monthly];
}

export async function purchasePlan(plan: SubscriptionPlan): Promise<PurchaseResult> {
  if (!isBillingConfigured()) {
    // PREVIEW mode — no charge; let onboarding proceed so the build is testable.
    return { status: 'preview', productId: plan.productId };
  }

  try {
    const Purchases = await loadPurchases();
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (p) => p.product.identifier === plan.productId,
    );
    if (!pkg) return { status: 'error', message: 'Plan unavailable' };
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT]);
    return { status: active ? 'purchased' : 'error', productId: plan.productId };
  } catch (error) {
    return toPurchaseError(error, 'Purchase failed');
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!isBillingConfigured()) {
    return { status: 'preview' };
  }

  try {
    const Purchases = await loadPurchases();
    const info = await Purchases.restorePurchases();
    const active = Boolean(info.entitlements.active[PRO_ENTITLEMENT]);
    return { status: active ? 'restored' : 'error' };
  } catch (error) {
    return toPurchaseError(error, 'Restore failed');
  }
}

/** Returns true if the user currently holds the `pro` entitlement. */
export async function hasActiveSubscription(): Promise<boolean> {
  if (!isBillingConfigured()) return false;

  try {
    const Purchases = await loadPurchases();
    const info = await Purchases.getCustomerInfo();
    return Boolean(info.entitlements.active[PRO_ENTITLEMENT]);
  } catch {
    return false;
  }
}
