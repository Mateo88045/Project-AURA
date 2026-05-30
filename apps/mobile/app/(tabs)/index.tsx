import { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Springs } from '@chronos/shared/constants/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import { useUserProfile } from '../../hooks/useUserProfile';
import { Screen } from '../../components/ui/Screen';
import { AuraText } from '../../components/ui/AuraText';
import { AuraAvatar } from '../../components/ui/AuraAvatar';
import { AuraButton } from '../../components/ui/AuraButton';
import { NotificationCenter } from '../../components/ui/NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { GlassCard } from '../../components/ui/GlassCard';
import { TaskBlock } from '../../components/ui/TaskBlock';
import { DifficultyBars } from '../../components/ui/DifficultyBars';
import { RiverLine } from '../../components/ui/RiverLine';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';
import type { Task, ScheduledBlock, FixedEvent } from '@chronos/shared/types';
const STAGGER_MS = 40;
// Scroll distance over which the greeting collapses
const GREETING_COLLAPSE_RANGE = 80;
// Hero parallax: translate at 0.3x scroll speed, capped at -30
const HERO_PARALLAX_MAX = -30;

interface Clock {
  hh: string;
  mer: 'AM' | 'PM';
}

function clockFromDate(d: Date): Clock {
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const mer: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return { hh: `${h12}:${minutes.toString().padStart(2, '0')}`, mer };
}

function clockFromIso(iso: string): Clock {
  return clockFromDate(new Date(iso));
}

function clockFromHHMM(hhmm: string): Clock {
  const [hStr, mStr = '00'] = hhmm.split(':');
  const hours = parseInt(hStr, 10);
  const mer: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return { hh: `${h12}:${mStr.padStart(2, '0')}`, mer };
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

interface TimelineRow {
  key: string;
  clock: Clock;
  variant: 'fixed' | 'scheduled';
  title: string;
  subject: string;
  estimatedMinutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

function buildRows(blocks: ScheduledBlock[], events: FixedEvent[]): TimelineRow[] {
  const rows: TimelineRow[] = [];

  for (const event of events) {
    rows.push({
      key: `fixed-${event.id}`,
      clock: clockFromHHMM(event.startTime),
      variant: 'fixed',
      title: event.title,
      subject: 'Fixed',
      estimatedMinutes: 0,
      difficulty: 1,
    });
  }

  for (const block of blocks) {
    const task = block.task;
    if (!task) continue;
    rows.push({
      key: `sched-${block.id}`,
      clock: clockFromIso(block.startTime),
      variant: 'scheduled',
      title: task.title,
      subject: task.subject,
      estimatedMinutes: task.estimatedMinutes,
      difficulty: task.difficulty,
    });
  }

  return rows;
}

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const today = useMemo(() => new Date(), []);
  const dayIso = today.toISOString().slice(0, 10);
  const { user: authUser } = useAuth();
  const [notifVisible, setNotifVisible] = useState(false);
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    markRead,
    markAllRead,
  } = useNotifications(authUser?.id ?? '');

  const { user } = useUserProfile(authUser?.id ?? '');
  const { scheduledBlocks, fixedEvents, loading, error, refetch } = useTodaySchedule(
    authUser?.id ?? '',
    dayIso,
  );

  const friendlyDate = useMemo(
    () =>
      today.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    [today],
  );

  // Scroll-driven animations
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Greeting collapses: opacity 1→0 and translateY 0→-8 over first 80px of scroll
  const greetingAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, GREETING_COLLAPSE_RANGE], [1, 0], Extrapolation.CLAMP),
    transform: [{
      translateY: interpolate(scrollY.value, [0, GREETING_COLLAPSE_RANGE], [0, -8], Extrapolation.CLAMP),
    }],
    // Collapse height so name slides up cleanly
    marginBottom: interpolate(scrollY.value, [0, GREETING_COLLAPSE_RANGE], [0, -28], Extrapolation.CLAMP),
  }));

  // Date line fades out at same pace as greeting
  const dateAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, GREETING_COLLAPSE_RANGE * 0.8], [1, 0], Extrapolation.CLAMP),
  }));

  // Hero card parallax — drifts up at 0.3× scroll speed
  const heroParallaxStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(scrollY.value, [0, 200], [0, HERO_PARALLAX_MAX], Extrapolation.CLAMP),
    }],
  }));

  // FAB spring
  const fabScale = useSharedValue(1);
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const firstName = user?.displayName?.split(' ')[0] ?? 'there';
  const currentTask: Task | null = scheduledBlocks[0]?.task ?? null;
  const rows = useMemo(
    () => buildRows(scheduledBlocks, fixedEvents),
    [scheduledBlocks, fixedEvents],
  );

  return (
    <Screen>
      {/* Header — sticky, greeting collapses on scroll */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <Animated.View entering={FadeIn.duration(280)} style={greetingAnimStyle}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(STAGGER_MS).duration(280)}>
            <Text style={styles.name}>{firstName}</Text>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(STAGGER_MS * 2).duration(280)} style={dateAnimStyle}>
            <Text style={styles.date}>{friendlyDate}</Text>
          </Animated.View>
        </View>
        <Animated.View entering={FadeIn.delay(STAGGER_MS * 2).duration(280)} style={styles.headerRight}>
          <Pressable
            onPress={() => {
              haptic.selection();
              setNotifVisible(true);
            }}
            hitSlop={10}
            style={styles.bellBtn}
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          >
            <AuraSymbol name="bell.fill" size={20} color={colors.text.secondary} />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: colors.accent.coral }]}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <AuraAvatar name={user?.displayName ?? 'Chronos'} size={42} />
        </Animated.View>
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Current task hero — subtle parallax on scroll */}
        {!loading && currentTask && (
          <Animated.View
            entering={FadeInDown.delay(STAGGER_MS * 3).duration(320)}
            style={[styles.heroWrap, heroParallaxStyle]}
          >
            <GlassCard intensity="thick" borderAccent style={styles.hero}>
              <View style={styles.heroContent}>
                <Text style={[typography.micro, { color: colors.accent.blue }]}>NOW</Text>
                <Text style={styles.heroTitle}>{currentTask.title}</Text>
                <Text style={styles.heroMeta}>
                  {currentTask.subject} · {currentTask.estimatedMinutes} min
                </Text>
                <View style={styles.heroFooter}>
                  <DifficultyBars level={currentTask.difficulty} />
                </View>
                <View style={styles.heroButton}>
                  <AuraButton
                    label="Start"
                    onPress={() => {
                      haptic.primaryCTA();
                      router.push(`/tasks/${currentTask.id}/active` as Href);
                    }}
                    fullWidth
                  />
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Timeline */}
        <View style={styles.timelineHeader}>
          <Animated.View entering={FadeIn.delay(STAGGER_MS * 4).duration(280)}>
            <Text style={styles.timelineTitle}>Today</Text>
          </Animated.View>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loading}>
            <AuraSkeleton height={18} />
            <AuraSkeleton height={80} />
            <AuraSkeleton height={80} />
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.center}>
            <AuraText variant="body" color="hard" style={styles.errorText}>
              Couldn&apos;t load today&apos;s schedule.
            </AuraText>
            <AuraButton label="Try again" variant="outline" onPress={refetch} />
          </View>
        )}

        {/* Empty */}
        {!loading && !error && rows.length === 0 && (
          <View style={styles.empty}>
            <AuraText variant="title2">Your river is quiet</AuraText>
            <AuraText variant="body" color="secondary" style={styles.emptyBody}>
              Connect your classes and Chronos will fill your river with a calm,
              glowing plan.
            </AuraText>
          </View>
        )}

        {/* River Timeline */}
        {!loading && !error && rows.length > 0 && (
          <View style={styles.timeline}>
            <RiverLine />
            {rows.map((row, i) => (
              <Animated.View
                key={row.key}
                entering={FadeIn.delay(STAGGER_MS * (5 + i)).duration(200)}
                style={styles.timelineRow}
              >
                <View style={styles.timelineTimeWrap}>
                  <Text style={styles.timelineTimeValue}>{row.clock.hh}</Text>
                  <Text style={styles.timelineTimeMer}>{row.clock.mer}</Text>
                </View>
                <View style={styles.timelineBlock}>
                  <TaskBlock
                    title={row.title}
                    subject={row.subject}
                    estimatedMinutes={row.estimatedMinutes}
                    difficulty={row.difficulty}
                    variant={row.variant}
                  />
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      <NotificationCenter
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={notifLoading}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />

      {/* Quick-add FAB */}
      <AnimatedPressable
        onPressIn={() => {
          fabScale.value = withSpring(0.88, Springs.bouncy);
        }}
        onPressOut={() => {
          fabScale.value = withSpring(1, Springs.bouncy);
        }}
        onPress={() => {
          haptic.primaryCTA();
          router.push('/tasks/new' as Href);
        }}
        style={[styles.fab, { bottom: insets.bottom + 100 }, fabAnimatedStyle]}
        accessibilityRole="button"
        accessibilityLabel="Quick add"
      >
        <AuraSymbol name="plus" size={24} color={colors.text.inverse} />
      </AnimatedPressable>
    </Screen>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingBottom: spacing.lg,
    },
    headerLeft: {
      flex: 1,
    },
    greeting: {
      fontSize: 22,
      fontWeight: '300' as const,
      letterSpacing: -0.4,
      color: c.text.secondary,
    },
    name: {
      ...typography.displayLarge,
      color: c.text.primary,
      marginTop: 4,
    },
    date: {
      marginTop: 6,
      fontSize: 15,
      fontWeight: '400' as const,
      color: c.text.tertiary,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 6,
    },
    bellBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    bellBadgeText: {
      fontSize: 9,
      fontWeight: '700' as const,
      color: '#FFFFFF',
      lineHeight: 16,
    },
    scroll: {
      flex: 1,
    },
    heroWrap: {
      marginTop: spacing.lg,
      shadowColor: c.accent.blue,
      shadowOffset: { width: -4, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    hero: {
      borderRadius: radius.xl,
    },
    heroContent: {
      padding: spacing.lg,
    },
    heroTitle: {
      ...typography.title2,
      color: c.text.primary,
      marginTop: spacing.xs,
    },
    heroMeta: {
      ...typography.callout,
      color: c.text.secondary,
      marginTop: spacing.xs,
    },
    heroFooter: {
      marginTop: spacing.md,
    },
    heroButton: {
      marginTop: spacing.lg,
    },
    timelineHeader: {
      marginTop: spacing.sectionGap,
      marginBottom: spacing.md,
    },
    timelineTitle: {
      ...typography.title1,
      color: c.text.primary,
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
    timeline: {
      position: 'relative',
    },
    timelineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.itemGap,
    },
    timelineTimeWrap: {
      width: 48,
      alignItems: 'flex-end',
      paddingTop: 2,
    },
    timelineTimeValue: {
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: c.text.secondary,
      fontVariant: ['tabular-nums'],
      lineHeight: 18,
    },
    timelineTimeMer: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 1.1,
      color: c.text.tertiary,
      marginTop: -1,
    },
    timelineBlock: {
      flex: 1,
      marginLeft: 16,
    },
    fab: {
      position: 'absolute',
      right: spacing.screenPadding,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.accent.blue,
      shadowOpacity: 0.5,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
  });
}
