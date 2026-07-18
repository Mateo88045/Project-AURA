import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '@chronos/shared/types';

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
const GUEST_PROFILE_KEY = 'chronos_guest_profile';
const GUEST_TASKS_KEY = 'chronos_guest_tasks';

/** Stable synthetic id used while in guest mode. Never written to Supabase. */
export const GUEST_USER_ID = 'guest-user';

/**
 * The subset of the user profile that a guest can edit locally. Persisted in
 * AsyncStorage so edits made in Settings → Profile actually transfer through
 * the rest of the app instead of resetting on every reload.
 */
export interface GuestProfile {
  displayName: string;
  gradeLevel: number;
  dailyTriggerTime: string; // HH:MM
}

type GuestProfileListener = (profile: GuestProfile | null) => void;
const profileListeners = new Set<GuestProfileListener>();

export async function loadGuestProfile(): Promise<GuestProfile | null> {
  const raw = await AsyncStorage.getItem(GUEST_PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GuestProfile>;
    if (
      typeof parsed.displayName === 'string' &&
      typeof parsed.gradeLevel === 'number' &&
      typeof parsed.dailyTriggerTime === 'string'
    ) {
      return parsed as GuestProfile;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveGuestProfile(profile: GuestProfile): Promise<void> {
  await AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  profileListeners.forEach((l) => l(profile));
}

export async function clearGuestProfile(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_PROFILE_KEY);
  profileListeners.forEach((l) => l(null));
}

export function subscribeGuestProfile(listener: GuestProfileListener): () => void {
  profileListeners.add(listener);
  return () => {
    profileListeners.delete(listener);
  };
}

/**
 * True when `id` is the guest sentinel, not a real Supabase uuid.
 * Every hook that filters a Postgres query by user id must check this first —
 * a guest id sent to a uuid column throws `invalid input syntax for type uuid`.
 */
export function isGuestId(id: string | null | undefined): boolean {
  return id === GUEST_USER_ID;
}

// ---------------------------------------------------------------------------
// Guest tasks — locally created tasks while exploring without an account.
// Guideline 5.1.1: core functionality (adding a task) must work for guests.
// Stored in AsyncStorage; merged with the demo dataset by the task hooks and
// wiped on sign-in/sign-out via exitGuestMode.
// ---------------------------------------------------------------------------

type GuestTasksListener = (tasks: Task[]) => void;
const taskListeners = new Set<GuestTasksListener>();

export async function loadGuestTasks(): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(GUEST_TASKS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Task[]) : [];
  } catch {
    return [];
  }
}

export async function addGuestTask(task: Task): Promise<void> {
  const existing = await loadGuestTasks();
  const next = [...existing, task];
  await AsyncStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(next));
  taskListeners.forEach((l) => l(next));
}

export function subscribeGuestTasks(listener: GuestTasksListener): () => void {
  taskListeners.add(listener);
  return () => {
    taskListeners.delete(listener);
  };
}

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
  await AsyncStorage.multiRemove([GUEST_KEY, GUEST_PROFILE_KEY, GUEST_TASKS_KEY]);
  profileListeners.forEach((l) => l(null));
  taskListeners.forEach((l) => l([]));
  listeners.forEach((listener) => listener(false));
}

/** Subscribe to guest-mode changes. Returns an unsubscribe function. */
export function subscribeGuestMode(listener: GuestListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
