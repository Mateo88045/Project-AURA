import { useMemo, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
import { requestNotificationPermissions } from '../../lib/notifications';

const STAGGER_MS = 40;
const STEPS_TOTAL = 5;
const CURRENT_STEP = 4;

type StudyTime = 'morning' | 'afternoon' | 'evening';

const STUDY_OPTIONS: { value: StudyTime; label: string; icon: string }[] = [
  { value: 'morning', label: 'Morning', icon: '☀️' },
  { value: 'afternoon', label: 'Afternoon', icon: '🌤️' },
  { value: 'evening', label: 'Evening', icon: '🌙' },
];

const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6];

function backdropColors(mode: ResolvedMode): [string, string, string] {
  return mode === 'light'
    ? ['#F8FAFC', '#F1F5F9', '#F8FAFC']
    : ['#07090F', '#0D1117', '#07090F'];
}

export default function OnboardingPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [studyTime, setStudyTime] = useState<StudyTime>('evening');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [bedTime, setBedTime] = useState('22:30');
  const [dailyHours, setDailyHours] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  async function handleFinish() {
    setSubmitting(true);

    if (userId) {
      // Derive trigger time: 2 hours before bedtime
      const [bedH] = bedTime.split(':').map(Number);
      const triggerH = Math.max(0, bedH - 2);
      const dailyTriggerTime = `${String(triggerH).padStart(2, '0')}:00`;

      // Detect timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Fetch existing onboarding_answers to merge subjects
      const { data: existingUser } = await supabase
        .from('users')
        .select('onboarding_answers')
        .eq('id', userId)
        .single();

      const existingAnswers = existingUser?.onboarding_answers ?? {};
      const fullAnswers = {
        ...existingAnswers,
        extracurriculars: [],
        averageHomeworkHours: dailyHours,
        preferredStudyTime: studyTime,
      };

      // Update user profile
      await supabase
        .from('users')
        .update({
          onboarding_answers: fullAnswers,
          daily_trigger_time: dailyTriggerTime,
          timezone,
          onboarding_step: 4,
        })
        .eq('id', userId);

      // Insert guardrails
      await supabase.from('guardrails').insert([
        {
          user_id: userId,
          rule_type: 'no_work_after',
          value: { time: bedTime },
          active: true,
        },
        {
          user_id: userId,
          rule_type: 'max_hours_per_day',
          value: { hours: dailyHours },
          active: true,
        },
      ]);
    }

    await requestNotificationPermissions();
    setSubmitting(false);
    router.push('/onboarding/questionnaire' as Href);
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

      <KeyboardAvoidingView
        style={styles.kbWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          {/* Progress dots */}
          <Animated.View entering={FadeIn.duration(280)} style={styles.progressRow}>
            {Array.from({ length: STEPS_TOTAL }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === CURRENT_STEP && styles.dotActive]}
              />
            ))}
          </Animated.View>

          {/* Content */}
          <ScrollView
            style={styles.scrollWrap}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeIn.delay(STAGGER_MS).duration(320)}>
              <GlassCard intensity="light" style={styles.card}>
                <View style={styles.cardInner}>
                  <Animated.View entering={FadeInDown.delay(STAGGER_MS * 2).duration(320)}>
                    <Text style={styles.label}>STEP 4 · YOUR RHYTHM</Text>
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(STAGGER_MS * 3).duration(320)}>
                    <Text style={styles.title}>A few last things.</Text>
                  </Animated.View>

                  <Animated.View
                    entering={FadeInDown.delay(STAGGER_MS * 4).duration(320)}
                    style={styles.fields}
                  >
                    {/* Study time preference */}
                    <View>
                      <Text style={styles.inputLabel}>WHEN DO YOU STUDY BEST?</Text>
                      <View style={styles.pillRow}>
                        {STUDY_OPTIONS.map((option) => {
                          const isActive = studyTime === option.value;
                          return (
                            <Pressable
                              key={option.value}
                              onPress={() => {
                                haptic.selection();
                                setStudyTime(option.value);
                              }}
                              style={[
                                styles.pill,
                                isActive && styles.pillActive,
                              ]}
                            >
                              <Text style={[
                                styles.pillText,
                                isActive && { color: colors.accent.blue },
                              ]}>
                                {option.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {/* Wake / Bed times */}
                    <View style={styles.timeRow}>
                      <View style={styles.timeCol}>
                        <Text style={styles.inputLabel}>WAKE UP</Text>
                        <TextInput
                          value={wakeTime}
                          onChangeText={setWakeTime}
                          placeholder="07:00"
                          placeholderTextColor={colors.text.tertiary}
                          style={styles.input}
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>
                      <View style={styles.timeCol}>
                        <Text style={styles.inputLabel}>BEDTIME</Text>
                        <TextInput
                          value={bedTime}
                          onChangeText={setBedTime}
                          placeholder="22:30"
                          placeholderTextColor={colors.text.tertiary}
                          style={styles.input}
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>
                    </View>

                    <Text style={styles.bedtimeHint}>
                      Chronos won't schedule work after your bedtime.
                    </Text>

                    {/* Daily hours */}
                    <View>
                      <Text style={styles.inputLabel}>DAILY STUDY HOURS</Text>
                      <View style={styles.hourRow}>
                        {HOUR_OPTIONS.map((h) => {
                          const isActive = dailyHours === h;
                          return (
                            <Pressable
                              key={h}
                              onPress={() => {
                                haptic.selection();
                                setDailyHours(h);
                              }}
                              style={[
                                styles.hourDot,
                                isActive && styles.hourDotActive,
                              ]}
                            >
                              <Text style={[
                                styles.hourText,
                                isActive && { color: colors.text.inverse },
                              ]}>
                                {h}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      <Text style={styles.hourHint}>
                        ~{dailyHours} hour{dailyHours > 1 ? 's' : ''} of homework per day
                      </Text>
                    </View>
                  </Animated.View>
                </View>
              </GlassCard>
            </Animated.View>
          </ScrollView>

          {/* CTA */}
          <Animated.View
            entering={FadeIn.delay(STAGGER_MS * 5).duration(320)}
            style={styles.ctaWrap}
          >
            <View style={styles.ctaButton}>
              <AuraButton
                label="Continue"
                size="lg"
                fullWidth
                onPress={() => { void handleFinish(); }}
                loading={submitting}
              />
            </View>
            <Text style={styles.disclaimer}>
              Chronos will send you a daily briefing notification.
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    kbWrap: { flex: 1 },
    container: {
      flex: 1,
      paddingHorizontal: spacing.screenPadding,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingTop: spacing.sm,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border.subtle,
    },
    dotActive: {
      width: 8,
      backgroundColor: c.accent.blue,
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
      maxWidth: 340,
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
      marginBottom: spacing.lg,
    },
    fields: {
      gap: spacing.xl,
    },
    inputLabel: {
      ...typography.micro,
      color: c.text.tertiary,
      marginBottom: spacing.sm,
    },
    input: {
      ...typography.body,
      color: c.text.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    pillRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    pill: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.glass.light,
      alignItems: 'center',
    },
    pillActive: {
      borderColor: c.accent.blue,
      backgroundColor: c.glass.accent,
    },
    pillText: {
      ...typography.callout,
      color: c.text.secondary,
      fontWeight: '500',
    },
    timeRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    timeCol: {
      flex: 1,
    },
    bedtimeHint: {
      ...typography.callout,
      color: c.text.tertiary,
      marginTop: -spacing.md,
    },
    hourRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    hourDot: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    hourDotActive: {
      backgroundColor: c.accent.blue,
      borderColor: c.accent.blue,
    },
    hourText: {
      ...typography.headline,
      color: c.text.secondary,
    },
    hourHint: {
      ...typography.callout,
      color: c.text.tertiary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    ctaWrap: {
      width: '100%',
      alignItems: 'center',
    },
    ctaButton: {
      width: '100%',
      maxWidth: 340,
    },
    disclaimer: {
      ...typography.callout,
      marginTop: spacing.md,
      color: c.text.tertiary,
      textAlign: 'center',
    },
  });
}
