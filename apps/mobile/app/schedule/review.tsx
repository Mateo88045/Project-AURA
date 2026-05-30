import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { Colors } from '@chronos/shared/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { RiverTimeline } from '../../components/schedule/RiverTimeline';
import { TimelineBlock } from '../../components/schedule/TimelineBlock';
import { ChronosButton } from '../../components/ui/ChronosButton';
import { ChronosSkeleton } from '../../components/ui/ChronosSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/ChronosToast';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useScheduledBlocks } from '../../hooks/useScheduledBlocks';
import { approveShadowSchedule } from '../../services/jobs';
import { todayKey, durationLabel, minutesBetween } from '../../lib/time';

export default function ScheduleReview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { data: user } = useCurrentUser();
  const day = todayKey();
  const blocks = useScheduledBlocks(user?.id ?? null, day, ['shadow']);
  const [submitting, setSubmitting] = useState(false);

  const totalMinutes = blocks.data.reduce(
    (acc, b) => acc + minutesBetween(b.startTime, b.endTime),
    0,
  );

  const approve = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await approveShadowSchedule(user.id, day);
      toast.show('Schedule approved. See you on the river.', 'success');
      router.back();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AmbientOrbs />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>SHADOW SCHEDULE</Text>
          <Text style={styles.title}>Review today's draft</Text>
        </View>
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
        >
          <X color={Colors.textSecondary} size={20} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 12, paddingBottom: 140 }}>
        {blocks.loading ? (
          <View style={{ gap: 14 }}>
            {[0, 1, 2, 3].map((i) => (
              <ChronosSkeleton key={i} height={64} />
            ))}
          </View>
        ) : blocks.error ? (
          <ErrorState
            message="Couldn't load the draft schedule. Try again in a moment."
            onRetry={blocks.refetch}
          />
        ) : blocks.data.length === 0 ? (
          <EmptyState
            title="Nothing to review."
            body="Chronos hasn't drafted any new blocks for today yet."
          />
        ) : (
          <>
            <Text style={styles.summary}>
              {blocks.data.length} blocks · {durationLabel(totalMinutes)}
            </Text>
            <RiverTimeline showNow={false}>
              {blocks.data.map((b) => (
                <TimelineBlock
                  key={b.id}
                  kind="shadow"
                  title={b.task?.title ?? 'Untitled'}
                  startTime={b.startTime}
                  endTime={b.endTime}
                  subject={b.task?.subject}
                  difficulty={b.task?.difficulty}
                />
              ))}
            </RiverTimeline>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <ChronosButton
          label="Tweak in chat"
          onPress={() => {
            router.back();
            router.push('/ai/chat');
          }}
          variant="ghost"
        />
        <View style={{ flex: 1 }}>
          <ChronosButton
            label="Approve schedule"
            onPress={approve}
            loading={submitting}
            variant="primary"
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  eyebrow: { color: Colors.mist, fontSize: 10, letterSpacing: 2.5, fontWeight: '600' },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginTop: 4 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168,218,220,0.08)',
  },
  summary: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(10,17,24,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(168,218,220,0.1)',
  },
});
