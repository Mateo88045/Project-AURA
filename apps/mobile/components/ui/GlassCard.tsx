import { useState, useEffect, useMemo, type ReactNode } from 'react';
import {
  View,
  AccessibilityInfo,
  Platform,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { radius, type ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';

// ---------------------------------------------------------------------------
// Liquid glass availability check — synchronous, cached.
// expo-glass-effect exposes isLiquidGlassAvailable() which returns false on
// platforms that don't ship iOS 26's UIGlassEffect (Android, older iOS).
// ---------------------------------------------------------------------------

let _glassAvailable: boolean | null = null;

function isGlassAvailable(): boolean {
  if (_glassAvailable !== null) return _glassAvailable;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-glass-effect') as typeof import('expo-glass-effect');
    _glassAvailable = mod.isLiquidGlassAvailable?.() ?? false;
  } catch {
    _glassAvailable = false;
  }
  return _glassAvailable;
}

// ---------------------------------------------------------------------------
// Accessibility: reduce transparency fallback to a solid surface
// ---------------------------------------------------------------------------

function useReduceTransparency() {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    // isReduceTransparencyEnabled + 'reduceTransparencyChanged' are iOS-only.
    // Bail on web/Android so we don't crash with "is not a function".
    if (Platform.OS !== 'ios') return;

    let cancelled = false;

    AccessibilityInfo.isReduceTransparencyEnabled?.().then((enabled) => {
      if (!cancelled) setReduceTransparency(enabled);
    });

    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return reduceTransparency;
}

// ---------------------------------------------------------------------------
// Intensity mapping — our semantic prop maps to expo-glass-effect's GlassStyle
// 'light' → clear (most transparent)
// 'regular' → regular
// 'thick' → regular + darker BlurView fallback / tint
// ---------------------------------------------------------------------------

type Intensity = 'light' | 'regular' | 'thick';

function toGlassStyle(intensity: Intensity): 'clear' | 'regular' {
  return intensity === 'light' ? 'clear' : 'regular';
}

function toBlurIntensity(intensity: Intensity): number {
  return intensity === 'light' ? 40 : intensity === 'regular' ? 60 : 85;
}

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: Intensity;
  borderAccent?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 'regular',
  borderAccent = false,
}: GlassCardProps) {
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const reduceTransparency = useReduceTransparency();
  const borderStyle = borderAccent ? styles.borderAccent : styles.borderSubtle;
  const blurTint: 'dark' | 'light' = resolvedMode === 'light' ? 'light' : 'dark';

  // Accessibility: solid background when reduce transparency is on
  if (reduceTransparency) {
    return (
      <View style={[styles.base, styles.solid, borderStyle, style]}>
        {children}
      </View>
    );
  }

  if (isGlassAvailable()) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GlassView } = require('expo-glass-effect') as typeof import('expo-glass-effect');
    return (
      <GlassView
        glassEffectStyle={toGlassStyle(intensity)}
        style={[styles.base, borderStyle, style]}
      >
        {children}
      </GlassView>
    );
  }

  // Fallback: older iOS and Android
  return (
    <BlurView
      intensity={toBlurIntensity(intensity)}
      tint={blurTint}
      style={[styles.base, styles.fallback, borderStyle, style]}
    >
      {children}
    </BlurView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    base: { borderRadius: radius.lg, overflow: 'hidden' },
    borderSubtle: { borderWidth: 1, borderColor: c.border.subtle },
    borderAccent: { borderWidth: 1, borderColor: c.border.glass },
    fallback: { backgroundColor: c.background.elevated + 'B3' }, // ~70% alpha
    solid: { backgroundColor: c.background.elevated },
  });
}
