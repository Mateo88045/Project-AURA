import { useMemo, useState, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { useTasksForDay } from '../../hooks/useTasksForDay';
import { useTaskCountsForWeek } from '../../hooks/useTaskCountsForWeek';
import { Screen } from '../../components/ui/Screen';
import { AuraText } from '../../components/ui/AuraText';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { AuraButton } from '../../components/ui/AuraButton';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { TaskBlock } from '../../components/ui/TaskBlock';
import { WeekTaskBar } from '../../components/ui/WeekTaskBar';
import { CalmEmptyState } from '../../components/ui/CalmEmptyState';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';

const STAGGER_MS = 40;
// Beyond this many task bars a column shows a "+N" tally instead of stacking
// forever — keeps the week grid above the fold.
const MAX_BARS = 4;

function formatDayLabel(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
}

function toDayIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatWeekRange(days: Date[]): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(days[0])} – ${fmt(days[6])}`;
}

function formatFullDay(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

// "3 tasks · 3h 15m" — the focused day's load at a glance.
function summarizeDayLoad(minutesList: number[]): string {
  const total = minutesList.reduce((sum, m) => sum + m, 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  const duration = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;
  const count = minutesList.length === 1 ? '1 task' : `${minutesList.length} tasks`;
  return `${count} · ${duration}`;
}

interface WeekDayColumnProps {
  userId: string;
  date: Date;
  dayIso: string;
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}

// One day in the week grid: its date header plus a compressed vertical stack of
// task bars. Self-fetches via the existing per-day hook so all seven days load
// their density in parallel without a new hook contract.
function WeekDayColumn({
  userId,
  date,
  dayIso,
  isToday,
  isSelected,
  onSelect,
  styles,
  colors,
}: WeekDayColumnProps) {
  const { tasks, loading } = useTasksForDay(userId, dayIso);
  const shownTasks = tasks.slice(0, MAX_BARS);
  const overflow = tasks.length - shownTasks.length;

  return (
    <Pressable
      onPress={onSelect}
      style={[styles.dayCol, isSelected && styles.dayColSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${formatDayLabel(date)} ${date.getDate()}, ${
        tasks.length === 1 ? '1 task' : `${tasks.length} tasks`
      }`}
    >
      <Text style={styles.dayLabel}>{formatDayLabel(date)}</Text>
      <View style={[styles.dayNum, isToday && styles.dayNumToday]}>
        <Text
          style={[
            styles.dayNumText,
            { color: isToday ? colors.text.inverse : colors.text.primary },
          ]}
        >
          {date.getDate()}
        </Text>
      </View>

      <View style={styles.barsStack}>
        {loading ? (
          <>
            <AuraSkeleton height={22} style={styles.barSkeleton} />
            <AuraSkeleton height={16} style={styles.barSkeleton} />
          </>
        ) : tasks.length === 0 ? (
          <View style={styles.restDash} />
        ) : (
          <>
            {shownTasks.map((task) => (
              <WeekTaskBar
                key={task.id}
                difficulty={task.difficulty}
                estimatedMinutes={task.estimatedMinutes}
              />
            ))}
            {overflow > 0 && <Text style={styles.overflowText}>+{overflow}</Text>}
          </>
        )}
      </View>
    </Pressable>
  );
}

export default function WeekScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const today = useMemo(() => new Date(), []);
  const { user: authUser } = useAuth();
  const userId = authUser?.id ?? '';

  // Week navigation offset (0 = current week, -1 = last week, 1 = next week)
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => {
    const base = new Date(today);
    base.setDate(today.getDate() + weekOffset * 7);
    const start = new Date(base);
    start.setDate(base.getDate() - base.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [today, weekOffset]);

  const weekDayIsos = useMemo(() => weekDays.map(toDayIso), [weekDays]);
  const weekRangeLabel = useMemo(() => formatWeekRange(weekDays), [weekDays]);

  // Focused day — the grid always shows all seven, tapping one expands it below.
  const [selectedDayIso, setSelectedDayIso] = useState(toDayIso(today));

  useEffect(() => {
    setSelectedDayIso(weekOffset === 0 ? toDayIso(today) : weekDayIsos[0]);
  }, [weekOffset, today, weekDayIsos]);

  const { counts } = useTaskCountsForWeek(userId, weekDayIsos);
  const weekTotal = useMemo(
    () => Object.values(counts).reduce((sum, n) => sum + n, 0),
    [counts],
  );

  const {
    tasks: selectedTasks,
    loading: selectedLoading,
    error: selectedError,
    refetch,
  } = useTasksForDay(userId, selectedDayIso);
  const selectedDate = useMemo(
    () => new Date(`${selectedDayIso}T12:00:00`),
    [selectedDayIso],
  );

  function goToPrevWeek() {
    haptic.selection();
    setWeekOffset((prev) => prev - 1);
  }

  function goToNextWeek() {
    haptic.selection();
    setWeekOffset((prev) => prev + 1);
  }

  return (
    <Screen>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Animated.View entering={FadeIn.duration(280)}>
          <Text style={styles.eyebrow}>WEEK</Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(STAGGER_MS).duration(280)}>
          <View style={styles.titleRow}>
            <Pressable
              onPress={goToPrevWeek}
              hitSlop={12}
              style={styles.navArrow}
              accessibilityRole="button"
              accessibilityLabel="Previous week"
            >
              <AuraSymbol name="chevron.left" size={16} color={colors.text.secondary} />
            </Pressable>
            <Text style={styles.title}>{weekRangeLabel}</Text>
            <Pressable
              onPress={goToNextWeek}
              hitSlop={12}
              style={styles.navArrow}
              accessibilityRole="button"
              accessibilityLabel="Next week"
            >
              <AuraSymbol name="chevron.right" size={16} color={colors.text.secondary} />
            </Pressable>
          </View>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(STAGGER_MS * 2).duration(280)}>
          <Text style={styles.subtitle}>
            {weekTotal > 0
              ? `${weekTotal === 1 ? '1 task' : `${weekTotal} tasks`} across your week`
              : 'A clear week ahead'}
          </Text>
        </Animated.View>
      </View>

      {/* Week-at-a-glance grid — every day's load, side by side */}
      <Animated.View
        entering={FadeIn.delay(STAGGER_MS * 3).duration(280)}
        style={styles.weekGrid}
      >
        {weekDays.map((day) => {
          const dayIso = toDayIso(day);
          return (
            <WeekDayColumn
              key={dayIso}
              userId={userId}
              date={day}
              dayIso={dayIso}
              isToday={dayIso === toDayIso(today)}
              isSelected={dayIso === selectedDayIso}
              onSelect={() => {
                haptic.selection();
                setSelectedDayIso(dayIso);
              }}
              styles={styles}
              colors={colors}
            />
          );
        })}
      </Animated.View>

      {/* Focused day */}
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>{formatFullDay(selectedDate)}</Text>
        {!selectedLoading && !selectedError && selectedTasks.length > 0 && (
          <Text style={styles.detailSummary}>{summarizeDayLoad(selectedTasks.map((t) => t.estimatedMinutes))}</Text>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {selectedLoading && (
          <View style={styles.detailLoading}>
            <AuraSkeleton height={64} style={styles.detailSkeleton} />
            <AuraSkeleton height={64} style={styles.detailSkeleton} />
          </View>
        )}

        {!selectedLoading && selectedError && (
          <View style={styles.center}>
            <AuraText variant="body" color="hard" style={styles.errorText}>
              Couldn&apos;t load tasks for this day.
            </AuraText>
            <AuraButton label="Try again" variant="outline" onPress={refetch} />
          </View>
        )}

        {!selectedLoading && !selectedError && selectedTasks.length === 0 && (
          <View style={styles.detailEmpty}>
            <CalmEmptyState
              icon="sun.max.fill"
              title="A clear day"
              body={`Nothing scheduled for ${selectedDate.toLocaleDateString(undefined, {
                weekday: 'long',
              })}. Enjoy the open water.`}
            />
          </View>
        )}

        {!selectedLoading && !selectedError && selectedTasks.length > 0 && (
          <View style={styles.taskList}>
            {selectedTasks.map((task, i) => (
              <Animated.View
                key={task.id}
                entering={FadeIn.delay(STAGGER_MS * (4 + i)).duration(200)}
              >
                <TaskBlock
                  title={task.title}
                  subject={task.subject}
                  estimatedMinutes={task.estimatedMinutes}
                  difficulty={task.difficulty}
                  variant="scheduled"
                  onPress={() => {
                    haptic.liquidTap();
                    router.push(`/tasks/${task.id}` as Href);
                  }}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    header: {
      paddingBottom: spacing.md,
    },
    eyebrow: {
      ...typography.caption,
      color: c.text.tertiary,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    navArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.glass.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.displayMedium,
      color: c.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.body,
      color: c.text.secondary,
      marginTop: spacing.xs,
    },
    weekGrid: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    dayCol: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: 3,
      borderRadius: radius.md,
      gap: spacing.xs,
    },
    dayColSelected: {
      backgroundColor: c.glass.accent,
    },
    dayLabel: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    dayNum: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayNumToday: {
      backgroundColor: c.accent.blue,
    },
    dayNumText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.2,
      fontVariant: ['tabular-nums'],
    },
    barsStack: {
      width: '100%',
      alignItems: 'stretch',
      gap: 3,
      marginTop: 2,
    },
    barSkeleton: {
      borderRadius: radius.sm,
    },
    restDash: {
      width: 12,
      height: 3,
      borderRadius: 2,
      backgroundColor: c.border.subtle,
      alignSelf: 'center',
      marginTop: spacing.xs,
    },
    overflowText: {
      ...typography.micro,
      color: c.text.tertiary,
      textAlign: 'center',
      marginTop: 1,
    },
    detailHeader: {
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    detailTitle: {
      ...typography.headline,
      color: c.text.primary,
    },
    detailSummary: {
      ...typography.callout,
      color: c.text.tertiary,
      marginTop: 2,
    },
    scroll: {
      flex: 1,
    },
    detailLoading: {
      gap: spacing.md,
    },
    detailSkeleton: {
      borderRadius: radius.md,
    },
    center: {
      marginTop: spacing.xl,
      alignItems: 'center',
    },
    errorText: {
      marginBottom: spacing.md,
    },
    detailEmpty: {
      marginTop: spacing.lg,
      alignItems: 'center',
    },
    taskList: {
      gap: spacing.itemGap,
    },
  });
}
