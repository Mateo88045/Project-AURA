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
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../lib/theme';
import { AmbientOrbs } from '../components/ui/AmbientOrbs';
import { GlassCard } from '../components/ui/GlassCard';
import { AuraSymbol } from '../components/ui/AuraSymbol';
import { AuraButton } from '../components/ui/AuraButton';
import { CountUpText } from '../components/ui/CountUpText';
import { haptic } from '../lib/haptics';

// ---------------------------------------------------------------------------
// Stat card — big number over a label, with a delayed count-up feel via
// scale spring on mount
// ---------------------------------------------------------------------------

interface StatCardProps {
  /** Numeric value to animate up to */
  numericValue: number;
  unit?: string;
  label: string;
  tint: string;
  delay?: number;
  statStyles: ReturnType<typeof makeStatStyles>;
}

function StatCard({ numericValue, unit, label, tint, delay = 0, statStyles }: StatCardProps) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 14, stiffness: 180 }),
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[statStyles.wrap, animatedStyle]}>
      <GlassCard intensity="light" style={statStyles.card}>
        <LinearGradient
          colors={[tint + '1E', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={statStyles.valueRow}>
          <CountUpText
            value={numericValue}
            duration={800 + delay}
            style={[statStyles.value, { color: tint }]}
          />
          {unit ? <Text style={statStyles.unit}>{unit}</Text> : null}
        </View>
        <Text style={statStyles.label}>{label}</Text>
      </GlassCard>
    </Animated.View>
  );
}

function makeStatStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
    },
    card: {
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: spacing.lg,
      overflow: 'hidden',
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    value: {
      ...typography.displayLarge,
      lineHeight: 38,
    },
    unit: {
      ...typography.title2,
      color: c.text.secondary,
    },
    label: {
      ...typography.caption,
      color: c.text.tertiary,
      marginTop: 6,
    },
  });
}

// ---------------------------------------------------------------------------
// Subject bar — horizontal fill with label + hours
// ---------------------------------------------------------------------------

interface SubjectBarProps {
  subject: string;
  hours: number;
  maxHours: number;
  tint: string;
  delay?: number;
  barStyles: ReturnType<typeof makeBarStyles>;
}

function SubjectBar({ subject, hours, maxHours, tint, delay = 0, barStyles }: SubjectBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(hours / maxHours, { duration: 800 }),
    );
  }, [hours, maxHours, delay, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400)} style={barStyles.row}>
      <View style={barStyles.topRow}>
        <Text style={barStyles.subject}>{subject}</Text>
        <Text style={barStyles.hours}>{hours}h</Text>
      </View>
      <View style={barStyles.track}>
        <Animated.View style={[barStyles.fill, { backgroundColor: tint }, fillStyle]} />
      </View>
    </Animated.View>
  );
}

function makeBarStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      gap: 6,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    subject: {
      ...typography.bodyMedium,
      color: c.text.primary,
    },
    hours: {
      ...typography.callout,
      color: c.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.background.surface,
      overflow: 'hidden',
    } as ViewStyle,
    fill: {
      height: '100%',
      borderRadius: 3,
    } as ViewStyle,
  });
}

// ---------------------------------------------------------------------------
// Mock data — subject tints are resolved in-component from the active theme
// ---------------------------------------------------------------------------

interface SubjectRow {
  subject: string;
  hours: number;
  tintKey: 'coral' | 'blue' | 'emerald' | 'violet' | 'amber';
}

const MOCK_SUBJECTS: SubjectRow[] = [
  { subject: 'US History', hours: 5.5, tintKey: 'coral' },
  { subject: 'Calculus',   hours: 4.0, tintKey: 'blue' },
  { subject: 'Biology',    hours: 3.0, tintKey: 'emerald' },
  { subject: 'English',    hours: 2.5, tintKey: 'violet' },
  { subject: 'Spanish',    hours: 1.5, tintKey: 'amber' },
];

const MOCK_UPCOMING = [
  { id: 'u1', subject: 'US History', task: 'Industrial Revolution essay', due: 'Mon' },
  { id: 'u2', subject: 'Calculus', task: 'Integration problem set', due: 'Tue' },
  { id: 'u3', subject: 'Biology', task: 'Cell division quiz prep', due: 'Wed' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function BriefingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const statStyles = useMemo(() => makeStatStyles(colors), [colors]);
  const barStyles = useMemo(() => makeBarStyles(colors), [colors]);

  const maxHours = Math.max(...MOCK_SUBJECTS.map((s) => s.hours));
  const totalHours = MOCK_SUBJECTS.reduce((sum, s) => sum + s.hours, 0);

  return (
    <View style={styles.root}>
      <AmbientOrbs />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.headerRow}>
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

        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(60).duration(500)}>
          <Text style={styles.eyebrow}>SUNDAY BRIEFING</Text>
          <Text style={styles.title}>Last week, in review</Text>
          <Text style={styles.subtitle}>
            You stayed on plan 6 out of 7 days. Here&apos;s what the week looked like.
          </Text>
        </Animated.View>

        {/* Stat grid */}
        <View style={styles.statGrid}>
          <StatCard
            numericValue={23}
            label="TASKS COMPLETED"
            tint={colors.accent.emerald}
            delay={120}
            statStyles={statStyles}
          />
          <StatCard
            numericValue={Math.round(totalHours)}
            unit="h"
            label="FOCUS TIME"
            tint={colors.accent.blue}
            delay={180}
            statStyles={statStyles}
          />
        </View>
        <View style={styles.statGrid}>
          <StatCard
            numericValue={6}
            unit="/7"
            label="DAYS ON TRACK"
            tint={colors.accent.sky}
            delay={240}
            statStyles={statStyles}
          />
          <StatCard
            numericValue={4}
            label="WEEK STREAK"
            tint={colors.accent.sky}
            delay={300}
            statStyles={statStyles}
          />
        </View>

        {/* Subject breakdown */}
        <Text style={styles.sectionLabel}>TIME BY SUBJECT</Text>
        <Animated.View entering={FadeInDown.delay(340).duration(500)}>
          <GlassCard intensity="light" style={styles.subjectCard}>
            <View style={styles.subjectList}>
              {MOCK_SUBJECTS.map((s, i) => (
                <SubjectBar
                  key={s.subject}
                  subject={s.subject}
                  hours={s.hours}
                  maxHours={maxHours}
                  tint={colors.accent[s.tintKey]}
                  delay={380 + i * 80}
                  barStyles={barStyles}
                />
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Chronos's note */}
        <Text style={styles.sectionLabel}>CHRONOS&apos;S NOTE</Text>
        <Animated.View entering={FadeInDown.delay(640).duration(500)}>
          <GlassCard intensity="regular" borderAccent style={styles.noteCard}>
            <LinearGradient
              colors={[colors.accent.sky + '14', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.noteAvatar}>
              <Text style={styles.noteAvatarLetter}>A</Text>
            </View>
            <Text style={styles.noteText}>
              History essays ran about 20% longer than planned this week. I&apos;ve padded
              next week&apos;s US History blocks by 15 minutes and moved the hardest work to
              your strongest time of day.
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Next week preview */}
        <Text style={styles.sectionLabel}>NEXT WEEK</Text>
        <Animated.View entering={FadeInDown.delay(720).duration(500)}>
          <GlassCard intensity="light" style={styles.upcomingCard}>
            {MOCK_UPCOMING.map((t, i) => (
              <View key={t.id}>
                <View style={styles.upcomingRow}>
                  <View style={styles.upcomingDot} />
                  <View style={styles.upcomingTextCol}>
                    <Text style={styles.upcomingTitle} numberOfLines={1}>
                      {t.task}
                    </Text>
                    <Text style={styles.upcomingSubject}>{t.subject}</Text>
                  </View>
                  <Text style={styles.upcomingDue}>{t.due}</Text>
                </View>
                {i < MOCK_UPCOMING.length - 1 ? (
                  <View style={styles.upcomingDivider} />
                ) : null}
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Close button */}
        <Animated.View
          entering={FadeInDown.delay(820).duration(500)}
          style={styles.closeRow}
        >
          <AuraButton
            label="Start the week"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {
              haptic.primaryCTA();
              router.back();
            }}
          />
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
      justifyContent: 'flex-end',
      marginBottom: spacing.md,
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

    // Hero
    eyebrow: {
      ...typography.caption,
      color: c.accent.sky,
      marginBottom: 6,
    },
    title: {
      ...typography.displayMedium,
      color: c.text.primary,
      marginBottom: 8,
    },
    subtitle: {
      ...typography.body,
      color: c.text.secondary,
      lineHeight: 22,
      marginBottom: spacing.xl,
    },

    // Stat grid
    statGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },

    // Section
    sectionLabel: {
      ...typography.caption,
      color: c.text.tertiary,
      marginTop: spacing.xl,
      marginBottom: 10,
      paddingHorizontal: 4,
    },

    // Subject card
    subjectCard: {
      padding: spacing.cardPadding,
    },
    subjectList: {
      gap: spacing.md,
    },

    // Note card
    noteCard: {
      flexDirection: 'row',
      gap: 12,
      padding: spacing.cardPadding,
      alignItems: 'flex-start',
      overflow: 'hidden',
    },
    noteAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noteAvatarLetter: {
      ...typography.headline,
      color: c.text.inverse,
      fontWeight: '700',
    },
    noteText: {
      ...typography.body,
      color: c.text.primary,
      lineHeight: 22,
      flex: 1,
    },

    // Upcoming
    upcomingCard: {
      paddingVertical: 4,
    },
    upcomingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: 14,
    },
    upcomingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.accent.sky,
    },
    upcomingTextCol: {
      flex: 1,
    },
    upcomingTitle: {
      ...typography.bodyMedium,
      color: c.text.primary,
    },
    upcomingSubject: {
      ...typography.callout,
      color: c.text.tertiary,
      marginTop: 2,
    },
    upcomingDue: {
      ...typography.caption,
      color: c.accent.sky,
    },
    upcomingDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border.subtle,
      marginLeft: spacing.cardPadding + 20,
    },

    // Close
    closeRow: {
      marginTop: spacing.xl,
    },
  });
}
