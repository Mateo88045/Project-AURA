import type { ThemeColors } from '@chronos/shared/theme';
import type { ResolvedMode } from './ThemeContext';

/**
 * Full-screen three-stop backdrop gradient used behind the auth and onboarding
 * screens: primary → lifted mid-band → primary. Sourced from theme tokens so it
 * tracks palette changes — this was previously duplicated as hardcoded hex
 * across eight screens, which would silently drift if the palette moved.
 *
 * The mid band is the mode's lifted surface (light: `surface`, dark: `elevated`),
 * which reproduces the original hand-picked values exactly.
 */
export function backdropGradient(
  colors: ThemeColors,
  mode: ResolvedMode,
): [string, string, string] {
  const mid =
    mode === 'light' ? colors.background.surface : colors.background.elevated;
  return [colors.background.primary, mid, colors.background.primary];
}
