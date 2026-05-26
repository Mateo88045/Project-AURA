import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { AuraButton } from '../../../components/ui/AuraButton';
import { useToast } from '../../../components/ui/AuraToast';
import { useTask } from '../../../hooks/useTasks';
import { completeTask } from '../../../services/jobs';
import { useAuth } from '../../../hooks/useAuth';
import type { UserFeedback } from '@aura/shared/types';

const FEEDBACK_LABELS: Record<UserFeedback, string> = {
  too_short: 'Too little',
  about_right: 'Just right',
  too_long: 'Too much',
};

export default function CompleteTask() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: task } = useTask(id ?? null);
  const { userId } = useAuth();
  const [actual, setActual] = useState('');
  const [feedback, setFeedback] = useState<UserFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const valid = Number(actual) > 0 && feedback !== null;

  const submit = async () => {
    if (!valid || !task || !userId) return;
    setSubmitting(true);
    try {
      await completeTask(task.id, userId, task.estimatedMinutes, Number(actual), feedback!);
      toast.show('Nice work.', 'success');
      router.dismissAll();
    } catch (e) {
      toast.show((e as Error).message || "Couldn't save that.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="How'd it go?" eyebrow="Wrap up" />
      {task ? <Text style={styles.taskTitle}>{task.title}</Text> : null}

      <View style={{ marginTop: 28, gap: 22 }}>
        <View>
          <Text style={styles.label}>Actual time spent</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={styles.input}
              value={actual}
              onChangeText={(t) => setActual(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={3}
              placeholder={task ? String(task.estimatedMinutes) : '60'}
              placeholderTextColor="rgba(142,175,194,0.5)"
            />
            <Text style={styles.unit}>min</Text>
            {task ? (
              <Text style={styles.estimate}>
                We estimated {task.estimatedMinutes} min
              </Text>
            ) : null}
          </View>
        </View>

        <View>
          <Text style={styles.label}>How did the estimate feel?</Text>
          <View style={styles.chipRow}>
            {(['too_short', 'about_right', 'too_long'] as UserFeedback[]).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFeedback(f)}
                accessibilityRole="button"
                style={[styles.chip, feedback === f && styles.chipActive]}
              >
                <Text style={[styles.chipText, feedback === f && styles.chipTextActive]}>
                  {FEEDBACK_LABELS[f]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={{ marginTop: 36 }}>
        <AuraButton
          label="Save & continue"
          onPress={submit}
          loading={submitting}
          disabled={!valid}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  taskTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    backgroundColor: 'rgba(168,218,220,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    width: 90,
    textAlign: 'center',
  },
  unit: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  estimate: { color: Colors.textSecondary, fontSize: 12, marginLeft: 'auto' },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.2)',
    backgroundColor: 'rgba(168,218,220,0.04)',
  },
  chipActive: { backgroundColor: 'rgba(168,218,220,0.18)', borderColor: Colors.mist },
  chipText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: Colors.textPrimary, fontWeight: '600' },
});
