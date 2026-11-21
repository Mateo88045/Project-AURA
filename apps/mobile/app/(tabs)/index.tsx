import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, spacing } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { useRequirePro } from '../../lib/requirePro';
import { haptic } from '../../lib/haptics';
import { toLocalDayIso } from '../../lib/localDate';
import { Screen } from '../../components/ui/Screen';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { AuraButton } from '../../components/ui/AuraButton';
import { AuraText } from '../../components/ui/AuraText';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { CalmEmptyState } from '../../components/ui/CalmEmptyState';
import { NotificationCenter } from '../../components/ui/NotificationCenter';
import { DraftReviewChip } from '../../components/schedule/DraftReviewChip';
import { DayStrip } from '../../components/schedule/DayStrip';
import { BlocksTimeline } from '../../components/schedule/BlocksTimeline';
import { buildItems, daySummary, pickFocusBlock } from '../../components/schedule/dayPlan';

function useNowMs(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function TodayScreen() {
  const router = useRouter();
  const requirePro = useRequirePro();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const today = useMemo(() => new Date(), []);
  const nowMs = useNowMs();
  const { user: authUser } = useAuth();
  const userId = authUser?.id ?? '';
  const [notifVisible, setNotifVisible] = useState(false);
  const { notifications, unreadCount, loading: notifLoading, markRead, markAllRead } =
    useNotifications(userId);
  const { scheduledBlocks, fixedEvents, loading, error, refetch } = useTodaySchedule(
    userId,
    toLocalDayIso(today),
  );

  const focus = useMemo(() => pickFocusBlock(scheduledBlocks, nowMs), [scheduledBlocks, nowMs]);
  const items = useMemo(
    () => buildItems(scheduledBlocks, fixedEvents, focus?.id ?? null),
    [scheduledBlocks, fixedEvents, focus],
  );
  const summary = useMemo(() => daySummary(scheduledBlocks, nowMs), [scheduledBlocks, nowMs]);
  const draftCount = scheduledBlocks.filter((b) => b.task && b.status === 'shadow').length;
  const now = new Date(nowMs);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const month = today.toLocaleDateString(undefined, { month: 'long' });

  return (
    <Screen orbs={false}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.month}>{month}</Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => { haptic.selection(); setNotifVisible(true); }}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          >
            <AuraSymbol name="bell.fill" size={20} color={colors.text.secondary} />
            {unreadCount > 0 && <View style={styles.badge} />}
          </Pressable>
          <Pressable
            onPress={() => {
              haptic.primaryCTA();
              requirePro('add_task', () => router.push('/tasks/new' as Href));
            }}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Add homework"
          >
            <AuraSymbol name="plus" size={22} color={colors.background.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <DayStrip today={today} />

        {loading ? (
          <View style={styles.loading}>
            <AuraSkeleton height={44} width={220} />
            <AuraSkeleton height={16} width={180} />
            <AuraSkeleton height={320} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <AuraText variant="body" color="secondary">Couldn&apos;t load today&apos;s schedule.</AuraText>
            <AuraButton label="Try again" variant="outline" onPress={refetch} />
          </View>
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={styles.headline} accessibilityRole="header">
                {summary.headline}
                {summary.meridiem ? <Text style={styles.headlineMer}> {summary.meridiem}</Text> : null}
              </Text>
              <Text style={styles.subline}>{summary.subline}</Text>
            </View>

            {draftCount > 0 && (
              <View style={styles.draftWrap}>
                <DraftReviewChip
                  count={draftCount}
                  onPress={() => router.push('/schedule/review' as Href)}
                />
              </View>
            )}

            {items.length === 0 ? (
              <CalmEmptyState
                title="Nothing on the clock"
                body="Add homework or connect your classes and your day fills in here, block by block."
                icon="calendar"
              />
            ) : (
              <BlocksTimeline
                items={items}
                nowMin={nowMin}
                onStart={(item) => {
                  if (!item.taskId) return;
                  haptic.primaryCTA();
                  router.push(`/tasks/${item.taskId}/active` as Href);
                }}
              />
            )}
          </>
        )}
      </ScrollView>

      <NotificationCenter
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={notifLoading}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />
    </Screen>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing.lg,
    },
    month: { fontFamily: fontFamily.display, fontSize: 28, letterSpacing: -0.6, color: c.text.primary },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    badge: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.accent.coral,
    },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.text.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
    summary: { marginTop: spacing.xl, marginBottom: spacing.lg, gap: 4 },
    headline: {
      fontFamily: fontFamily.display,
      fontSize: 44,
      lineHeight: 48,
      letterSpacing: -1.4,
      color: c.text.primary,
      fontVariant: ['tabular-nums'],
    },
    headlineMer: { fontSize: 22, letterSpacing: 0, color: c.text.secondary },
    subline: { fontSize: 15, fontWeight: '500', color: c.text.secondary, fontVariant: ['tabular-nums'] },
    draftWrap: { marginBottom: spacing.md, alignItems: 'flex-start' },
    loading: { marginTop: spacing.xl, gap: spacing.md },
    center: { marginTop: spacing.xxl, alignItems: 'center', gap: spacing.md },
  });
}
