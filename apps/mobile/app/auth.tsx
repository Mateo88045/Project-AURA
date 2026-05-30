import { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme, type ResolvedMode } from '../lib/theme';
import { AmbientOrbs } from '../components/ui/AmbientOrbs';
import { AuraButton } from '../components/ui/AuraButton';
import { AuraSymbol } from '../components/ui/AuraSymbol';
import {
  initiateGoogleOAuth,
  initiateAppleSignIn,
  isAppleSignInAvailable,
} from '../services/oauthService';
import { supabase } from '@chronos/shared/supabase';
import { haptic } from '../lib/haptics';
import { enableGuestMode } from '../lib/guest';

const STAGGER_MS = 60;

function backdropColors(mode: ResolvedMode): [string, string, string] {
  return mode === 'light'
    ? ['#F8FAFC', '#F1F5F9', '#F8FAFC']
    : ['#07090F', '#0D1117', '#07090F'];
}

// ---------------------------------------------------------------------------
// Brand icons — proper Google multicolor G and Apple logo
// ---------------------------------------------------------------------------

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AppleIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
        fill={color}
      />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Glow ring behind the main icon
// ---------------------------------------------------------------------------

function HeroGlowRing({ color }: { color: string }) {
  return (
    <View style={glowStyles.container}>
      {/* Outer soft glow */}
      <View style={[glowStyles.outerRing, { borderColor: color, shadowColor: color }]} />
      {/* Middle ring */}
      <View style={[glowStyles.midRing, { borderColor: color }]} />
    </View>
  );
}

const glowStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    opacity: 0.12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
  },
  midRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    opacity: 0.08,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors, resolvedMode), [colors, resolvedMode]);
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  async function handleGoogleSignIn() {
    haptic.primaryCTA();
    setLoading('google');
    try {
      await initiateGoogleOAuth();
      // On success, useAuth listener in _layout.tsx will auto-redirect
    } catch {
      // User cancelled or network error — just reset
    }
    setLoading(null);
  }

  async function handleAppleSignIn() {
    haptic.primaryCTA();
    setLoading('apple');
    try {
      await initiateAppleSignIn();
    } catch {
      // User cancelled or network error
    }
    setLoading(null);
  }

  // Guideline 5.1.1 — core functionality must be available without an account.
  async function handleExploreAsGuest() {
    haptic.primaryCTA();
    await enableGuestMode();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={backdropColors(resolvedMode)}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <AmbientOrbs />

      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* Top spacer */}
        <View />

        {/* Hero — open layout, no card */}
        <View style={styles.heroSection}>
          {/* Icon with glow rings */}
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.iconContainer}
          >
            <HeroGlowRing color={colors.accent.blue} />
            <View style={styles.iconCircle}>
              <AuraSymbol name="sparkles" size={40} color={colors.accent.blue} />
            </View>
          </Animated.View>

          {/* Brand name */}
          <Animated.View entering={FadeInDown.delay(STAGGER_MS).duration(400)}>
            <Text style={styles.brand}>chronos</Text>
          </Animated.View>

          {/* Headline */}
          <Animated.View entering={FadeInDown.delay(STAGGER_MS * 2).duration(400)}>
            <Text style={styles.headline}>Your homework{'\n'}brain.</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.View entering={FadeInDown.delay(STAGGER_MS * 3).duration(400)}>
            <Text style={styles.tagline}>
              Connects your classes. Grades your workload.{'\n'}Builds a calm schedule every night.
            </Text>
          </Animated.View>
        </View>

        {/* Auth buttons */}
        <Animated.View
          entering={FadeInUp.delay(STAGGER_MS * 4).duration(400)}
          style={styles.ctaWrap}
        >
          <View style={styles.buttonStack}>
            <AuraButton
              label="Continue with Google"
              variant="outline"
              size="lg"
              fullWidth
              onPress={handleGoogleSignIn}
              icon={<GoogleIcon size={20} />}
              style={styles.googleButton}
              loading={loading === 'google'}
              disabled={loading !== null}
            />
            {isAppleSignInAvailable && (
              <>
                <View style={styles.buttonGap} />
                <AuraButton
                  label="Continue with Apple"
                  size="lg"
                  fullWidth
                  onPress={handleAppleSignIn}
                  icon={<AppleIcon size={20} color={colors.text.inverse} />}
                  style={styles.appleButton}
                  loading={loading === 'apple'}
                  disabled={loading !== null}
                />
              </>
            )}
            <View style={styles.buttonGap} />
            <AuraButton
              label="Explore without an account"
              variant="ghost"
              size="lg"
              fullWidth
              onPress={handleExploreAsGuest}
              disabled={loading !== null}
            />
          </View>
          <Text style={styles.disclaimer}>
            No schedules change without your approval.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors, mode: ResolvedMode) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    container: {
      flex: 1,
      paddingHorizontal: spacing.screenPadding,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroSection: {
      alignItems: 'center',
      gap: spacing.md,
    },
    iconContainer: {
      width: 140,
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.glass.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border.accent,
    },
    brand: {
      ...typography.caption,
      fontSize: 14,
      letterSpacing: 6,
      textTransform: 'uppercase',
      color: c.accent.blue,
      textAlign: 'center',
    },
    headline: {
      ...typography.largeTitle,
      color: c.text.primary,
      textAlign: 'center',
      lineHeight: 46,
    },
    tagline: {
      ...typography.body,
      color: c.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
      marginTop: spacing.xs,
    },
    ctaWrap: {
      width: '100%',
      maxWidth: 360,
      alignItems: 'center',
    },
    buttonStack: {
      width: '100%',
    },
    googleButton: {
      backgroundColor: mode === 'dark' ? c.glass.light : c.background.elevated,
      borderColor: mode === 'dark' ? c.border.glass : c.border.subtle,
      borderWidth: 1,
    },
    // Apple Sign In Button HIG requires pure white-on-black or black-on-white —
    // theme tokens (#F1F5F9 / #0F172A) would violate Apple's brand guidelines.
    appleButton: {
      backgroundColor: mode === 'dark' ? '#FFFFFF' : '#000000',
    },
    buttonGap: {
      height: spacing.sm,
    },
    disclaimer: {
      ...typography.callout,
      marginTop: spacing.lg,
      color: c.text.tertiary,
      textAlign: 'center',
    },
  });
}
