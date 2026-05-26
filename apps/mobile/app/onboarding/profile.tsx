import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AuraButton } from '../../components/ui/AuraButton';
import { useToast } from '../../components/ui/AuraToast';
import { sanitizeDisplayName } from '../../lib/validation';
import { getSupabaseOrNull } from '../../lib/supabase';
import { IS_DEMO_MODE } from '../../lib/env';
import { setAuthToken, setUserId } from '../../lib/storage';
import { useAuth } from '../../hooks/useAuth';

const GRADES = [9, 10, 11, 12];
const STUDY_TIMES = ['morning', 'afternoon', 'evening'] as const;
type StudyTime = (typeof STUDY_TIMES)[number];

export default function OnboardingProfile() {
  const router = useRouter();
  const toast = useToast();
  const { userId } = useAuth();
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
      const supabase = getSupabaseOrNull();
      if (!supabase) {
        if (!IS_DEMO_MODE) {
          toast.show("Signup isn't available — try again later.", 'error');
          return;
        }
        // Pure demo mode (no Supabase configured) — keep a marker so the
        // auth guard lets us into the tabs.
        await setAuthToken(`demo:${Date.now()}`);
        await setUserId('demo-user');
        toast.show(`Welcome, ${sanitizeDisplayName(displayName)}.`, 'success');
        router.replace('/(tabs)');
        return;
      }
      if (!userId) {
        toast.show('Sign in first, then complete your profile.', 'error');
        router.replace('/onboarding/connect');
        return;
      }
      const { error } = await supabase
        .from('users')
        .update({
          display_name: sanitizeDisplayName(displayName),
          grade_level: grade,
          onboarding_answers: {
            subjects: [],
            extracurriculars: [],
            averageHomeworkHours: Number(homeworkHours),
            preferredStudyTime: studyTime,
          },
          onboarding_step: 100,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        .eq('id', userId);
      if (error) throw error;
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        await setAuthToken(sessionData.session.access_token);
        await setUserId(userId);
      }
      toast.show(`Welcome, ${sanitizeDisplayName(displayName)}.`, 'success');
      router.replace('/(tabs)');
    } catch (e) {
      toast.show((e as Error).message || 'Could not save profile.', 'error');
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
                  style={[
                    styles.chipText,
                    studyTime === t && styles.chipTextActive,
                    { textTransform: 'capitalize' },
                  ]}
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
