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
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme, type ResolvedMode } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { haptic } from '../../lib/haptics';

function trackBg(mode: ResolvedMode): string {
  return mode === 'light' ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)';
}

function trackCenterLineBg(mode: ResolvedMode): string {
  return mode === 'light' ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.15)';
}

function peakBarBg(mode: ResolvedMode): string {
  return mode === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.04)';
}

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
// Velocity row — subject with animated multiplier bar
// ---------------------------------------------------------------------------

interface VelocityRowProps {
  subject: string;
  tint: string;
  /** 1.0 = exactly as estimated. >1 = slower than estimated. <1 = faster. */
  multiplier: number;
  confidence: number; // 0–1
  delay?: number;
  colors: ThemeColors;
  velocityStyles: ReturnType<typeof makeVelocityStyles>;
}

function VelocityRow({
  subject,
  tint,
  multiplier,
  confidence,
  delay = 0,
  colors,
  velocityStyles,
}: VelocityRowProps) {
  const fillProgress = useSharedValue(0);

  useEffect(() => {
    // Map multiplier range [0.6 .. 1.4] to [0..1] for bar position
    const clamped = Math.max(0.6, Math.min(1.4, multiplier));
    const normalized = (clamped - 0.6) / 0.8;
    fillProgress.value = withDelay(
      delay,
      withTiming(normalized, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [multiplier, delay, fillProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    left: `${fillProgress.value * 100}%`,
  }));

  const label =
    multiplier > 1.05
      ? `${Math.round((multiplier - 1) * 100)}% longer`
      : multiplier < 0.95
        ? `${Math.round((1 - multiplier) * 100)}% faster`
        : 'On target';

  const labelColor =
    multiplier > 1.1
      ? colors.accent.coral
      : multiplier < 0.9
        ? colors.accent.emerald
        : colors.accent.sky;

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(500)}
      style={velocityStyles.row}
    >
      <View style={velocityStyles.topRow}>
        <View style={velocityStyles.subjectWrap}>
          <View style={[velocityStyles.dot, { backgroundColor: tint }]} />
          <Text style={velocityStyles.subject}>{subject}</Text>
        </View>
        <Text style={[velocityStyles.delta, { color: labelColor }]}>{label}</Text>
      </View>
      <View style={velocityStyles.track}>
        <View style={velocityStyles.trackCenterLine} />
        <Animated.View style={[velocityStyles.marker, { backgroundColor: tint }, fillStyle]} />
      </View>
      <View style={velocityStyles.confidenceRow}>
        <Text style={velocityStyles.confidenceLabel}>
          Confidence · based on {Math.round(confidence * 30)} tasks
        </Text>
      </View>
    </Animated.View>
  );
}

function makeVelocityStyles(c: ThemeColors, mode: ResolvedMode) {
  return StyleSheet.create({
    row: {
      gap: 8,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    subjectWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    subject: {
      ...typography.bodyMedium,
      color: c.text.primary,
    },
    delta: {
      ...typography.callout,
      fontVariant: ['tabular-nums'],
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: trackBg(mode),
      position: 'relative',
      overflow: 'visible',
    } as ViewStyle,
    trackCenterLine: {
      position: 'absolute',
      left: '50%',
      top: -2,
      bottom: -2,
      width: 1,
      backgroundColor: trackCenterLineBg(mode),
    },
    marker: {
      position: 'absolute',
      top: -4,
      width: 14,
      height: 14,
      borderRadius: 7,
      marginLeft: -7,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
    },
    confidenceRow: {
      marginTop: 2,
    },
    confidenceLabel: {
      ...typography.micro,
      color: c.text.tertiary,
      textTransform: 'none',
    },
  });
}

// ---------------------------------------------------------------------------
// Peak time card — when the user is most productive
// ---------------------------------------------------------------------------

interface PeakBarProps {
  label: string;
  score: number; // 0–1
  tint: string;
  delay?: number;
  peakStyles: ReturnType<typeof makePeakStyles>;
}

function PeakBar({ label, score, tint, delay = 0, peakStyles }: PeakBarProps) {
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withDelay(
      delay,
      withSpring(score, { damping: 14, stiffness: 140 }),
    );
  }, [score, delay, height]);

  const fillStyle = useAnimatedStyle(() => ({
    height: `${height.value * 100}%`,
  }));

  return (
    <View style={peakStyles.col}>
      <View style={peakStyles.barWrap}>
        <Animated.View style={[peakStyles.bar, { backgroundColor: tint }, fillStyle]} />
      </View>
      <Text style={peakStyles.label}>{label}</Text>
    </View>
  );
}

function makePeakStyles(c: ThemeColors, mode: ResolvedMode) {
  return StyleSheet.create({
    col: {
      flex: 1,
      alignItems: 'center',
      gap: 8,
    },
    barWrap: {
      width: 22,
      height: 80,
      justifyContent: 'flex-end',
      backgroundColor: peakBarBg(mode),
      borderRadius: 11,
      overflow: 'hidden',
    },
    bar: {
      width: '100%',
      borderRadius: 11,
      shadowColor: c.accent.sky,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    } as ViewStyle,
    label: {
      ...typography.micro,
      color: c.text.tertiary,
    },
  });
}

// ---------------------------------------------------------------------------
// Insight row — Chronos's narrative findings
// ---------------------------------------------------------------------------

interface InsightRowProps {
  icon: string;
  tint: string;
  title: string;
  body: string;
  isLast?: boolean;
  insightStyles: ReturnType<typeof makeInsightStyles>;
}

function InsightRow({ icon, tint, title, body, isLast = false, insightStyles }: InsightRowProps) {
  return (
    <>
      <View style={insightStyles.row}>
        <View style={[insightStyles.iconBox, { backgroundColor: tint + '22' }]}>
          <AuraSymbol name={icon} size={14} color={tint} weight="semibold" />
        </View>
        <View style={insightStyles.textCol}>
          <Text style={insightStyles.title}>{title}</Text>
          <Text style={insightStyles.body}>{body}</Text>
        </View>
      </View>
      {!isLast ? <View style={insightStyles.divider} /> : null}
    </>
  );
}

function makeInsightStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: 14,
    },
    iconBox: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    textCol: {
      flex: 1,
    },
    title: {
      ...typography.bodyMedium,
      color: c.text.primary,
    },
    body: {
      ...typography.callout,
      color: c.text.secondary,
      marginTop: 4,
      lineHeight: 18,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border.subtle,
      marginLeft: spacing.cardPadding + 40,
    },
  });
}

// ---------------------------------------------------------------------------
// Mock data — tints resolved at render against the active theme
// ---------------------------------------------------------------------------

type AccentKey = 'coral' | 'blue' | 'emerald' | 'violet' | 'amber' | 'sky';

interface VelocityData {
  subject: string;
  tintKey: AccentKey;
  multiplier: number;
  confidence: number;
}

const MOCK_VELOCITY: VelocityData[] = [
  { subject: 'US History', tintKey: 'coral',   multiplier: 1.22, confidence: 0.8 },
  { subject: 'Calculus',   tintKey: 'blue',    multiplier: 0.94, confidence: 0.9 },
  { subject: 'Biology',    tintKey: 'emerald', multiplier: 1.02, confidence: 0.7 },
  { subject: 'English',    tintKey: 'violet',  multiplier: 1.08, confidence: 0.6 },
  { subject: 'Spanish',    tintKey: 'amber',   multiplier: 0.88, confidence: 0.5 },
];

interface PeakData {
  label: string;
  score: number;
  tintKey: AccentKey;
}

const MOCK_PEAKS: PeakData[] = [
  { label: '6A',  score: 0.15, tintKey: 'sky' },
  { label: '9A',  score: 0.35, tintKey: 'sky' },
  { label: '12P', score: 0.55, tintKey: 'sky' },
  { label: '3P',  score: 0.82, tintKey: 'sky' },
  { label: '6P',  score: 0.96, tintKey: 'sky' },
  { label: '9P',  score: 0.64, tintKey: 'sky' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function BrainViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const orbStyles = useMemo(() => makeOrbStyles(colors), [colors]);
  const velocityStyles = useMemo(
    () => makeVelocityStyles(colors, resolvedMode),
    [colors, resolvedMode],
  );
  const peakStyles = useMemo(() => makePeakStyles(colors, resolvedMode), [colors, resolvedMode]);
  const insightStyles = useMemo(() => makeInsightStyles(colors), [colors]);

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
          <Text style={styles.eyebrow}>AURA&apos;S BRAIN</Text>
          <Text style={styles.title}>What I&apos;ve learned</Text>
          <Text style={styles.subtitle}>
            Every time you finish a task, Chronos updates its model of how you work.
            This is what it knows so far.
          </Text>
        </Animated.View>

        {/* Velocity — time estimates per subject */}
        <Text style={styles.sectionLabel}>VELOCITY PER SUBJECT</Text>
        <Animated.View entering={FadeInUp.delay(240).duration(500)}>
          <GlassCard intensity="light" style={styles.velocityCard}>
            <View style={styles.velocityHeader}>
              <Text style={styles.velocityHeaderLabel}>FASTER</Text>
              <Text style={styles.velocityHeaderLabel}>ON TARGET</Text>
              <Text style={styles.velocityHeaderLabel}>SLOWER</Text>
            </View>
            <View style={styles.velocityList}>
              {MOCK_VELOCITY.map((v, i) => (
                <VelocityRow
                  key={v.subject}
                  subject={v.subject}
                  tint={colors.accent[v.tintKey]}
                  multiplier={v.multiplier}
                  confidence={v.confidence}
                  delay={280 + i * 70}
                  colors={colors}
                  velocityStyles={velocityStyles}
                />
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Peak productivity times */}
        <Text style={styles.sectionLabel}>PEAK TIMES</Text>
        <Animated.View entering={FadeInUp.delay(620).duration(500)}>
          <GlassCard intensity="light" style={styles.peakCard}>
            <Text style={styles.peakTitle}>You&apos;re strongest in the late afternoon</Text>
            <View style={styles.peakChart}>
              {MOCK_PEAKS.map((p, i) => (
                <PeakBar
                  key={p.label}
                  label={p.label}
                  score={p.score}
                  tint={colors.accent[p.tintKey]}
                  delay={700 + i * 60}
                  peakStyles={peakStyles}
                />
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Insights — narrative findings */}
        <Text style={styles.sectionLabel}>RECENT INSIGHTS</Text>
        <Animated.View entering={FadeInUp.delay(780).duration(500)}>
          <GlassCard intensity="light" style={styles.insightsCard}>
            <InsightRow
              icon="waveform"
              tint={colors.accent.sky}
              title="Essays run long for you"
              body="History and English writing tasks consistently take 20–25% longer than the initial estimate. Next week I'll pad those blocks by default."
              insightStyles={insightStyles}
            />
            <InsightRow
              icon="bolt.fill"
              tint={colors.accent.amber}
              title="You're faster in short bursts"
              body="Problem sets finished 12% faster when scheduled in 45-minute blocks vs 90-minute blocks."
              insightStyles={insightStyles}
            />
            <InsightRow
              icon="moon.fill"
              tint={colors.accent.blue}
              title="Late-night work drifts"
              body="Tasks scheduled after 9 PM are 3× more likely to get rescheduled. I'll avoid putting anything important there."
              isLast
              insightStyles={insightStyles}
            />
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
