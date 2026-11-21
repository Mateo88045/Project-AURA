import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { difficultyLabels, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import type { ScheduledBlock } from '@chronos/shared/types';
import { useTheme } from '../../lib/theme';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { useRequirePro } from '../../lib/requirePro';
import { haptic } from '../../lib/haptics';
import { toLocalDayIso } from '../../lib/localDate';
import { clock, dateFromHHMM, formatDue, formatDuration, minutesBetween } from '../../lib/dayFormat';
import { NotificationCenter } from '../../components/ui/NotificationCenter';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { useAuraToast } from '../../components/ui/AuraToast';
import { DraftReviewChip } from '../../components/schedule/DraftReviewChip';
import { UpNextCard } from '../../components/schedule/UpNextCard';
import { LaterTodayList, type LaterRow } from '../../components/schedule/LaterTodayList';

interface Item {
  key: string;
  start: Date;
  end: Date;
  title: string;
  block?: ScheduledBlock;
}

function greeting(name: string): string {
  const h = new Date().getHours();
  return `${h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'}, ${name}`;
}

export default function TodayScreen() {
  const router = useRouter();
  const requirePro = useRequirePro();
  const toast = useAuraToast();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const { user: authUser } = useAuth();
  const userId = authUser?.id ?? '';
  const today = useMemo(() => new Date(), []);
  const { user } = useUserProfile(userId);
  const { scheduledBlocks, fixedEvents, loading, error, refetch } = useTodaySchedule(userId, toLocalDayIso(today));
  const notif = useNotifications(userId);
  const [notifVisible, setNotifVisible] = useState(false);

  const view = useMemo(() => {
    const now = new Date();
    const items: Item[] = [
      ...fixedEvents.map((e) => ({
        key: `f-${e.id}`, start: dateFromHHMM(e.startTime, today), end: dateFromHHMM(e.endTime, today), title: e.title,
      })),
      ...scheduledBlocks
        .filter((b) => b.task && b.status !== 'rejected')
        .map((b) => ({ key: `b-${b.id}`, start: new Date(b.startTime), end: new Date(b.endTime), title: b.task!.title, block: b })),
    ].sort((a, b) => a.start.getTime() - b.start.getTime());

    // Shadow drafts are proposals: they show on the list but never count as
    // the plan, and can't be started.
    const homework = items.filter((i) => i.block && i.block.status !== 'shadow');
    const left = homework.filter((i) => i.end > now && i.block!.status !== 'completed');
    const live = left.find((i) => i.start <= now);
    const hero = live ?? left[0];
    const doneBy = homework.length ? homework[homework.length - 1].end : null;
    const minutesLeft = left.reduce((m, i) => m + minutesBetween(i.start > now ? i.start : now, i.end), 0);

    const upcoming = items.filter((i) => i.end > now && i !== hero);
    const later: LaterRow[] = upcoming
      .map((i) => {
        const t = i.block?.task;
        return {
          key: i.key,
          time: clock(i.start),
          title: i.title,
          kind: t ? ('homework' as const) : ('fixed' as const),
          isDraft: i.block?.status === 'shadow',
          meta: t ? [`${minutesBetween(i.start, i.end)} min`, difficultyLabels[t.difficulty], formatDue(t.dueDate, now)].filter(Boolean).join(' · ') : undefined,
        };
      });
    // Free row sits where the plan ends, so drafts after it still read in time order.
    if (doneBy && doneBy > now) {
      const at = upcoming.filter((i) => i.start < doneBy).length;
      later.splice(at, 0, { key: 'free', time: clock(doneBy), title: 'Free for the night', kind: 'free' });
    }

    return {
      now, hero, doneBy, later, left: left.length, minutesLeft,
      drafts: scheduledBlocks.filter((b) => b.task && b.status === 'shadow').length,
    };
  }, [scheduledBlocks, fixedEvents, today]);

  const firstName = user?.displayName?.split(' ')[0] ?? 'there';
  const allDone = view.doneBy !== null && view.doneBy <= view.now;
  const title = !view.doneBy ? 'Nothing scheduled' : allDone ? 'Done for today' : `Done by ${clock(view.doneBy)}`;
  const subline = !view.doneBy
    ? greeting(firstName)
    : allDone
      ? 'Free for the night'
      : `${view.left} ${view.left === 1 ? 'block' : 'blocks'} left · ${formatDuration(view.minutesLeft)} of homework`;
  const heroTask = view.hero?.block?.task;

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 15 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <View style={s.headerText}>
            <Text style={s.eyebrow}>
              {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            {loading ? (
              <AuraSkeleton width={220} height={34} style={s.titleSkeleton} />
            ) : (
              <>
                <Text style={s.title} accessibilityRole="header">{title}</Text>
                <Text style={s.subline}>{subline}</Text>
              </>
            )}
          </View>
          <View style={s.headerActions}>
            <Pressable
              style={s.iconBtn}
              onPress={() => { haptic.selection(); setNotifVisible(true); }}
              accessibilityRole="button"
              accessibilityLabel={notif.unreadCount > 0 ? `${notif.unreadCount} unread notifications` : 'Notifications'}
            >
              <AuraSymbol name="bell.fill" size={20} color={colors.text.secondary} />
              {notif.unreadCount > 0 && <View style={s.badge} />}
            </Pressable>
            <Pressable
              style={[s.iconBtn, s.addBtn]}
              onPress={() => { haptic.primaryCTA(); requirePro('add_task', () => router.push('/tasks/new' as Href)); }}
              accessibilityRole="button"
              accessibilityLabel="Add task"
            >
              <AuraSymbol name="plus" size={20} color={colors.accent.sky} />
            </Pressable>
          </View>
        </View>

        {!loading && view.drafts > 0 && (
          <View style={s.draftWrap}>
            <DraftReviewChip count={view.drafts} onPress={() => router.push('/schedule/review' as Href)} />
          </View>
        )}

        {loading && <AuraSkeleton height={200} style={s.cardSkeleton} />}

        {!loading && error && (
          <View style={s.errorBox}>
            <Text style={s.subline}>Couldn&apos;t load today&apos;s schedule.</Text>
            <Pressable onPress={() => { haptic.secondary(); refetch(); }} style={s.retry} accessibilityRole="button">
              <Text style={s.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && view.hero && heroTask && (
          <UpNextCard
            mode={view.hero.start <= view.now ? 'now' : 'next'}
            startsInMin={minutesBetween(view.now, view.hero.start)}
            title={heroTask.title}
            timeRange={`${clock(view.hero.start)}–${clock(view.hero.end)}`}
            subject={heroTask.subject}
            due={formatDue(heroTask.dueDate, view.now)}
            difficulty={heroTask.difficulty}
            onStart={() => router.push(`/tasks/${heroTask.id}/active` as Href)}
            // TODO(dusk): wire to a reschedule endpoint once one exists; the
            // scheduler has no "shift block" call today.
            onPush={() => toast.show("Pushing a block isn't wired up yet", 'info')}
          />
        )}

        {!loading && !error && view.later.length > 0 && <LaterTodayList rows={view.later} />}
      </ScrollView>

      <NotificationCenter
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        notifications={notif.notifications}
        unreadCount={notif.unreadCount}
        loading={notif.loading}
        onMarkRead={notif.markRead}
        onMarkAllRead={notif.markAllRead}
      />
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background.primary },
    content: { paddingHorizontal: 20, paddingBottom: 32 },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    headerText: { flex: 1 },
    eyebrow: { ...typography.nSubhead, fontWeight: '600', color: c.text.secondary },
    title: { ...typography.nLargeTitle, color: c.text.primary, marginTop: 2, fontVariant: ['tabular-nums'] },
    titleSkeleton: { marginTop: 6 },
    subline: { ...typography.nSubhead, color: c.text.secondary, marginTop: 4 },
    headerActions: { flexDirection: 'row', gap: 4, marginTop: 8 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    addBtn: { backgroundColor: c.background.surface },
    badge: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent.coral },
    draftWrap: { marginTop: 16 },
    cardSkeleton: { marginTop: 24, borderRadius: 20 },
    errorBox: { marginTop: 24, padding: 18, borderRadius: 20, backgroundColor: c.background.surface, gap: 12 },
    retry: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
    retryText: { ...typography.nHeadline, color: c.accent.sky },
  });
}
