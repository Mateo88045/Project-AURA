import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { TaskCard } from '../components/ui/TaskCard';
import { AuraSkeleton } from '../components/ui/AuraSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTasks } from '../hooks/useTasks';
import { durationLabel } from '../lib/time';

export default function Briefing() {
  const { data: user } = useCurrentUser();
  const { data: tasks, loading } = useTasks(user?.id ?? null);

  const upcoming = tasks.filter((t) => t.status !== 'completed');
  const totalMins = upcoming.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const hardest = [...upcoming].sort((a, b) => b.difficulty - a.difficulty).slice(0, 3);

  return (
    <ScreenContainer>
      <ScreenHeader title="Sunday briefing" eyebrow="Your week" />

      {loading ? (
        <View style={{ gap: 12 }}>
          <AuraSkeleton height={80} />
          <AuraSkeleton height={80} />
        </View>
      ) : upcoming.length === 0 ? (
        <EmptyState
          title="A clear week."
          body="No assignments pulled in yet. Aura will pick things up overnight."
        />
      ) : (
        <>
          <View style={styles.summary}>
            <Stat label="Tasks" value={String(upcoming.length)} />
            <Stat label="Effort" value={durationLabel(totalMins)} />
            <Stat label="Hardest" value={`${hardest[0]?.difficulty}/5`} />
          </View>

          <View style={{ marginTop: 28 }}>
            <Text style={styles.sectionLabel}>YOUR THREE BIG ONES</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              {hardest.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </View>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  stat: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.15)',
    backgroundColor: 'rgba(168,218,220,0.04)',
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { color: Colors.textSecondary, fontSize: 10, letterSpacing: 1.5, fontWeight: '500' },
  sectionLabel: { color: Colors.mist, fontSize: 10, letterSpacing: 2.5, fontWeight: '600' },
});
