/**
 * Subscription / in-app-purchase abstraction for Chronos.
 *
 * This module is intentionally provider-agnostic. The app talks to this
 * interface; the concrete implementation is swapped at build time.
 *
 * ── Current state ───────────────────────────────────────────────────────────
 * Runs in PREVIEW mode (no native module required), so the app builds and the
 * paywall is fully interactive in Expo Go / dev client without any store setup.
 * In preview mode `purchase()` resolves to { status: 'preview' } and the
 * onboarding flow is allowed to continue — this is safe for development and for
 * internal TestFlight smoke tests, but it does NOT charge money.
 *
 * ── Going live with RevenueCat (required before App Store submission) ────────
 * 1. `pnpm --filter @chronos/mobile add react-native-purchases`
 * 2. Create products in App Store Connect (see PRICING below) and an Offering
 *    in the RevenueCat dashboard, then set EXPO_PUBLIC_REVENUECAT_IOS_KEY.
 * 3. Replace the PREVIEW block in `configure`/`getOfferings`/`purchase`/
 *    `restore`/`getActiveEntitlement` with the RevenueCat calls documented
 *    inline below (search "REVENUECAT").
 * 4. Rebuild the dev client / EAS build (native module — Expo Go can't run it).
 *
 * The entitlement identifier the app checks for is `pro`.
 */

import { Linking } from 'react-native';

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

  // REVENUECAT:
  // import Purchases from 'react-native-purchases';
  // Purchases.configure({ apiKey: REVENUECAT_KEY!, appUserID: userId });
  void userId;
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

  // REVENUECAT:
  // try {
  //   const offerings = await Purchases.getOfferings();
  //   const pkg = offerings.current?.availablePackages.find(
  //     (p) => p.product.identifier === plan.productId,
  //   );
  //   if (!pkg) return { status: 'error', message: 'Plan unavailable' };
  //   const { customerInfo } = await Purchases.purchasePackage(pkg);
  //   const active = Boolean(customerInfo.entitlements.active['pro']);
  //   return { status: active ? 'purchased' : 'error', productId: plan.productId };
  // } catch (e: any) {
  //   if (e?.userCancelled) return { status: 'cancelled' };
  //   return { status: 'error', message: e?.message ?? 'Purchase failed' };
  // }
  return { status: 'error', message: 'Billing not implemented' };
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!isBillingConfigured()) {
    return { status: 'preview' };
  }

  // REVENUECAT:
  // try {
  //   const info = await Purchases.restorePurchases();
  //   const active = Boolean(info.entitlements.active['pro']);
  //   return { status: active ? 'restored' : 'error' };
  // } catch (e: any) {
  //   return { status: 'error', message: e?.message ?? 'Restore failed' };
  // }
  return { status: 'error', message: 'Billing not implemented' };
}

/** Returns true if the user currently holds the `pro` entitlement. */
export async function hasActiveSubscription(): Promise<boolean> {
  if (!isBillingConfigured()) return false;

  // REVENUECAT:
  // const info = await Purchases.getCustomerInfo();
  // return Boolean(info.entitlements.active['pro']);
  return false;
}
