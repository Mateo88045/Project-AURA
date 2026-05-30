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
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';
const STAGGER_MS = 40;

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

export default function WeekScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const today = useMemo(() => new Date(), []);
  const { user: authUser } = useAuth();

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

  const [selectedDayIso, setSelectedDayIso] = useState(toDayIso(today));

  // Reset selection to first day when navigating weeks
  useEffect(() => {
    if (weekOffset === 0) {
      setSelectedDayIso(toDayIso(today));
    } else {
      setSelectedDayIso(weekDayIsos[0]);
    }
  }, [weekOffset, today, weekDayIsos]);

  const { tasks, loading, error, refetch } = useTasksForDay(authUser?.id ?? '', selectedDayIso);
  const { counts } = useTaskCountsForWeek(authUser?.id ?? '', weekDayIsos);

  const isToday = (d: Date) => toDayIso(d) === toDayIso(today);
  const isSelected = (d: Date) => toDayIso(d) === selectedDayIso;

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
            Tap a day to see what&apos;s ahead.
          </Text>
        </Animated.View>
      </View>

      {/* Day row */}
      <Animated.View
        entering={FadeIn.delay(STAGGER_MS * 3).duration(280)}
        style={styles.daysRow}
      >
        {weekDays.map((day) => {
          const selected = isSelected(day);
          const todayFlag = isToday(day);
          const dayIso = toDayIso(day);
          const hasTask = (counts[dayIso] ?? 0) > 0;
          return (
            <Pressable
              key={dayIso}
              onPress={() => {
                haptic.selection();
                setSelectedDayIso(dayIso);
              }}
              style={[styles.dayCol, selected && styles.dayColSelected]}
              accessibilityRole="button"
              accessibilityLabel={`${formatDayLabel(day)} ${day.getDate()}`}
            >
              <Text style={styles.dayLabel}>{formatDayLabel(day)}</Text>
              <View style={[styles.dayNum, todayFlag && styles.dayNumToday]}>
                <Text
                  style={[
                    styles.dayNumText,
                    { color: todayFlag ? colors.text.inverse : colors.text.primary },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
              {/* Task count badge dot */}
              {hasTask ? (
                <View style={styles.countDot} />
              ) : (
                <View style={styles.countDotPlaceholder} />
              )}
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Tasks for selected day */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {loading && (
          <View style={styles.loading}>
            <AuraSkeleton height={18} />
            <AuraSkeleton height={72} />
            <AuraSkeleton height={72} />
          </View>
        )}

        {!loading && error && (
          <View style={styles.center}>
            <AuraText variant="body" color="hard" style={styles.errorText}>
              Couldn&apos;t load tasks for this day.
            </AuraText>
            <AuraButton label="Try again" variant="outline" onPress={refetch} />
          </View>
        )}

        {!loading && !error && tasks.length === 0 && (
          <View style={styles.empty}>
            <AuraText variant="title2">Nothing scheduled</AuraText>
            <AuraText variant="body" color="secondary" style={styles.emptyBody}>
              This day is free. Chronos will fill it once classes are connected.
            </AuraText>
          </View>
        )}

        {!loading && !error && tasks.length > 0 && (
          <View style={styles.taskList}>
            {tasks.map((task, i) => (
              <Animated.View
                key={task.id}
                entering={FadeIn.delay(STAGGER_MS * (4 + i)).duration(200)}
                style={styles.taskItem}
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
    daysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xl,
      marginBottom: spacing.lg,
    },
    dayCol: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      minWidth: 40,
      minHeight: 64,
      gap: spacing.xs,
    },
    dayColSelected: {
      backgroundColor: c.glass.light,
    },
    dayLabel: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    dayNum: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayNumToday: {
      backgroundColor: c.accent.blue,
    },
    dayNumText: {
      ...typography.title2,
    },
    countDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.accent.blue,
    },
    countDotPlaceholder: {
      width: 6,
      height: 6,
    },
    scroll: {
      flex: 1,
    },
    loading: {
      gap: spacing.md,
    },
    center: {
      marginTop: spacing.xl,
      alignItems: 'center',
    },
    errorText: {
      marginBottom: spacing.md,
    },
    empty: {
      marginTop: spacing.xl,
    },
    emptyBody: {
      marginTop: spacing.sm,
    },
    taskList: {
      gap: spacing.itemGap,
    },
    taskItem: {
      marginBottom: spacing.xs,
    },
  });
}
