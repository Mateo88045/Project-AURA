import { useMemo, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { supabase } from '@chronos/shared/supabase';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme, type ResolvedMode } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraButton } from '../../components/ui/AuraButton';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';

const STAGGER_MS = 40;

interface Question {
  id: string;
  prompt: string;
  options: { value: string; label: string }[];
}

// Short, high-completion intake. Answers personalize copy + are stored on the
// user row so the scheduler/copilot can reference them later.
const QUESTIONS: Question[] = [
  {
    id: 'struggle',
    prompt: 'What trips you up most?',
    options: [
      { value: 'procrastination', label: 'I put things off' },
      { value: 'overcommitted', label: 'Too many activities' },
      { value: 'deadlines', label: 'I forget deadlines' },
      { value: 'big_projects', label: 'Big projects pile up' },
    ],
  },
  {
    id: 'workload',
    prompt: 'How does your workload feel right now?',
    options: [
      { value: 'on_top', label: "I'm on top of it" },
      { value: 'behind', label: 'A little behind' },
      { value: 'swamped', label: 'Totally swamped' },
    ],
  },
  {
    id: 'goal',
    prompt: 'What would make Chronos worth it?',
    options: [
      { value: 'grades', label: 'Better grades' },
      { value: 'stress', label: 'Less stress' },
      { value: 'free_time', label: 'More free time' },
      { value: 'organized', label: 'Finally feel organized' },
    ],
  },
];

function backdropColors(mode: ResolvedMode): [string, string, string] {
  return mode === 'light'
    ? ['#F8FAFC', '#F1F5F9', '#F8FAFC']
    : ['#07090F', '#0D1117', '#07090F'];
}

export default function OnboardingQuestionnaireScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = QUESTIONS.every((q) => answers[q.id]);

  function select(questionId: string, value: string) {
    haptic.selection();
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleContinue() {
    if (!allAnswered) return;
    setSubmitting(true);

    if (userId) {
      // Merge questionnaire answers into the existing onboarding_answers jsonb.
      const { data: existingUser } = await supabase
        .from('users')
        .select('onboarding_answers')
        .eq('id', userId)
        .single();

      const existingAnswers =
        (existingUser?.onboarding_answers as Record<string, unknown> | null) ?? {};

      await supabase
        .from('users')
        .update({
          onboarding_answers: { ...existingAnswers, questionnaire: answers },
          onboarding_step: 5,
        })
        .eq('id', userId);
    }

    setSubmitting(false);
    router.push('/onboarding/paywall' as Href);
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={backdropColors(resolvedMode)}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <AmbientOrbs />

      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <ScrollView
          style={styles.scrollWrap}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.delay(STAGGER_MS).duration(320)}>
            <GlassCard intensity="light" style={styles.card}>
              <View style={styles.cardInner}>
                <Animated.View entering={FadeInDown.delay(STAGGER_MS * 2).duration(320)}>
                  <Text style={styles.label}>STEP 5 · A FEW QUICK QUESTIONS</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(STAGGER_MS * 3).duration(320)}>
                  <Text style={styles.title}>Let&apos;s make this yours.</Text>
                  <Text style={styles.subtitle}>
                    Three taps. Chronos uses these to tune how it plans your week.
                  </Text>
                </Animated.View>

                <View style={styles.questions}>
                  {QUESTIONS.map((q, qi) => (
                    <Animated.View
                      key={q.id}
                      entering={FadeInDown.delay(STAGGER_MS * (4 + qi)).duration(320)}
                    >
                      <Text style={styles.questionPrompt}>{q.prompt}</Text>
                      <View style={styles.optionGrid}>
                        {q.options.map((opt) => {
                          const active = answers[q.id] === opt.value;
                          return (
                            <Pressable
                              key={opt.value}
                              onPress={() => select(q.id, opt.value)}
                              style={[styles.option, active && styles.optionActive]}
                              accessibilityRole="button"
                              accessibilityState={{ selected: active }}
                              accessibilityLabel={opt.label}
                            >
                              <Text
                                style={[
                                  styles.optionText,
                                  active && { color: colors.accent.blue, fontWeight: '600' },
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        </ScrollView>

        <Animated.View
          entering={FadeIn.delay(STAGGER_MS * 7).duration(320)}
          style={styles.ctaWrap}
        >
          <View style={styles.ctaButton}>
            <AuraButton
              label="Continue"
              size="lg"
              fullWidth
              onPress={() => { void handleContinue(); }}
              disabled={!allAnswered}
              loading={submitting}
            />
          </View>
          {!allAnswered && (
            <Text style={styles.disclaimer}>Answer all three to continue.</Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    container: {
      flex: 1,
      paddingHorizontal: spacing.screenPadding,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    scrollWrap: {
      flex: 1,
      width: '100%',
    },
    scrollContent: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    card: {
      borderRadius: radius.xl,
      maxWidth: 360,
      width: '100%',
    },
    cardInner: {
      padding: spacing.xl,
    },
    label: {
      ...typography.caption,
      color: c.text.tertiary,
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.title2,
      color: c.text.primary,
    },
    subtitle: {
      ...typography.callout,
      color: c.text.secondary,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    questions: {
      gap: spacing.xl,
    },
    questionPrompt: {
      ...typography.bodyMedium,
      color: c.text.primary,
      marginBottom: spacing.sm,
    },
    optionGrid: {
      gap: spacing.sm,
    },
    option: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.glass.light,
    },
    optionActive: {
      borderColor: c.accent.blue,
      backgroundColor: c.glass.accent,
    },
    optionText: {
      ...typography.body,
      color: c.text.primary,
    },
    ctaWrap: {
      width: '100%',
      alignItems: 'center',
    },
    ctaButton: {
      width: '100%',
      maxWidth: 360,
    },
    disclaimer: {
      ...typography.callout,
      marginTop: spacing.md,
      color: c.text.tertiary,
      textAlign: 'center',
    },
  });
}
