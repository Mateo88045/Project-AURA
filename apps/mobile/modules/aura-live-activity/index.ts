import { requireOptionalNativeModule } from 'expo';
import type {
  LiveActivityAttributes,
  LiveActivityContentState,
} from '@chronos/shared/types';

/**
 * Typed surface of the native ActivityKit bridge. Mirrors the Swift
 * `AuraLiveActivityModule` in `ios/`. All dynamic fields travel as plain
 * JSON — epoch-millisecond numbers for timestamps.
 */
export interface AuraLiveActivityNativeModule {
  /** True only on iOS 16.2+ when the user has Live Activities enabled. */
  areActivitiesEnabled(): boolean;
  /** Starts a Live Activity and resolves with its id (used for later updates). */
  startActivity(
    attributes: LiveActivityAttributes,
    state: LiveActivityContentState,
  ): Promise<string>;
  /** Pushes a new content state to a running activity. */
  updateActivity(activityId: string, state: LiveActivityContentState): Promise<void>;
  /** Ends a running activity, showing `state` as its final frame. */
  endActivity(activityId: string, state: LiveActivityContentState): Promise<void>;
}

/**
 * `null` on Android, web, Expo Go, or any iOS build where the native module
 * hasn't been compiled in. Callers must null-check — see
 * `services/liveActivity.ts`, which wraps this with safe no-op fallbacks.
 */
export const AuraLiveActivity =
  requireOptionalNativeModule<AuraLiveActivityNativeModule>('AuraLiveActivity');
