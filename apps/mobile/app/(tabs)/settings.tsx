import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { AuraAvatar } from '../../components/ui/AuraAvatar';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useConnections } from '../../hooks/useConnections';
import { requestSundayBriefing } from '../../services/jobs';
import { haptic } from '../../lib/haptics';
import { useTheme, type ThemeMode } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';
import { scheduleDailyBriefing, cancelDailyBriefing } from '../../lib/notifications';
import type { ConnectionStatus } from '@chronos/shared/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// In-file primitives: section label, row, status dot
// ---------------------------------------------------------------------------

function SectionLabel({
  children,
  delay = 0,
  styles,
}: {
  children: string;
  delay?: number;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400)} style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText}>{children}</Text>
    </Animated.View>
  );
}

type TintKey = 'steel' | 'mist' | 'easy' | 'moderate' | 'hard';

// Tint backgrounds derive from the live theme accent at ~14% alpha
// (`+ '24'` ≈ 0.14). No hardcoded Tailwind rgba slop, no AI purple.
function makeTintMap(c: ThemeColors): Record<TintKey, { bg: string; fg: string }> {
  return {
    steel:    { bg: c.glass.accent,         fg: c.accent.blue },
    mist:     { bg: c.accent.sky + '24',    fg: c.accent.sky },
    easy:     { bg: c.accent.emerald + '24',fg: c.accent.emerald },
    moderate: { bg: c.accent.amber + '24',  fg: c.accent.amber },
    hard:     { bg: c.accent.coral + '24',  fg: c.accent.coral },
  };
}

function TintedIcon({
  name,
  tint,
  tintMap,
  styles,
}: {
  name: string;
  tint: TintKey;
  tintMap: Record<TintKey, { bg: string; fg: string }>;
  styles: ReturnType<typeof makeStyles>;
}) {
  const t = tintMap[tint];
  return (
    <View style={[styles.iconCircle, { backgroundColor: t.bg }]}>
      <AuraSymbol name={name} size={16} color={t.fg} weight="semibold" />
    </View>
  );
}

function StatusDot({
  status,
  colors,
  styles,
}: {
  status: ConnectionStatus;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (status === 'active') {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 1400 }),
          withTiming(1, { duration: 1400 }),
        ),
        -1,
        false,
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(0.92, { duration: 1400 }),
          withTiming(1, { duration: 1400 }),
        ),
        -1,
        false,
      );
    }
  }, [status, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const color =
    status === 'active'
      ? colors.accent.emerald
      : status === 'expired'
        ? colors.accent.amber
        : colors.accent.coral;

  return (
    <View style={styles.statusDotContainer}>
      <Animated.View style={[styles.statusDot, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
}

interface RowProps {
  icon: string;
  tint: TintKey;
  label: string;
  subtitle?: string;
  trailing?: 'chevron' | 'status' | 'none';
  status?: ConnectionStatus;
  destructive?: boolean;
  isLast?: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
  tintMap: Record<TintKey, { bg: string; fg: string }>;
  pressTint: string;
}

function Row({
  icon,
  tint,
  label,
  subtitle,
  trailing = 'chevron',
  status,
  destructive = false,
  isLast = false,
  onPress,
  colors,
  styles,
  tintMap,
  pressTint,
}: RowProps) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 1 - bgOpacity.value * 0.02,
  }));

  const pressOverlayStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <>
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.985, { damping: 18, stiffness: 400 });
          bgOpacity.value = withTiming(1, { duration: 80 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 400 });
          bgOpacity.value = withTiming(0, { duration: 150 });
        }}
        onPress={() => {
          haptic.selection();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.row, animatedStyle]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: pressTint, pointerEvents: 'none' },
            pressOverlayStyle,
          ]}
        />
        <TintedIcon name={icon} tint={tint} tintMap={tintMap} styles={styles} />
        <View style={styles.rowLabelCol}>
          <Text
            style={[
              styles.rowLabel,
              destructive && { color: colors.accent.coral },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle ? (
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailing === 'chevron' ? (
          <AuraSymbol name="chevron.right" size={14} color={colors.text.tertiary} />
        ) : trailing === 'status' && status ? (
          <StatusDot status={status} colors={colors} styles={styles} />
        ) : null}
      </AnimatedPressable>
      {!isLast ? <View style={styles.divider} /> : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Appearance picker — three-way pill toggle (Light / Dark / Auto)
// ---------------------------------------------------------------------------

const APPEARANCE_OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  icon: string;
}> = [
  { value: 'light', label: 'Light', icon: 'sun.max.fill' },
  { value: 'dark',  label: 'Dark',  icon: 'moon.fill' },
  { value: 'auto',  label: 'Auto',  icon: 'circle.lefthalf.filled' },
];

function AppearancePicker({
  colors,
  styles,
}: {
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { mode, setMode } = useTheme();

  return (
    <View style={styles.appearanceTrack}>
      {APPEARANCE_OPTIONS.map((opt) => {
        const isActive = mode === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              haptic.selection();
              setMode(opt.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${opt.label} appearance`}
            style={[styles.appearancePill, isActive && styles.appearancePillActive]}
          >
            <AuraSymbol
              name={opt.icon}
              size={15}
              color={isActive ? colors.text.inverse : colors.text.secondary}
              weight="semibold"
            />
            <Text
              style={[
                styles.appearancePillLabel,
                {
                  color: isActive ? colors.text.inverse : colors.text.secondary,
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tintMap = useMemo(() => makeTintMap(colors), [colors]);
  const pressTint = useMemo(
    () =>
      resolvedMode === 'light'
        ? 'rgba(15, 23, 42, 0.04)'
        : 'rgba(255, 255, 255, 0.04)',
    [resolvedMode],
  );

  const [briefingBusy, setBriefingBusy] = useState(false);
  const [dailyBriefingEnabled, setDailyBriefingEnabled] = useState(true);
  const { user: authUser, signOut } = useAuth();
  const { user, loading: userLoading } = useUserProfile(authUser?.id ?? '');
  const { connections } = useConnections(authUser?.id ?? '');

  function handleToggleBriefingNotification(value: boolean) {
    setDailyBriefingEnabled(value);
    haptic.selection();
    if (value) {
      void scheduleDailyBriefing('07:30');
    } else {
      void cancelDailyBriefing();
    }
  }

  const gcStatus = useMemo<ConnectionStatus | null>(() => {
    const c = connections.find((x) => x.platform === 'google_classroom');
    return c?.status ?? null;
  }, [connections]);

  const canvasStatus = useMemo<ConnectionStatus | null>(() => {
    const c = connections.find((x) => x.platform === 'canvas');
    return c?.status ?? null;
  }, [connections]);

  const displayName = userLoading ? 'Loading…' : (user?.displayName ?? 'Student');
  const gradeLine = user
    ? `Grade ${user.gradeLevel} · ${user.timezone.split('/')[1]?.replace('_', ' ') ?? user.timezone}`
    : '—';

  async function runBriefing() {
    if (briefingBusy) return;
    setBriefingBusy(true);
    haptic.primaryCTA();
    try {
      await requestSundayBriefing(authUser?.id ?? '');
    } catch {
      // swallowed — stub
    } finally {
      setBriefingBusy(false);
    }
  }

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
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.eyebrow}>ACCOUNT</Text>
          <Text style={styles.title}>Settings</Text>
        </Animated.View>

        {/* Profile hero */}
        <Animated.View entering={FadeInUp.delay(60).duration(500)}>
          <GlassCard intensity="regular" borderAccent style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.avatarWrap}>
                {/* Steel → Mist ring. Same family, no violet. */}
                <LinearGradient
                  colors={[colors.accent.blue, colors.accent.sky]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarRing}
                />
                <View style={styles.avatarInner}>
                  <AuraAvatar name={displayName} size={52} />
                </View>
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.heroMeta} numberOfLines={1}>
                  {gradeLine}
                </Text>
              </View>
              <Pressable
                hitSlop={12}
                onPress={() => {
                  haptic.secondary();
                  router.push('/settings/profile' as Href);
                }}
                style={styles.editBadge}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <AuraSymbol name="chevron.right" size={14} color={colors.text.secondary} />
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Appearance */}
        <SectionLabel delay={100} styles={styles}>APPEARANCE</SectionLabel>
        <Animated.View entering={FadeInUp.delay(120).duration(500)}>
          <GlassCard intensity="light" style={styles.appearanceCard}>
            <AppearancePicker colors={colors} styles={styles} />
            <Text style={styles.appearanceHint}>
              Auto switches to light at 7 AM and dark after 7 PM.
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Connections */}
        <SectionLabel delay={160} styles={styles}>CONNECTIONS</SectionLabel>
        <Animated.View entering={FadeInUp.delay(180).duration(500)}>
          <GlassCard intensity="light" style={styles.groupCard}>
            <Row
              icon="g.circle.fill"
              tint="easy"
              label="Google Classroom"
              subtitle={
                gcStatus === 'active'
                  ? 'Syncing nightly'
                  : gcStatus === 'expired'
                    ? 'Reconnection needed'
                    : 'Not connected'
              }
              trailing="status"
              status={gcStatus ?? 'error'}
              onPress={() => router.push('/settings/connections' as Href)}
              colors={colors}
              styles={styles}
              tintMap={tintMap}
              pressTint={pressTint}
            />
            <Row
              icon="c.circle.fill"
              tint="moderate"
              label="Canvas"
              subtitle={canvasStatus ? 'Connected' : 'Add personal access token'}
              trailing="chevron"
              isLast
              onPress={() => router.push('/settings/connections' as Href)}
              colors={colors}
              styles={styles}
              tintMap={tintMap}
              pressTint={pressTint}
            />
          </GlassCard>
        </Animated.View>

        {/* Preferences */}
        <SectionLabel delay={220} styles={styles}>PREFERENCES</SectionLabel>
        <Animated.View entering={FadeInUp.delay(240).duration(500)}>
          <GlassCard intensity="light" style={styles.groupCard}>
            <Row
              icon="clock.fill"
              tint="steel"
              label="Daily trigger time"
              subtitle={user?.dailyTriggerTime ?? '7:30 PM'}
              onPress={() => {
                /* stub — opens time picker */
              }}
              colors={colors}
              styles={styles}
              tintMap={tintMap}
              pressTint={pressTint}
            />
            <Row
              icon="shield.fill"
              tint="hard"
              label="Guardrails"
              subtitle="Quiet hours & daily limits"
              onPress={() => {
                /* stub — /settings/guardrails */
              }}
              colors={colors}
              styles={styles}
              tintMap={tintMap}
              pressTint={pressTint}
            />
            <Row
              icon="brain"
              tint="mist"
              label="Chronos's brain"
              subtitle="How it learns from you"
              isLast
              onPress={() => {
                /* stub — /settings/brain */
              }}
              colors={colors}
              styles={styles}
              tintMap={tintMap}
              pressTint={pressTint}
            />
          </GlassCard>
        </Animated.View>

        {/* Notifications */}
        <SectionLabel delay={280} styles={styles}>NOTIFICATIONS</SectionLabel>
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <GlassCard intensity="light" style={styles.groupCard}>
            <View style={styles.switchRow}>
              <TintedIcon name="bell.fill" tint="mist" tintMap={tintMap} styles={styles} />
              <View style={styles.rowLabelCol}>
                <Text style={styles.rowLabel}>Daily briefing</Text>
                <Text style={styles.rowSubtitle}>
                  {dailyBriefingEnabled ? 'Every morning at 7:30 AM' : 'Off'}
                </Text>
              </View>
              <Switch
                value={dailyBriefingEnabled}
                onValueChange={handleToggleBriefingNotification}
                trackColor={{
                  false: colors.border.subtle,
                  true: colors.accent.blue,
                }}
                thumbColor={colors.text.inverse}
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Actions */}
        <SectionLabel delay={340} styles={styles}>ACTIONS</SectionLabel>
        <Animated.View entering={FadeInUp.delay(360).duration(500)}>
          <GlassCard intensity="light" style={styles.groupCard}>
            <Row
              icon="sun.max.fill"
              tint="moderate"
              label="Run Sunday briefing"
              subtitle={briefingBusy ? 'Running…' : 'Summarize last week'}
              isLast
              onPress={() => {
                void runBriefing();
              }}
              colors={colors}
              styles={styles}
              tintMap={tintMap}
              pressTint={pressTint}
            />
          </GlassCard>
        </Animated.View>

        {/* Account */}
        <SectionLabel delay={380} styles={styles}>ACCOUNT</SectionLabel>
        <Animated.View entering={FadeInUp.delay(400).duration(500)}>
          <GlassCard intensity="light" style={styles.groupCard}>
            <Row
              icon="arrow.right.square.fill"
              tint="hard"
              label="Sign out"
              destructive
              trailing="none"
              isLast
              onPress={() => {
                signOut();
              }}
              colors={colors}
              styles={styles}
              tintMap={tintMap}
              pressTint={pressTint}
            />
          </GlassCard>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeIn.delay(460).duration(500)} style={styles.footer}>
          <Text style={styles.footerLine}>AURA · VERSION 1.0</Text>
          <Text style={styles.footerSub}>The calendar manages the student.</Text>
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
    header: {
      marginBottom: spacing.xl,
    },
    eyebrow: {
      ...typography.caption,
      color: c.text.tertiary,
      marginBottom: 4,
    },
    title: {
      ...typography.displayMedium,
      color: c.text.primary,
    },

    // Hero
    heroCard: {
      padding: spacing.cardPadding,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    avatarWrap: {
      width: 58,
      height: 58,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarRing: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 29,
    },
    avatarInner: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background.elevated,
    },
    heroText: {
      flex: 1,
    },
    heroName: {
      ...typography.title2,
      color: c.text.primary,
    },
    heroMeta: {
      ...typography.callout,
      color: c.text.secondary,
      marginTop: 2,
    },
    editBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },

    // Section label
    sectionLabel: {
      marginTop: spacing.sectionGap,
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    sectionLabelText: {
      ...typography.caption,
      color: c.text.tertiary,
    },

    // Group card
    groupCard: {
      paddingVertical: 4,
    },

    // Appearance card
    appearanceCard: {
      padding: spacing.cardPadding,
      gap: 12,
    },
    appearanceTrack: {
      flexDirection: 'row',
      backgroundColor: c.glass.light,
      borderRadius: radius.md,
      padding: 4,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    appearancePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: radius.sm,
    },
    appearancePillActive: {
      backgroundColor: c.accent.blue,
      shadowColor: c.accent.blue,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    appearancePillLabel: {
      ...typography.callout,
      fontWeight: '600',
    },
    appearanceHint: {
      ...typography.callout,
      color: c.text.tertiary,
      textAlign: 'center',
    },

    // Row
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: 10,
      gap: 14,
      overflow: 'hidden',
    } as ViewStyle,
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabelCol: {
      flex: 1,
    },
    rowLabel: {
      ...typography.body,
      color: c.text.primary,
    },
    rowSubtitle: {
      ...typography.callout,
      color: c.text.tertiary,
      marginTop: 2,
    },

    // Switch row (notifications toggle)
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: 10,
      gap: 14,
    } as ViewStyle,

    // Divider — left-inset past icon circle (16px pad + 32 icon + 14 gap = 62px)
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border.subtle,
      marginLeft: 62,
    },

    // Status dot
    statusDotContainer: {
      width: 10,
      height: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    // Footer
    footer: {
      marginTop: spacing.sectionGap + spacing.md,
      alignItems: 'center',
      gap: 4,
    },
    footerLine: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    footerSub: {
      ...typography.callout,
      color: c.text.tertiary,
      fontStyle: 'italic',
    },
  });
}
