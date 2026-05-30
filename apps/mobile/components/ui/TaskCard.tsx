import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Colors } from '@chronos/shared/constants/colors';
import { Layout } from '@chronos/shared/constants/layout';
import type { Task } from '@chronos/shared/types';
import { DifficultyBadge } from './DifficultyBadge';
import { durationLabel, relativeDueLabel } from '../../lib/time';

interface Props {
  task: Task;
  onPress?: () => void;
}

export function TaskCard({ task, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${task.subject}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <Text style={styles.subject}>{task.subject.toUpperCase()}</Text>
        <Text style={styles.due}>{relativeDueLabel(task.dueDate)}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {task.title}
      </Text>
      <View style={styles.meta}>
        <DifficultyBadge difficulty={task.difficulty} />
        <Text style={styles.duration}>{durationLabel(task.estimatedMinutes)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(168,218,220,0.04)',
    borderRadius: Layout.radiusCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.12)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 10,
  },
  pressed: { opacity: 0.7 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subject: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.5,
  },
  due: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  duration: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
});
