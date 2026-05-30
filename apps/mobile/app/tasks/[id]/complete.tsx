import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Springs } from '@chronos/shared/constants/motion';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../../lib/theme';
import { AmbientOrbs } from '../../../components/ui/AmbientOrbs';
import { GlassCard } from '../../../components/ui/GlassCard';
import { AuraSymbol } from '../../../components/ui/AuraSymbol';
import { AuraButton } from '../../../components/ui/AuraButton';
import { AuraSkeleton } from '../../../components/ui/AuraSkeleton';
import { ConfettiBlast } from '../../../components/ui/ConfettiBlast';
import { StreakBadge } from '../../../components/ui/StreakBadge';
import { useAuraToast } from '../../../components/ui/AuraToast';
import { useTaskDetail } from '../../../hooks/useTaskDetail';
import { useStreak } from '../../../hooks/useStreak';
import { useAuth } from '../../../hooks/useAuth';
import { haptic } from '../../../lib/haptics';
import type { UserFeedback } from '@chronos/shared/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Success checkmark — scales in with a bouncy spring, then pulses a subtle glow
// ---------------------------------------------------------------------------

interface SuccessMarkProps {
  colors: ThemeColors;
  /** When true, triggers the particle burst. Default true. */
  burst?: boolean;
}

function SuccessMark({ colors, burst = true }: SuccessMarkProps) {
  const scale = useSharedValue(0);
  const glow = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      80,
      withSpring(1, { damping: 10, stiffness: 180, mass: 1 }),
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.55, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [scale, glow]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={[successStyles.wrap, { pointerEvents: 'none' }]}>
      <Animated.View style={[successStyles.glow, glowStyle]}>
        <LinearGradient
          colors={[colors.accent.emerald + '44', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      <Animated.View style={[successStyles.disc, markStyle]}>
        <LinearGradient
          colors={[colors.accent.emerald, colors.accent.emerald + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <AuraSymbol name="checkmark" size={34} color={colors.text.inverse} weight="bold" />
      </Animated.View>
      {burst && <ParticleBurst colors={colors} />}
    </View>
  );
}

const successStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
  },
  disc: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

// ---------------------------------------------------------------------------
// Particle burst — 12 colored dots that explode outward from the success mark
// on mount. Each is its own component so hooks stay at component level.
// ---------------------------------------------------------------------------

interface ParticleProps {
  angle: number;      // degrees
  distance: number;   // px
  color: string;
  delay: number;      // ms
  size: number;       // diameter px
}

function Particle({ angle, distance, color, delay, size }: ParticleProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const rad = (angle * Math.PI) / 180;
    const targetX = Math.cos(rad) * distance;
    const targetY = Math.sin(rad) * distance;

    tx.value = withDelay(delay, withSpring(targetX, Springs.bouncy));
    ty.value = withDelay(delay, withSpring(targetY, Springs.bouncy));
    opacity.value = withDelay(delay + 220, withTiming(0, { duration: 380 }));
    scale.value = withDelay(delay + 100, withTiming(0.3, { duration: 500 }));
  }, [angle, distance, delay, tx, ty, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        particleStyles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animStyle,
      ]}
    />
  );
}

const particleStyles = StyleSheet.create({
  burstWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
});

interface ParticleBurstProps {
  colors: ThemeColors;
}

// 12 particles, evenly fanned 360°. Alternating distance and size for variety.
const PARTICLE_CONFIG = [
  { angle: 0,   distance: 70, size: 8 },
  { angle: 30,  distance: 52, size: 6 },
  { angle: 60,  distance: 80, size: 7 },
  { angle: 90,  distance: 56, size: 9 },
  { angle: 120, distance: 75, size: 6 },
  { angle: 150, distance: 50, size: 8 },
  { angle: 180, distance: 72, size: 7 },
  { angle: 210, distance: 55, size: 6 },
  { angle: 240, distance: 78, size: 8 },
  { angle: 270, distance: 52, size: 9 },
  { angle: 300, distance: 68, size: 6 },
  { angle: 330, distance: 58, size: 7 },
] as const;

function ParticleBurst({ colors }: ParticleBurstProps) {
  // Colors cycle through the palette — emerald, sky, blue, amber
  const palette = [
    colors.accent.emerald,
    colors.accent.sky,
    colors.accent.blue,
    colors.accent.amber,
  ];

  return (
    <View style={[particleStyles.burstWrap, { pointerEvents: 'none' }]}>
      {PARTICLE_CONFIG.map((p, i) => (
        <Particle
          key={i}
          angle={p.angle}
          distance={p.distance}
          size={p.size}
          color={palette[i % palette.length]}
          delay={i * 18}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Feedback chip — one of three options
// ---------------------------------------------------------------------------

interface FeedbackChipProps {
  label: string;
  emoji: string;
  value: UserFeedback;
  selected: boolean;
  onPress: (value: UserFeedback) => void;
  colors: ThemeColors;
  chipStyles: ReturnType<typeof makeChipStyles>;
}

function FeedbackChip({
  label,
  emoji,
  value,
  selected,
  onPress,
  colors,
  chipStyles,
}: FeedbackChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 18, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 400 });
      }}
      onPress={() => {
        haptic.selection();
        onPress(value);
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[
        chipStyles.chip,
        selected && chipStyles.chipSelected,
        animatedStyle,
      ]}
    >
      <Text style={chipStyles.emoji}>{emoji}</Text>
      <Text
        style={[
          chipStyles.label,
          selected && { color: colors.accent.blue },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function makeChipStyles(c: ThemeColors) {
  return StyleSheet.create({
    chip: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: radius.md,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    } as ViewStyle,
    chipSelected: {
      backgroundColor: c.glass.accent,
      borderColor: c.accent.blue,
    },
    emoji: {
      fontSize: 24,
    },
    label: {
      ...typography.callout,
      color: c.text.secondary,
      textAlign: 'center',
    },
  });
}

// ---------------------------------------------------------------------------
// Minute stepper — ±5 minute adjustments to actual time
// ---------------------------------------------------------------------------

interface MinuteStepperProps {
  value: number;
  onChange: (v: number) => void;
  stepperStyles: ReturnType<typeof makeStepperStyles>;
}

function MinuteStepper({ value, onChange, stepperStyles }: MinuteStepperProps) {
  function step(delta: number) {
    const next = Math.max(5, value + delta);
    haptic.selection();
    onChange(next);
  }

  return (
    <View style={stepperStyles.row}>
      <Pressable
        onPress={() => step(-5)}
        hitSlop={12}
        style={stepperStyles.btn}
        accessibilityRole="button"
        accessibilityLabel="Decrease by 5 minutes"
      >
        <Text style={stepperStyles.btnText}>−</Text>
      </Pressable>
      <View style={stepperStyles.valueBox}>
        <Text style={stepperStyles.valueNum}>{value}</Text>
        <Text style={stepperStyles.valueUnit}>min</Text>
      </View>
      <Pressable
        onPress={() => step(5)}
        hitSlop={12}
        style={stepperStyles.btn}
        accessibilityRole="button"
        accessibilityLabel="Increase by 5 minutes"
      >
        <Text style={stepperStyles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

function makeStepperStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      paddingVertical: spacing.md,
    },
    btn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    btnText: {
      ...typography.title1,
      color: c.text.primary,
      marginTop: -2,
    },
    valueBox: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      minWidth: 120,
      justifyContent: 'center',
    },
    valueNum: {
      ...typography.displayLarge,
      color: c.text.primary,
      fontVariant: ['tabular-nums'],
    },
    valueUnit: {
      ...typography.title2,
      color: c.text.secondary,
    },
  });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function TaskCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const chipStyles = useMemo(() => makeChipStyles(colors), [colors]);
  const stepperStyles = useMemo(() => makeStepperStyles(colors), [colors]);
  const toast = useAuraToast();
  const { user: authUser } = useAuth();
  const { incrementStreak } = useStreak(authUser?.id ?? '');

  const { id } = useLocalSearchParams<{ id: string }>();
  const { task, loading } = useTaskDetail(id ?? '');

  const [actualMinutes, setActualMinutes] = useState<number>(0);
  const [feedback, setFeedback] = useState<UserFeedback | null>(null);
  const [saving, setSaving] = useState(false);
  const [confettiPlaying, setConfettiPlaying] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [streakMilestone, setStreakMilestone] = useState(false);
  const [streakVisible, setStreakVisible] = useState(false);

  useEffect(() => {
    if (task && actualMinutes === 0) {
      setActualMinutes(task.estimatedMinutes);
    }
  }, [task, actualMinutes]);

  if (loading) {
    return (
      <View style={styles.root}>
        <AmbientOrbs />
        <View style={[styles.loadingWrap, { paddingTop: insets.top + 24, paddingHorizontal: spacing.screenPadding }]}>
          <AuraSkeleton height={72} style={{ marginBottom: 12 }} />
          <AuraSkeleton height={120} style={{ marginBottom: 12 }} />
          <AuraSkeleton height={80} />
        </View>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.root}>
        <AmbientOrbs />
        <View style={[styles.loadingWrap, { paddingTop: insets.top + 40 }]}>
          <Text style={styles.loadingText}>Task not found.</Text>
        </View>
      </View>
    );
  }

  const delta = actualMinutes - task.estimatedMinutes;
  const deltaLabel =
    delta === 0
      ? 'Right on'
      : delta > 0
        ? `${delta}m longer`
        : `${Math.abs(delta)}m faster`;
  const deltaColor =
    delta === 0 ? colors.accent.emerald : Math.abs(delta) > 20 ? colors.accent.coral : colors.accent.amber;

  async function save() {
    if (saving) return;
    setSaving(true);

    // Double-punch haptic: success → primaryCTA 280ms later
    haptic.success();
    setTimeout(() => haptic.primaryCTA(), 280);

    // Fire confetti simultaneously
    setConfettiPlaying(true);
    setTimeout(() => setConfettiPlaying(false), 2200);

    // TODO: Supabase — insert into task_completions with { task_id, user_id, estimated_minutes, actual_minutes, user_feedback, completed_at }
    const streakResult = await incrementStreak();

    toast.show('Nice work!', 'success');

    if (streakResult.currentStreak >= 2) {
      setStreakCount(streakResult.currentStreak);
      setStreakMilestone(streakResult.milestoneReached);
      setStreakVisible(true);
    }

    setSaving(false);

    setTimeout(() => {
      router.back();
    }, streakResult.currentStreak >= 2 ? 2000 : 600);
  }

  return (
    <View style={styles.root}>
      <AmbientOrbs />
      <ConfettiBlast playing={confettiPlaying} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Close */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.headerRow}>
          <Pressable
            hitSlop={12}
            onPress={() => {
              haptic.secondary();
              router.back();
            }}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <AuraSymbol name="xmark" size={18} color={colors.text.secondary} />
          </Pressable>
        </Animated.View>

        {/* Success mark */}
        <SuccessMark colors={colors} />

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.headerText}>
          <Text style={styles.eyebrow}>TASK COMPLETE</Text>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.sub}>{task.subject}</Text>
        </Animated.View>

        {/* Time comparison */}
        <Animated.View entering={FadeInDown.delay(240).duration(500)}>
          <GlassCard intensity="light" borderAccent style={styles.timeCard}>
            <Text style={styles.sectionLabel}>HOW LONG DID IT TAKE?</Text>
            <MinuteStepper
              value={actualMinutes}
              onChange={setActualMinutes}
              stepperStyles={stepperStyles}
            />
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCol}>
                <Text style={styles.comparisonLabel}>ESTIMATED</Text>
                <Text style={styles.comparisonValue}>{task.estimatedMinutes}m</Text>
              </View>
              <View style={styles.comparisonDivider} />
              <View style={styles.comparisonCol}>
                <Text style={styles.comparisonLabel}>DIFFERENCE</Text>
                <Text style={[styles.comparisonValue, { color: deltaColor }]}>
                  {deltaLabel}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Feedback chips */}
        <Animated.View
          entering={FadeInDown.delay(320).duration(500)}
          style={styles.feedbackBlock}
        >
          <Text style={styles.sectionLabel}>HOW DID IT FEEL?</Text>
          <View style={styles.chipsRow}>
            <FeedbackChip
              label="Too long"
              emoji="😩"
              value="too_long"
              selected={feedback === 'too_long'}
              onPress={setFeedback}
              colors={colors}
              chipStyles={chipStyles}
            />
            <FeedbackChip
              label="Just right"
              emoji="😌"
              value="about_right"
              selected={feedback === 'about_right'}
              onPress={setFeedback}
              colors={colors}
              chipStyles={chipStyles}
            />
            <FeedbackChip
              label="Too short"
              emoji="⚡"
              value="too_short"
              selected={feedback === 'too_short'}
              onPress={setFeedback}
              colors={colors}
              chipStyles={chipStyles}
            />
          </View>
        </Animated.View>

        {/* Streak badge — slides up after saving */}
        <StreakBadge
          streak={streakCount}
          visible={streakVisible}
          isMilestone={streakMilestone}
        />

        {/* Save */}
        <Animated.View
          entering={FadeInDown.delay(420).duration(500)}
          style={styles.saveRow}
        >
          <AuraButton
            label="Save feedback"
            variant="primary"
            size="lg"
            fullWidth
            disabled={!feedback}
            loading={saving}
            onPress={() => {
              void save();
            }}
          />
          <Text style={styles.footnote}>
            Chronos uses this to calibrate your velocity estimate.
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
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
    },
    loadingText: {
      ...typography.body,
      color: c.text.tertiary,
    },

    // Header
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: spacing.xs,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },

    // Header text
    headerText: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    eyebrow: {
      ...typography.caption,
      color: c.accent.emerald,
      marginBottom: 6,
    },
    title: {
      ...typography.title1,
      color: c.text.primary,
      textAlign: 'center',
    },
    sub: {
      ...typography.callout,
      color: c.text.tertiary,
      marginTop: 4,
    },

    // Time card
    timeCard: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.cardPadding,
    },
    sectionLabel: {
      ...typography.caption,
      color: c.text.tertiary,
      textAlign: 'center',
    },
    comparisonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    comparisonCol: {
      flex: 1,
      alignItems: 'center',
    },
    comparisonLabel: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    comparisonValue: {
      ...typography.title2,
      color: c.text.primary,
      marginTop: 4,
    },
    comparisonDivider: {
      width: StyleSheet.hairlineWidth,
      height: 32,
      backgroundColor: c.border.subtle,
    },

    // Feedback block
    feedbackBlock: {
      marginTop: spacing.xl,
      gap: spacing.md,
    },
    chipsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },

    // Save
    saveRow: {
      marginTop: spacing.xxl,
      gap: spacing.md,
    },
    footnote: {
      ...typography.callout,
      color: c.text.tertiary,
      textAlign: 'center',
    },
  });
}
