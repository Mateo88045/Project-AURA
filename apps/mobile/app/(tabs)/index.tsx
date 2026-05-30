import { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@chronos/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { RiverTimeline } from '../../components/schedule/RiverTimeline';
import { TimelineBlock } from '../../components/schedule/TimelineBlock';
import { ChronosSkeleton } from '../../components/ui/ChronosSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { ChronosButton } from '../../components/ui/ChronosButton';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useScheduledBlocks } from '../../hooks/useScheduledBlocks';
import { useFixedEvents } from '../../hooks/useFixedEvents';
import { greetingPrefix, todayKey } from '../../lib/time';

export default function TodayScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const day = todayKey();

  const { data: user } = useCurrentUser();
  const blocks = useScheduledBlocks(user?.id ?? null, day);
  const fixed = useFixedEvents(user?.id ?? null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    blocks.refetch();
    setTimeout(() => setRefreshing(false), 600);
  }, [blocks]);

  const hasShadow = blocks.data.some((b) => b.status === 'shadow');
  const todayWeekday = new Date().getDay();
  const todaysFixed = fixed.data.filter((e) => e.daysOfWeek.includes(todayWeekday));

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          <Text style={styles.greetingThin}>{greetingPrefix()}</Text>{' '}
          <Text style={styles.greetingBold}>{user?.displayName ?? '—'}</Text>
        </Text>
        <Text style={styles.dateLine}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {hasShadow ? (
        <View style={styles.shadowBanner}>
          <View style={styles.shadowDot} />
          <Text style={styles.shadowText}>
            New schedule draft waiting for your review.
          </Text>
          <ChronosButton
            label="Review"
            size="sm"
            variant="secondary"
            onPress={() => router.push('/schedule/review')}
          />
        </View>
      ) : null}

      {blocks.loading ? (
        <View style={{ gap: 16, marginTop: 8 }}>
          <ChronosSkeleton height={20} width="40%" />
          <ChronosSkeleton height={56} />
          <ChronosSkeleton height={56} />
          <ChronosSkeleton height={56} />
        </View>
      ) : blocks.error ? (
        <ErrorState onRetry={blocks.refetch} />
      ) : blocks.data.length === 0 && todaysFixed.length === 0 ? (
        <EmptyState
          title="Your river is still."
          body="Connect a class platform or add a task to start the flow."
          action={
            <ChronosButton
              label="Add a task"
              onPress={() => router.push('/ai/chat')}
              variant="primary"
            />
          }
        />
      ) : (
        <RiverTimeline>
          {/* Fixed events for today (ghost dots) */}
          {todaysFixed.map((e) => {
            const iso = (t: string) => `${day}T${t}:00`;
            return (
              <TimelineBlock
                key={e.id}
                kind="fixed"
                title={e.title}
                startTime={iso(e.startTime)}
                endTime={iso(e.endTime)}
              />
            );
          })}
          {blocks.data.map((b) => (
            <TimelineBlock
              key={b.id}
              kind={b.status === 'shadow' ? 'shadow' : 'ai'}
              title={b.task?.title ?? 'Untitled block'}
              startTime={b.startTime}
              endTime={b.endTime}
              subject={b.task?.subject}
              difficulty={b.task?.difficulty}
              onPress={b.taskId ? () => router.push(`/tasks/${b.taskId}`) : undefined}
            />
          ))}
        </RiverTimeline>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 24, gap: 6 },
  greeting: { fontSize: 32, letterSpacing: -1.2, color: Colors.textPrimary },
  greetingThin: { fontWeight: '300' },
  greetingBold: { fontWeight: '700' },
  dateLine: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  shadowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.3)',
    backgroundColor: 'rgba(168,218,220,0.06)',
    marginBottom: 18,
  },
  shadowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mist,
    shadowColor: Colors.mist,
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  shadowText: { flex: 1, color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
});
