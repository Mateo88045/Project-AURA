import { Platform } from 'react-native';
import type {
  LiveActivityAttributes,
  LiveActivityContentState,
} from '@aura/shared/types';
import { AuraLiveActivity } from '../modules/aura-live-activity';
import { IS_DEMO_MODE } from '../lib/env';

// Mirrors the stub pattern in services/jobs.ts: when the native module is
// absent (Android, web, Expo Go, or a build without the widget extension) we
// log and no-op so the in-app widget still drives the whole experience.
function devLog(label: string, payload: unknown) {
  if (__DEV__ || IS_DEMO_MODE) {
    // eslint-disable-next-line no-console
    console.log(`[STUB] liveActivity.${label}`, payload);
  }
}

/** True only when a real ActivityKit-backed Live Activity can be shown. */
export function liveActivitiesSupported(): boolean {
  if (Platform.OS !== 'ios' || !AuraLiveActivity) return false;
  try {
    return AuraLiveActivity.areActivitiesEnabled();
  } catch {
    return false;
  }
}

/**
 * Starts the native Live Activity. Resolves with the activity id, or `null`
 * when the native surface isn't available — callers keep working off the
 * in-app widget either way.
 */
export async function startTaskActivity(
  attributes: LiveActivityAttributes,
  state: LiveActivityContentState,
): Promise<string | null> {
  if (!AuraLiveActivity) {
    devLog('start', { attributes, state });
    return null;
  }
  try {
    return await AuraLiveActivity.startActivity(attributes, state);
  } catch (err) {
    console.warn('[liveActivity] start failed', err);
    return null;
  }
}

/** Pushes a fresh content state to a running activity. No-ops if unavailable. */
export async function updateTaskActivity(
  activityId: string | null,
  state: LiveActivityContentState,
): Promise<void> {
  if (!AuraLiveActivity || !activityId) {
    devLog('update', { activityId, state });
    return;
  }
  try {
    await AuraLiveActivity.updateActivity(activityId, state);
  } catch (err) {
    console.warn('[liveActivity] update failed', err);
  }
}

/** Ends a running activity, showing `state` as the final frame. */
export async function endTaskActivity(
  activityId: string | null,
  state: LiveActivityContentState,
): Promise<void> {
  if (!AuraLiveActivity || !activityId) {
    devLog('end', { activityId, state });
    return;
  }
  try {
    await AuraLiveActivity.endActivity(activityId, state);
  } catch (err) {
    console.warn('[liveActivity] end failed', err);
  }
}
