// Entitlement context — single source of truth for paywall gating.
//
// Today this reads from Supabase (first_schedule_rendered_at) + an AsyncStorage
// dev override. Tomorrow Mateo swaps `resolveStoreStatus` for a real
// Purchases.getCustomerInfo() call. The Entitlement shape stays identical, so
// no consumer code changes.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@chronos/shared/supabase';
import type { AccessLevel, Entitlement, EntitlementStatus } from '@chronos/shared/types';
import { useAuth } from '../hooks/useAuth';
import { isGuestId } from './guest';

// Dev menu can write any EntitlementStatus to this key to simulate states
// without StoreKit. Production builds ignore it.
const DEV_OVERRIDE_KEY = '@chronos/entitlement-dev-override';

interface EntitlementContextValue extends Entitlement {
  loading: boolean;
  /**
   * Called the first time useTodaySchedule observes a non-empty schedule.
   * Writes users.first_schedule_rendered_at if currently null. Idempotent.
   */
  markScheduleRendered: () => Promise<void>;
  /** Force a re-read; called after the paywall completes a purchase. */
  refresh: () => void;
}

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

function deriveAccess(
  status: EntitlementStatus,
  firstScheduleRenderedAt: string | null,
): AccessLevel {
  if (status === 'pro' || status === 'trialing') return 'full';
  if (status === 'lapsed') return 'readonly';
  // free_preview: gate fires only after the user has *seen* a schedule.
  return firstScheduleRenderedAt ? 'gate' : 'preview';
}

async function readDevOverride(): Promise<EntitlementStatus | null> {
  if (!__DEV__) return null;
  try {
    const raw = await AsyncStorage.getItem(DEV_OVERRIDE_KEY);
    if (raw === 'free_preview' || raw === 'trialing' || raw === 'pro' || raw === 'lapsed') {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

// Stubbed RevenueCat resolver. Real impl:
//   const info = await Purchases.getCustomerInfo();
//   const ent = info.entitlements.active['pro'];
//   if (!ent) return { status: 'free_preview' };
//   if (ent.periodType === 'intro') return { status: 'trialing', trialEndsAt: ent.expirationDate };
//   return { status: 'pro' };
async function resolveStoreStatus(): Promise<{
  status: EntitlementStatus;
  trialEndsAt?: string;
}> {
  const override = await readDevOverride();
  if (override) {
    if (override === 'trialing') {
      return {
        status: 'trialing',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    return { status: override };
  }
  return { status: 'free_preview' };
}

interface EntitlementProviderProps {
  children: ReactNode;
}

export function EntitlementProvider({ children }: EntitlementProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [storeStatus, setStoreStatus] = useState<EntitlementStatus>('free_preview');
  const [trialEndsAt, setTrialEndsAt] = useState<string | undefined>(undefined);
  const [firstScheduleRenderedAt, setFirstScheduleRenderedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);

      const store = await resolveStoreStatus();

      // Guests have no profile row; they're treated as preview forever.
      let firstRendered: string | null = null;
      if (userId && !isGuestId(userId)) {
        const { data } = await supabase
          .from('users')
          .select('first_schedule_rendered_at')
          .eq('id', userId)
          .maybeSingle();
        firstRendered = (data?.first_schedule_rendered_at as string | null) ?? null;
      }

      if (cancelled) return;
      setStoreStatus(store.status);
      setTrialEndsAt(store.trialEndsAt);
      setFirstScheduleRenderedAt(firstRendered);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, refreshTick]);

  const markScheduleRendered = useCallback(async () => {
    if (!userId || isGuestId(userId)) return;
    if (firstScheduleRenderedAt) return;
    const now = new Date().toISOString();
    // `is null` predicate makes this idempotent under concurrent renders.
    const { error } = await supabase
      .from('users')
      .update({ first_schedule_rendered_at: now })
      .eq('id', userId)
      .is('first_schedule_rendered_at', null);
    if (!error) setFirstScheduleRenderedAt(now);
  }, [userId, firstScheduleRenderedAt]);

  const value = useMemo<EntitlementContextValue>(() => {
    const access = deriveAccess(storeStatus, firstScheduleRenderedAt);
    return {
      status: storeStatus,
      access,
      trialEndsAt,
      isPro: storeStatus === 'pro' || storeStatus === 'trialing',
      loading: loading || authLoading,
      markScheduleRendered,
      refresh,
    };
  }, [
    storeStatus,
    trialEndsAt,
    firstScheduleRenderedAt,
    loading,
    authLoading,
    markScheduleRendered,
    refresh,
  ]);

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) {
    throw new Error('useEntitlement must be used inside an EntitlementProvider');
  }
  return ctx;
}

// Dev-only helpers so the team can flip states from a debug menu without
// StoreKit. No-op in production.
export async function devSetEntitlementOverride(status: EntitlementStatus | null): Promise<void> {
  if (!__DEV__) return;
  if (status === null) {
    await AsyncStorage.removeItem(DEV_OVERRIDE_KEY);
  } else {
    await AsyncStorage.setItem(DEV_OVERRIDE_KEY, status);
  }
}
