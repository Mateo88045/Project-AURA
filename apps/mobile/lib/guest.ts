import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Guest mode — App Store Guideline 5.1.1 compliance.
 *
 * Apps may not require users to create an account before they can try core
 * functionality. Guest mode lets a new user explore the full UI (Today, Week,
 * AI, Settings) with no Supabase session. The auth guard in _layout treats an
 * active guest flag as "authenticated + onboarding complete" so navigation
 * works; data hooks simply render their empty/demo states since there is no
 * real user row to read.
 */

const GUEST_KEY = 'chronos_guest_mode';

/** Stable synthetic id used while in guest mode. Never written to Supabase. */
export const GUEST_USER_ID = 'guest-user';

type GuestListener = (isGuest: boolean) => void;
const listeners = new Set<GuestListener>();

/** Read the persisted guest flag (e.g. on cold start). */
export async function loadGuestMode(): Promise<boolean> {
  return (await AsyncStorage.getItem(GUEST_KEY)) === 'true';
}

/** Enter guest mode and notify subscribers (so useAuth updates live). */
export async function enableGuestMode(): Promise<void> {
  await AsyncStorage.setItem(GUEST_KEY, 'true');
  listeners.forEach((listener) => listener(true));
}

/** Leave guest mode — called on real sign-in or sign-out. */
export async function exitGuestMode(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_KEY);
  listeners.forEach((listener) => listener(false));
}

/** Subscribe to guest-mode changes. Returns an unsubscribe function. */
export function subscribeGuestMode(listener: GuestListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
