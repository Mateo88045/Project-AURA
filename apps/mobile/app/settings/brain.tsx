import { useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { haptic } from '../../lib/haptics';

// ---------------------------------------------------------------------------
// Brain orb — pulsing violet sphere at hero. Symbolizes the learned model.
// ---------------------------------------------------------------------------

interface BrainOrbProps {
  colors: ThemeColors;
  orbStyles: ReturnType<typeof makeOrbStyles>;
}

function BrainOrb({ colors, orbStyles }: BrainOrbProps) {
  const pulse = useSharedValue(0.85);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.85, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.5, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse, glow]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={[orbStyles.wrap, { pointerEvents: 'none' }]}>
      {/* Mist halo + Steel core. Two hues, same family. The brain orb shares
          the same atmospheric vocabulary as the AI hub orb — no violet, no
          tertiary "logo gradient" hue. */}
      <Animated.View style={[orbStyles.glow, glowStyle]}>
        <LinearGradient
          colors={[colors.accent.sky + '55', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      <Animated.View style={[orbStyles.core, orbStyle]}>
        <LinearGradient
          colors={[colors.accent.sky, colors.accent.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={orbStyles.specular} />
        <AuraSymbol name="brain" size={32} color={colors.text.inverse} weight="semibold" />
      </Animated.View>
    </View>
  );
}

function makeOrbStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 140,
    },
    glow: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      overflow: 'hidden',
    },
    core: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      shadowColor: c.accent.sky,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
    },
    specular: {
      position: 'absolute',
      top: 10,
      left: 14,
      width: 22,
      height: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
  });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function BrainViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const orbStyles = useMemo(() => makeOrbStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <AmbientOrbs />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.headerRow}>
          <Pressable
            hitSlop={12}
            onPress={() => {
              haptic.secondary();
              router.back();
            }}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <AuraSymbol name="chevron.left" size={22} color={colors.text.primary} />
          </Pressable>
        </Animated.View>

        {/* Brain orb */}
        <BrainOrb colors={colors} orbStyles={orbStyles} />

        {/* Title */}
        <Animated.View entering={FadeInUp.delay(180).duration(500)} style={styles.titleBlock}>
          <Text style={styles.eyebrow}>CHRONOS&apos;S BRAIN</Text>
          <Text style={styles.title}>What I&apos;ve learned</Text>
          <Text style={styles.subtitle}>
            Every time you finish a task, Chronos updates its model of how you work.
            This is what it knows so far.
          </Text>
        </Animated.View>

        {/* Empty state — pace data not yet learned */}
        <Animated.View entering={FadeInUp.delay(240).duration(500)}>
          <GlassCard intensity="light" style={{ padding: spacing.cardPadding, alignItems: 'center', gap: 8 }}>
            <AuraSymbol name="brain" size={24} color={colors.text.tertiary} />
            <Text style={{ ...typography.bodyMedium, color: colors.text.secondary, textAlign: 'center' }}>
              Chronos learns your pace after you complete a few tasks. Check back soon.
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Footnote */}
        <Animated.View entering={FadeIn.delay(860).duration(500)} style={styles.footnote}>
          <Text style={styles.footnoteText}>
            This model is read-only. To change how Chronos schedules, adjust your
            guardrails or leave feedback when completing tasks.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    scrollContent: {
      paddingHorizontal: spacing.screenPadding,
    },

    // Header
    headerRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    } as ViewStyle,

    // Title
    titleBlock: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    eyebrow: {
      ...typography.caption,
      color: c.accent.sky,
      marginBottom: 6,
    },
    title: {
      ...typography.displayMedium,
      color: c.text.primary,
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.body,
      color: c.text.secondary,
      lineHeight: 22,
      textAlign: 'center',
      paddingHorizontal: spacing.md,
    },

    // Section label
    sectionLabel: {
      ...typography.caption,
      color: c.text.tertiary,
      marginTop: spacing.xl,
      marginBottom: 10,
      paddingHorizontal: 4,
    },

    // Velocity card
    velocityCard: {
      padding: spacing.cardPadding,
      gap: spacing.md,
    },
    velocityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    velocityHeaderLabel: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    velocityList: {
      gap: spacing.lg,
    },

    // Peak card
    peakCard: {
      padding: spacing.cardPadding,
      gap: spacing.md,
    },
    peakTitle: {
      ...typography.bodyMedium,
      color: c.text.primary,
    },
    peakChart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },

    // Insights
    insightsCard: {
      paddingVertical: 4,
    },

    // Footnote
    footnote: {
      marginTop: spacing.lg,
      paddingHorizontal: 4,
    },
    footnoteText: {
      ...typography.callout,
      color: c.text.tertiary,
      lineHeight: 18,
    },
  });
}
