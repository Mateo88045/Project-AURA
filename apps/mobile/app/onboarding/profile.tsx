import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AuraButton } from '../../components/ui/AuraButton';
import { useToast } from '../../components/ui/AuraToast';
import { sanitizeDisplayName } from '../../lib/validation';
import { setAuthToken, setUserId } from '../../lib/storage';
import { IS_DEMO_MODE } from '../../lib/env';

const GRADES = [9, 10, 11, 12];
const STUDY_TIMES = ['morning', 'afternoon', 'evening'] as const;
type StudyTime = (typeof STUDY_TIMES)[number];

export default function OnboardingProfile() {
  const router = useRouter();
  const toast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [studyTime, setStudyTime] = useState<StudyTime | null>(null);
  const [homeworkHours, setHomeworkHours] = useState('3');
  const [submitting, setSubmitting] = useState(false);

  const valid =
    displayName.trim().length >= 1 &&
    grade !== null &&
    studyTime !== null &&
    Number(homeworkHours) > 0 &&
    Number(homeworkHours) <= 12;

  const finish = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      // TODO: Supabase — upsert users { display_name, grade_level,
      // onboarding_answers, timezone, daily_trigger_time }. Returns auth token
      // we store in SecureStore.
      if (!IS_DEMO_MODE) {
        // Fails closed: a production build should never reach onboarding
        // without a real Supabase signup wired in. If you see this in prod,
        // Dev B's signup call is missing.
        toast.show('Signup isn\'t available yet. Try again later.', 'error');
        return;
      }
      const demoToken = `demo:${Date.now()}`;
      await setAuthToken(demoToken);
      await setUserId('demo-user');
      toast.show(`Welcome, ${sanitizeDisplayName(displayName)}.`, 'success');
      router.replace('/(tabs)');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.h1}>Tell Aura about you</Text>
      <Text style={styles.sub}>So she can build a schedule that fits your life.</Text>

      <View style={{ marginTop: 28, gap: 22 }}>
        <View>
          <Text style={styles.label}>Your first name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={(t) => setDisplayName(sanitizeDisplayName(t))}
            placeholder="Alex"
            placeholderTextColor="rgba(142,175,194,0.5)"
            maxLength={50}
            autoCapitalize="words"
          />
        </View>

        <View>
          <Text style={styles.label}>Grade</Text>
          <View style={styles.chipRow}>
            {GRADES.map((g) => (
              <Pressable
                key={g}
                onPress={() => setGrade(g)}
                accessibilityRole="button"
                accessibilityLabel={`Grade ${g}`}
                style={[styles.chip, grade === g && styles.chipActive]}
              >
                <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.label}>When do you do your best work?</Text>
          <View style={styles.chipRow}>
            {STUDY_TIMES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setStudyTime(t)}
                accessibilityRole="button"
                style={[styles.chip, studyTime === t && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, studyTime === t && styles.chipTextActive, { textTransform: 'capitalize' }]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.label}>Average homework hours per day</Text>
          <TextInput
            style={[styles.input, { maxWidth: 100 }]}
            value={homeworkHours}
            onChangeText={(t) => setHomeworkHours(t.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>
      </View>

      <View style={{ marginTop: 36 }}>
        <AuraButton
          label="Build my schedule"
          onPress={finish}
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
  h1: { color: Colors.textPrimary, fontSize: 28, fontWeight: '700', letterSpacing: -0.8 },
  sub: { color: Colors.textSecondary, fontSize: 14, marginTop: 8, lineHeight: 20 },
  label: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(168,218,220,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.2)',
    backgroundColor: 'rgba(168,218,220,0.04)',
  },
  chipActive: {
    backgroundColor: 'rgba(168,218,220,0.18)',
    borderColor: Colors.mist,
  },
  chipText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: Colors.textPrimary, fontWeight: '600' },
});
