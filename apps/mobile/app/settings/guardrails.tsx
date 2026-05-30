import { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  Switch,
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
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme, type ResolvedMode } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { haptic } from '../../lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function switchTrackOff(mode: ResolvedMode): string {
  return mode === 'light' ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.12)';
}

// ---------------------------------------------------------------------------
// Rule card — tinted icon, label, subtitle, toggle + optional expanded config
// ---------------------------------------------------------------------------

interface RuleCardProps {
  icon: string;
  tint: string;
  title: string;
  subtitle: string;
  active: boolean;
  onToggle: (next: boolean) => void;
  children?: React.ReactNode;
  delay?: number;
  colors: ThemeColors;
  resolvedMode: ResolvedMode;
  cardStyles: ReturnType<typeof makeCardStyles>;
}

function RuleCard({
  icon,
  tint,
  title,
  subtitle,
  active,
  onToggle,
  children,
  delay = 0,
  colors,
  resolvedMode,
  cardStyles,
}: RuleCardProps) {
  const fade = useSharedValue(active ? 1 : 0);

  const configStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    maxHeight: interpolate(fade.value, [0, 1], [0, 240], Extrapolation.CLAMP),
  }));

  function handleToggle(next: boolean) {
    haptic.selection();
    fade.value = withTiming(next ? 1 : 0, { duration: 260 });
    onToggle(next);
  }

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(500)}>
      <GlassCard intensity="light" style={cardStyles.card}>
        <LinearGradient
          colors={[tint + (active ? '14' : '08'), 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={cardStyles.headerRow}>
          <View style={[cardStyles.iconBox, { backgroundColor: tint + '22' }]}>
            <AuraSymbol name={icon} size={16} color={tint} weight="semibold" />
          </View>
          <View style={cardStyles.headerText}>
            <Text style={cardStyles.title}>{title}</Text>
            <Text style={cardStyles.subtitle}>{subtitle}</Text>
          </View>
          <Switch
            value={active}
            onValueChange={handleToggle}
            trackColor={{
              false: switchTrackOff(resolvedMode),
              true: tint + 'AA',
            }}
            thumbColor={colors.text.inverse}
            ios_backgroundColor={switchTrackOff(resolvedMode)}
          />
        </View>
        {children ? (
          <Animated.View style={[cardStyles.configWrap, configStyle]}>
            <View style={cardStyles.divider} />
            {children}
          </Animated.View>
        ) : null}
      </GlassCard>
    </Animated.View>
  );
}

function makeCardStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      padding: spacing.cardPadding,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    title: {
      ...typography.bodyMedium,
      color: c.text.primary,
    },
    subtitle: {
      ...typography.callout,
      color: c.text.tertiary,
      marginTop: 2,
    },
    configWrap: {
      overflow: 'hidden',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border.subtle,
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
  });
}

// ---------------------------------------------------------------------------
// Time picker chip row — chooses "from X to Y" hour (stub)
// ---------------------------------------------------------------------------

interface TimeChipProps {
  label: string;
  value: string;
  onPress: () => void;
  timeChipStyles: ReturnType<typeof makeTimeChipStyles>;
}

function TimeChip({ label, value, onPress, timeChipStyles }: TimeChipProps) {
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
        onPress();
      }}
      style={[timeChipStyles.chip, animatedStyle]}
    >
      <Text style={timeChipStyles.label}>{label}</Text>
      <Text style={timeChipStyles.value}>{value}</Text>
    </AnimatedPressable>
  );
}

function makeTimeChipStyles(c: ThemeColors) {
  return StyleSheet.create({
    chip: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
      gap: 2,
    } as ViewStyle,
    label: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    value: {
      ...typography.title2,
      color: c.text.primary,
      fontVariant: ['tabular-nums'],
    },
  });
}

// ---------------------------------------------------------------------------
// Stepper — ±1 with tabular number and label
// ---------------------------------------------------------------------------

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
  stepperStyles: ReturnType<typeof makeStepperStyles>;
}

function Stepper({ value, min, max, step = 1, unit, onChange, stepperStyles }: StepperProps) {
  function bump(delta: number) {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next === value) {
      haptic.error();
      return;
    }
    haptic.selection();
    onChange(next);
  }

  return (
    <View style={stepperStyles.row}>
      <Pressable
        onPress={() => bump(-step)}
        hitSlop={12}
        style={stepperStyles.btn}
        accessibilityRole="button"
        accessibilityLabel={`Decrease by ${step}`}
      >
        <Text style={stepperStyles.btnText}>−</Text>
      </Pressable>
      <View style={stepperStyles.valueBox}>
        <Text style={stepperStyles.value}>{value}</Text>
        <Text style={stepperStyles.unit}>{unit}</Text>
      </View>
      <Pressable
        onPress={() => bump(step)}
        hitSlop={12}
        style={stepperStyles.btn}
        accessibilityRole="button"
        accessibilityLabel={`Increase by ${step}`}
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
      gap: spacing.lg,
    },
    btn: {
      width: 40,
      height: 40,
      borderRadius: 20,
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
      minWidth: 96,
      justifyContent: 'center',
    },
    value: {
      ...typography.displayMedium,
      color: c.text.primary,
      fontVariant: ['tabular-nums'],
    },
    unit: {
      ...typography.title2,
      color: c.text.secondary,
    },
  });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

interface GuardrailState {
  noWorkAfter: { active: boolean; startHour: number; endHour: number };
  bufferAfterEvent: { active: boolean; minutes: number };
  maxHoursPerDay: { active: boolean; hours: number };
}

export default function GuardrailsEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const cardStyles = useMemo(() => makeCardStyles(colors), [colors]);
  const timeChipStyles = useMemo(() => makeTimeChipStyles(colors), [colors]);
  const stepperStyles = useMemo(() => makeStepperStyles(colors), [colors]);

  // Stub state — would come from useGuardrails(userId)
  const [state, setState] = useState<GuardrailState>({
    noWorkAfter: { active: true, startHour: 21, endHour: 7 },
    bufferAfterEvent: { active: true, minutes: 15 },
    maxHoursPerDay: { active: false, hours: 4 },
  });

  function update<K extends keyof GuardrailState>(
    key: K,
    partial: Partial<GuardrailState[K]>,
  ) {
    setState((prev) => ({ ...prev, [key]: { ...prev[key], ...partial } }));
    // TODO: Supabase — upsert into guardrails set value=partial where rule_type=key and user_id=authUser?.id
  }

  function formatHour(h: number) {
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${hour12}:00 ${ampm}`;
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

        {/* Title block */}
        <Animated.View entering={FadeInUp.delay(60).duration(500)} style={styles.titleBlock}>
          <Text style={styles.eyebrow}>GUARDRAILS</Text>
          <Text style={styles.title}>Protect your time</Text>
          <Text style={styles.subtitle}>
            Rules Chronos must obey when building your schedule. Hard limits — never
            crossed, no matter the deadline.
          </Text>
        </Animated.View>

        {/* Quiet hours */}
        <Text style={styles.sectionLabel}>QUIET HOURS</Text>
        <RuleCard
          icon="moon.fill"
          tint={colors.accent.sky}
          title="No work after dark"
          subtitle={
            state.noWorkAfter.active
              ? `${formatHour(state.noWorkAfter.startHour)} – ${formatHour(state.noWorkAfter.endHour)}`
              : 'Off — Chronos can schedule any hour'
          }
          active={state.noWorkAfter.active}
          onToggle={(next) => update('noWorkAfter', { active: next })}
          delay={120}
          colors={colors}
          resolvedMode={resolvedMode}
          cardStyles={cardStyles}
        >
          <View style={styles.timeRow}>
            <TimeChip
              label="FROM"
              value={formatHour(state.noWorkAfter.startHour)}
              onPress={() => {
                /* stub — opens time picker */
              }}
              timeChipStyles={timeChipStyles}
            />
            <AuraSymbol name="arrow.right" size={16} color={colors.text.tertiary} />
            <TimeChip
              label="TO"
              value={formatHour(state.noWorkAfter.endHour)}
              onPress={() => {
                /* stub — opens time picker */
              }}
              timeChipStyles={timeChipStyles}
            />
          </View>
        </RuleCard>

        {/* Buffer after event */}
        <Text style={styles.sectionLabel}>BREATHING ROOM</Text>
        <RuleCard
          icon="clock.fill"
          tint={colors.accent.sky}
          title="Buffer after events"
          subtitle={
            state.bufferAfterEvent.active
              ? `${state.bufferAfterEvent.minutes} min before the next block`
              : 'Off — tasks can start immediately after events'
          }
          active={state.bufferAfterEvent.active}
          onToggle={(next) => update('bufferAfterEvent', { active: next })}
          delay={180}
          colors={colors}
          resolvedMode={resolvedMode}
          cardStyles={cardStyles}
        >
          <Stepper
            value={state.bufferAfterEvent.minutes}
            min={5}
            max={60}
            step={5}
            unit="min"
            onChange={(v) => update('bufferAfterEvent', { minutes: v })}
            stepperStyles={stepperStyles}
          />
        </RuleCard>

        {/* Max hours per day */}
        <Text style={styles.sectionLabel}>DAILY LIMIT</Text>
        <RuleCard
          icon="shield.fill"
          tint={colors.accent.coral}
          title="Max hours per day"
          subtitle={
            state.maxHoursPerDay.active
              ? `Chronos will never schedule more than ${state.maxHoursPerDay.hours}h of focused work`
              : 'Off — no daily ceiling'
          }
          active={state.maxHoursPerDay.active}
          onToggle={(next) => update('maxHoursPerDay', { active: next })}
          delay={240}
          colors={colors}
          resolvedMode={resolvedMode}
          cardStyles={cardStyles}
        >
          <Stepper
            value={state.maxHoursPerDay.hours}
            min={1}
            max={10}
            unit="hours"
            onChange={(v) => update('maxHoursPerDay', { hours: v })}
            stepperStyles={stepperStyles}
          />
        </RuleCard>

        {/* Footnote */}
        <Animated.View entering={FadeIn.delay(340).duration(500)} style={styles.footnote}>
          <AuraSymbol name="sparkles" size={12} color={colors.text.tertiary} />
          <Text style={styles.footnoteText}>
            When a deadline can&apos;t fit inside your guardrails, Chronos warns you rather
            than overriding them.
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
      marginBottom: spacing.lg,
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
      marginBottom: spacing.xl,
    },
    eyebrow: {
      ...typography.caption,
      color: c.accent.coral,
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
    },

    // Section label
    sectionLabel: {
      ...typography.caption,
      color: c.text.tertiary,
      marginTop: spacing.xl,
      marginBottom: 10,
      paddingHorizontal: 4,
    },

    // Time row (inside RuleCard)
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    // Footnote
    footnote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: spacing.xl,
      paddingHorizontal: 4,
    },
    footnoteText: {
      ...typography.callout,
      color: c.text.tertiary,
      flex: 1,
      lineHeight: 18,
    },
  });
}
