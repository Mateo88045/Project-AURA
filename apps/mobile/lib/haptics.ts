// /apps/mobile/lib/haptics.ts
// Centralized haptic feedback — never call Haptics.* directly in components.

import * as Haptics from 'expo-haptics';

export const haptic = {
  /** Fixed Time element tap — tapping stone */
  fixedTap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),

  /** Liquid Time element tap — tapping water */
  liquidTap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),

  /** Primary CTA button press */
  primaryCTA: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Secondary / ghost button press */
  secondary: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Task completed, schedule approved */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Error state, failed action */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /** Picker scroll, selection change */
  selection: () => Haptics.selectionAsync(),
} as const;
