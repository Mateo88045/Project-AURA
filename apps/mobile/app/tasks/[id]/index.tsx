import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { AuraSkeleton } from '../../../components/ui/AuraSkeleton';
import { AuraButton } from '../../../components/ui/AuraButton';
import { DifficultyBadge } from '../../../components/ui/DifficultyBadge';
import { useTask } from '../../../hooks/useTasks';
import { durationLabel, relativeDueLabel } from '../../../lib/time';

const TASK_TYPE_LABELS = {
  essay: 'Essay',
  problem_set: 'Problem set',
  reading: 'Reading',
  project: 'Project',
  study_guide: 'Study guide',
  quiz_prep: 'Quiz prep',
  other: 'Other',
} as const;

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, loading } = useTask(id ?? null);

  if (loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title=" " />
        <View style={{ gap: 12 }}>
          <AuraSkeleton height={28} width="80%" />
          <AuraSkeleton height={14} width="50%" />
          <AuraSkeleton height={120} />
        </View>
      </ScreenContainer>
    );
  }

  if (!data) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Task" />
        <Text style={styles.body}>That task isn't here.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title={data.subject} eyebrow="Task" />
      <Text style={styles.title}>{data.title}</Text>

      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 12 }}>
        <DifficultyBadge difficulty={data.difficulty} />
        <Text style={styles.meta}>{durationLabel(data.estimatedMinutes)}</Text>
        <Text style={styles.meta}>{relativeDueLabel(data.dueDate)}</Text>
      </View>

      <View style={styles.metaCard}>
        <MetaRow label="Type" value={TASK_TYPE_LABELS[data.taskType]} />
        <MetaRow label="Source" value={data.source.replace('_', ' ')} />
        <MetaRow label="Status" value={data.status} />
      </View>

      {data.description ? (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionLabel}>DETAILS</Text>
          <Text style={styles.description}>{data.description}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: 32, gap: 10 }}>
        <AuraButton
          label="Mark complete"
          onPress={() => router.push(`/tasks/${data.id}/complete`)}
          variant="primary"
          size="lg"
          fullWidth
        />
        <AuraButton
          label="Reschedule with Aura"
          onPress={() => router.push('/ai/chat')}
          variant="secondary"
          fullWidth
        />
      </View>
    </ScreenContainer>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaRowLabel}>{label}</Text>
      <Text style={styles.metaRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: '700', letterSpacing: -0.5, lineHeight: 30 },
  meta: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  metaCard: {
    marginTop: 22,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(168,218,220,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.1)',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(168,218,220,0.08)',
  },
  metaRowLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  metaRowValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  sectionLabel: { color: Colors.mist, fontSize: 10, letterSpacing: 2.5, fontWeight: '600', marginBottom: 8 },
  description: { color: Colors.textPrimary, fontSize: 14, lineHeight: 21 },
  body: { color: Colors.textSecondary, fontSize: 14 },
});
