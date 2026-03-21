import { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { AuraButton } from '../../components/ui/AuraButton';

const MOCK_USER_ID = 'user-1';

async function saveUserProfileStub(params: {
  userId: string;
  name: string;
  gradeLevel: number | null;
  wakeTime: string;
  bedTime: string;
}) {
  // TODO: Supabase — upsert into `users` with display_name, grade_level, onboarding_answers, daily_trigger_time, timezone
  console.log('[STUB] Saving user profile', params);
}

/**
 * Onboarding — Profile — /onboarding/profile
 */
export default function OnboardingProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [bedTime, setBedTime] = useState('22:30');
  const [submitting, setSubmitting] = useState(false);

  const numericGrade =
    gradeLevel.trim().length > 0 ? Number.parseInt(gradeLevel.trim(), 10) : null;

  const canSubmit =
    name.trim().length > 0 &&
    numericGrade !== null &&
    Number.isFinite(numericGrade) &&
    numericGrade >= 8 &&
    numericGrade <= 12;

  async function handleFinish() {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      await saveUserProfileStub({
        userId: MOCK_USER_ID,
        name: name.trim(),
        gradeLevel: numericGrade,
        wakeTime,
        bedTime,
      });
    } finally {
      setSubmitting(false);
      router.push('/(tabs)');
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: Colors.bgDark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        className="flex-1 justify-between"
        style={{ paddingHorizontal: Layout.screenPadding, paddingTop: 80, paddingBottom: 40 }}
      >
        <View>
          <Text
            className="text-xs font-light tracking-[1.5px]"
            style={{ color: Colors.textSecondary }}
          >
            STEP 2 · YOU
          </Text>
          <Text
            className="text-2xl font-semibold mt-2"
            style={{ color: Colors.textPrimary }}
          >
            Tell Aura who it&apos;s planning for.
          </Text>

          <View className="mt-6 space-y-4">
            <View>
              <Text className="text-xs mb-1" style={{ color: Colors.textSecondary }}>
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Alex Rivera"
                placeholderTextColor={Colors.textSecondary}
                className="border rounded-lg px-4 py-3"
                style={{
                  borderColor: 'rgba(69, 123, 157, 0.2)',
                  color: Colors.textPrimary,
                }}
              />
            </View>

            <View>
              <Text className="text-xs mb-1" style={{ color: Colors.textSecondary }}>
                Grade level
              </Text>
              <TextInput
                value={gradeLevel}
                onChangeText={setGradeLevel}
                placeholder="11"
                keyboardType="number-pad"
                placeholderTextColor={Colors.textSecondary}
                className="border rounded-lg px-4 py-3"
                style={{
                  borderColor: 'rgba(69, 123, 157, 0.2)',
                  color: Colors.textPrimary,
                }}
              />
              <Text className="text-[11px] mt-1" style={{ color: Colors.textSecondary }}>
                Most Aura students are in grades 9–12, but you can use it earlier too.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs mb-1" style={{ color: Colors.textSecondary }}>
                  Usual wake time
                </Text>
                <TextInput
                  value={wakeTime}
                  onChangeText={setWakeTime}
                  placeholder="07:00"
                  placeholderTextColor={Colors.textSecondary}
                  className="border rounded-lg px-4 py-3"
                  style={{
                    borderColor: 'rgba(69, 123, 157, 0.2)',
                    color: Colors.textPrimary,
                  }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs mb-1" style={{ color: Colors.textSecondary }}>
                  Usual bedtime
                </Text>
                <TextInput
                  value={bedTime}
                  onChangeText={setBedTime}
                  placeholder="22:30"
                  placeholderTextColor={Colors.textSecondary}
                  className="border rounded-lg px-4 py-3"
                  style={{
                    borderColor: 'rgba(69, 123, 157, 0.2)',
                    color: Colors.textPrimary,
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        <View>
          <AuraButton
            label="Finish and see today"
            size="lg"
            onPress={handleFinish}
            disabled={!canSubmit}
            loading={submitting}
          />
          <Text className="text-xs mt-3" style={{ color: Colors.textSecondary }}>
            Aura uses this to avoid late-night homework spikes and to time your daily check-in.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

