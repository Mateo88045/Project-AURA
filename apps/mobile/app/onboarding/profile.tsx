import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Colors } from '@aura/shared/constants/colors';
import type { Difficulty } from '@aura/shared/types';
import {
  BEDTIME_OPTIONS,
  EXTRACURRICULARS,
  HOMEWORK_OPTIONS,
  SUBJECTS,
  TOTAL_STEPS,
  useOnboardingForm,
} from '../../hooks/useOnboardingForm';
import AuraButton from '../../components/ui/AuraButton';
import OptionPill from '../../components/ui/OptionPill';
import SubjectCard from '../../components/ui/SubjectCard';
import StudyTimeCard from '../../components/ui/StudyTimeCard';
import StepProgress from '../../components/onboarding/StepProgress';
import AmbientOrbs from '../../components/onboarding/AmbientOrbs';

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const form = useOnboardingForm();
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(-form.currentStep * width, {
      damping: 80,
      stiffness: 200,
    });
  }, [form.currentStep, width]);

  const containerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    flexDirection: 'row',
    width: TOTAL_STEPS * width,
    flex: 1,
  }));

  async function handleSubmit() {
    const ok = await form.submit();
    if (ok) router.push('/onboarding/connect');
  }

  const isLastStep = form.currentStep === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={styles.root}>
      <AmbientOrbs />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          {form.currentStep > 0 ? (
            <Pressable
              onPress={form.retreat}
              style={styles.backBtn}
              hitSlop={12}
              accessibilityLabel="Go back"
            >
              <Text style={styles.chevron}>‹</Text>
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          <View style={styles.progressWrapper}>
            <StepProgress total={TOTAL_STEPS} current={form.currentStep} />
          </View>
          <View style={styles.backBtn} />
        </View>

        {/* Animated step slides */}
        <View style={styles.slideWindow}>
          <Animated.View style={containerAnimStyle}>
            <Step0Name width={width} form={form} />
            <Step1Grade width={width} form={form} />
            <Step2Subjects width={width} form={form} />
            <Step3Extracurriculars width={width} form={form} />
            <Step4StudyTime width={width} form={form} />
            <Step5Bedtime width={width} form={form} />
            <Step6Review width={width} form={form} />
          </Animated.View>
        </View>

        {/* Footer CTA */}
        <View style={styles.footer}>
          {form.submitError ? (
            <Text style={styles.errorText}>{form.submitError}</Text>
          ) : null}
          <AuraButton
            label={isLastStep ? 'Build My Schedule' : 'Continue'}
            onPress={isLastStep ? handleSubmit : form.advance}
            disabled={!form.canAdvance}
            loading={form.submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Step 0: Name ───────────────────────────────────────────────────────────

function Step0Name({
  width,
  form,
}: {
  width: number;
  form: ReturnType<typeof useOnboardingForm>;
}) {
  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={[styles.step, styles.stepPadded]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepHeading}>What should{'\n'}Aura call you?</Text>
      <Text style={styles.stepSub}>We'll personalize everything around you.</Text>
      <TextInput
        style={styles.nameInput}
        value={form.displayName}
        onChangeText={form.setDisplayName}
        placeholder="Your name"
        placeholderTextColor={`${Colors.textSecondary}66`}
        autoFocus
        returnKeyType="done"
        maxLength={32}
        autoCapitalize="words"
        onSubmitEditing={form.canAdvance ? form.advance : undefined}
      />
    </ScrollView>
  );
}

// ─── Step 1: Grade ───────────────────────────────────────────────────────────

const GRADES: Array<{ label: string; value: number }> = [
  { label: '9th', value: 9 },
  { label: '10th', value: 10 },
  { label: '11th', value: 11 },
  { label: '12th', value: 12 },
];

function Step1Grade({
  width,
  form,
}: {
  width: number;
  form: ReturnType<typeof useOnboardingForm>;
}) {
  function pickGrade(value: number) {
    form.setGradeLevel(value);
    // Auto-advance after brief delay so the selection is visible
    setTimeout(() => form.advance(), 400);
  }

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={[styles.step, styles.stepPadded]}
    >
      <Text style={styles.stepHeading}>What grade{'\n'}are you in?</Text>
      <Text style={styles.stepSub}>Aura adjusts workload expectations by grade.</Text>
      <View style={styles.pillRow}>
        {GRADES.map((g) => (
          <OptionPill
            key={g.value}
            label={g.label}
            selected={form.gradeLevel === g.value}
            onPress={() => pickGrade(g.value)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Step 2: Subjects ─────────────────────────────────────────────────────

function Step2Subjects({
  width,
  form,
}: {
  width: number;
  form: ReturnType<typeof useOnboardingForm>;
}) {
  const selectedCount = form.subjects.length;

  return (
    <ScrollView style={{ width }} contentContainerStyle={styles.stepPadded}>
      <View style={styles.headingRow}>
        <Text style={styles.stepHeadingMd}>Which subjects{'\n'}are you taking?</Text>
        {selectedCount > 0 && (
          <Text style={styles.countTag}>{selectedCount} selected</Text>
        )}
      </View>
      <Text style={styles.stepSub}>Tap one, then rate how easy it feels for you.</Text>
      <View style={styles.subjectGrid}>
        {SUBJECTS.map((item) => {
          const entry = form.subjects.find((s) => s.subject === item);
          return (
            <SubjectCard
              key={item}
              subject={item}
              selected={!!entry}
              confidence={(entry?.confidence ?? 3) as Difficulty}
              onToggle={() => form.toggleSubject(item)}
              onConfidenceChange={(level) => form.setSubjectConfidence(item, level)}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Step 3: Extracurriculars ─────────────────────────────────────────────

function Step3Extracurriculars({
  width,
  form,
}: {
  width: number;
  form: ReturnType<typeof useOnboardingForm>;
}) {
  const count = form.extracurriculars.length;

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={[styles.step, styles.stepPadded]}
    >
      <View style={styles.headingRow}>
        <Text style={styles.stepHeading}>What do you do{'\n'}after school?</Text>
        {count > 0 && <Text style={styles.countTag}>{count} selected</Text>}
      </View>
      <Text style={styles.stepSub}>Aura won't schedule homework over your life.</Text>
      <View style={styles.pillWrap}>
        {EXTRACURRICULARS.map((item) => (
          <OptionPill
            key={item}
            label={item}
            selected={form.extracurriculars.includes(item)}
            onPress={() => form.toggleExtracurricular(item)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Step 4: Study Time + Homework Hours ─────────────────────────────────

const STUDY_OPTIONS: Array<{
  value: 'morning' | 'afternoon' | 'evening';
  label: string;
  subLabel: string;
}> = [
  { value: 'morning', label: 'Morning person', subLabel: 'Before 10 AM' },
  { value: 'afternoon', label: 'After school', subLabel: '2 PM – 6 PM' },
  { value: 'evening', label: 'Night owl', subLabel: 'After dinner' },
];

function Step4StudyTime({
  width,
  form,
}: {
  width: number;
  form: ReturnType<typeof useOnboardingForm>;
}) {
  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={[styles.step, styles.stepPadded]}
    >
      <Text style={styles.stepHeading}>When do you do{'\n'}your best work?</Text>
      <Text style={styles.stepSub}>We'll prioritize scheduling during these windows.</Text>
      <View style={styles.cardStack}>
        {STUDY_OPTIONS.map((opt) => (
          <StudyTimeCard
            key={opt.value}
            value={opt.value}
            label={opt.label}
            subLabel={opt.subLabel}
            selected={form.preferredStudyTime === opt.value}
            onPress={() => form.setPreferredStudyTime(opt.value)}
          />
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.subHeading}>On a typical school night...</Text>
      <Text style={styles.stepSub}>How many hours of homework do you usually have?</Text>
      <View style={styles.pillWrap}>
        {HOMEWORK_OPTIONS.map((opt) => (
          <OptionPill
            key={opt.label}
            label={opt.label}
            selected={form.averageHomeworkHours === opt.value}
            onPress={() => form.setAverageHomeworkHours(opt.value)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Step 5: Bedtime / No-Work Cutoff ────────────────────────────────────

function Step5Bedtime({
  width,
  form,
}: {
  width: number;
  form: ReturnType<typeof useOnboardingForm>;
}) {
  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={[styles.step, styles.stepPadded]}
    >
      <Text style={styles.stepHeading}>When should Aura{'\n'}stop scheduling?</Text>
      <Text style={styles.stepSub}>Nothing gets put on your plate after this time.</Text>
      <View style={styles.pillWrap}>
        {BEDTIME_OPTIONS.map((opt) => (
          <OptionPill
            key={opt.value}
            label={opt.label}
            selected={form.noWorkAfterTime === opt.value}
            onPress={() => form.setNoWorkAfterTime(opt.value)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Step 6: Review ──────────────────────────────────────────────────────

function Step6Review({
  width,
  form,
}: {
  width: number;
  form: ReturnType<typeof useOnboardingForm>;
}) {
  const subjectSummary =
    form.subjects.length === 0
      ? 'None added'
      : form.subjects.length <= 3
        ? form.subjects.map((s) => s.subject).join(', ')
        : `${form.subjects
            .slice(0, 3)
            .map((s) => s.subject)
            .join(', ')} + ${form.subjects.length - 3} more`;

  const extraSummary =
    form.extracurriculars.length === 0
      ? 'None added'
      : form.extracurriculars.length <= 3
        ? form.extracurriculars.join(', ')
        : `${form.extracurriculars.slice(0, 3).join(', ')} + ${
            form.extracurriculars.length - 3
          } more`;

  const studyLabel =
    STUDY_OPTIONS.find((o) => o.value === form.preferredStudyTime)?.label ?? '—';
  const homeworkLabel =
    HOMEWORK_OPTIONS.find((o) => o.value === form.averageHomeworkHours)?.label ?? '—';
  const bedtimeLabel =
    BEDTIME_OPTIONS.find((o) => o.value === form.noWorkAfterTime)?.label ?? '—';

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={[styles.step, styles.stepPadded]}
    >
      <Text style={styles.stepHeadingMd}>
        You're all set,{' '}
        <Text style={styles.nameHighlight}>{form.displayName}</Text>.
      </Text>
      <Text style={styles.stepSub}>Here's what Aura knows about you.</Text>

      <View style={styles.summaryCard}>
        <SummaryRow label="Grade" value={`${form.gradeLevel}th Grade`} />
        <SummaryRow label="Subjects" value={subjectSummary} />
        <SummaryRow label="After school" value={extraSummary} />
        <SummaryRow label="Study time" value={studyLabel} />
        <SummaryRow label="Homework load" value={homeworkLabel} />
        <SummaryRow label="No work after" value={bedtimeLabel} last />
      </View>
    </ScrollView>
  );
}

function SummaryRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, !last && styles.summaryRowBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    color: Colors.textSecondary,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300',
  },
  progressWrapper: {
    flex: 1,
  },
  slideWindow: {
    flex: 1,
    overflow: 'hidden',
  },
  step: {
    flexGrow: 1,
    gap: 16,
  },
  stepPadded: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 24,
  },
  stepHeading: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1.0,
    lineHeight: 36,
  },
  stepHeadingMd: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  stepSub: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  countTag: {
    color: Colors.mist,
    fontSize: 13,
    fontWeight: '600',
    paddingBottom: 4,
  },
  nameInput: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.steel}60`,
    paddingBottom: 10,
    marginTop: 12,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  cardStack: {
    gap: 10,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: `${Colors.steel}30`,
    marginVertical: 8,
  },
  subHeading: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  nameHighlight: {
    color: Colors.mist,
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${Colors.steel}30`,
    backgroundColor: `${Colors.steel}0D`,
    overflow: 'hidden',
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.steel}20`,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    paddingTop: 8,
    gap: 10,
  },
  errorText: {
    color: Colors.red,
    fontSize: 13,
    textAlign: 'center',
  },
});
