import { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { supabase } from '@chronos/shared/supabase';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import type { Difficulty, SubjectStrength } from '@chronos/shared/types';
import { useTheme, type ResolvedMode } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraButton } from '../../components/ui/AuraButton';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';

const STAGGER_MS = 40;
const STEPS_TOTAL = 5;
const CURRENT_STEP = 2;

const DEFAULT_SUBJECTS = [
  'Math', 'English', 'Science', 'History',
  'Spanish', 'Art', 'Computer Science', 'PE',
];

function backdropColors(mode: ResolvedMode): [string, string, string] {
  return mode === 'light'
    ? ['#F8FAFC', '#F1F5F9', '#F8FAFC']
    : ['#07090F', '#0D1117', '#07090F'];
}

// ── Confidence dots ─────────────────────────────────────────────────────

interface ConfidenceDotsProps {
  value: Difficulty;
  onChange: (v: Difficulty) => void;
  colors: ThemeColors;
}

function ConfidenceDots({ value, onChange, colors }: ConfidenceDotsProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
      {([1, 2, 3, 4, 5] as Difficulty[]).map((level) => (
        <Pressable
          key={level}
          onPress={() => {
            haptic.selection();
            onChange(level);
          }}
          hitSlop={6}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: level <= value
                ? colors.accent.blue
                : colors.border.subtle,
            }}
          />
        </Pressable>
      ))}
    </View>
  );
}

// ── Subject chip ────────────────────────────────────────────────────────

interface SubjectChipProps {
  subject: string;
  selected: boolean;
  confidence: Difficulty;
  onToggle: () => void;
  onConfidenceChange: (v: Difficulty) => void;
  colors: ThemeColors;
  chipStyles: ReturnType<typeof makeStyles>;
}

function SubjectChip({
  subject,
  selected,
  confidence,
  onToggle,
  onConfidenceChange,
  colors,
  chipStyles,
}: SubjectChipProps) {
  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onToggle();
      }}
      style={[chipStyles.chip, selected && chipStyles.chipSelected]}
    >
      <Text
        style={[
          chipStyles.chipText,
          selected && { color: colors.accent.blue },
        ]}
      >
        {subject}
      </Text>
      {selected && (
        <ConfidenceDots
          value={confidence}
          onChange={onConfidenceChange}
          colors={colors}
        />
      )}
    </Pressable>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<SubjectStrength[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const numericGrade =
    gradeLevel.trim().length > 0 ? Number.parseInt(gradeLevel.trim(), 10) : null;

  const canSubmit =
    name.trim().length > 0 &&
    numericGrade !== null &&
    Number.isFinite(numericGrade) &&
    numericGrade >= 8 &&
    numericGrade <= 12 &&
    subjects.length > 0;

  function toggleSubject(subjectName: string) {
    setSubjects((prev) => {
      const existing = prev.find((s) => s.subject === subjectName);
      if (existing) {
        return prev.filter((s) => s.subject !== subjectName);
      }
      return [...prev, { subject: subjectName, confidence: 3 as Difficulty }];
    });
  }

  function setConfidence(subjectName: string, confidence: Difficulty) {
    setSubjects((prev) =>
      prev.map((s) =>
        s.subject === subjectName ? { ...s, confidence } : s,
      ),
    );
  }

  function addCustomSubject() {
    const trimmed = customSubject.trim();
    if (!trimmed) return;
    if (subjects.find((s) => s.subject === trimmed)) return;
    setSubjects((prev) => [...prev, { subject: trimmed, confidence: 3 as Difficulty }]);
    setCustomSubject('');
    setShowCustomInput(false);
  }

  function isSelected(subjectName: string): boolean {
    return subjects.some((s) => s.subject === subjectName);
  }

  function getConfidence(subjectName: string): Difficulty {
    return subjects.find((s) => s.subject === subjectName)?.confidence ?? 3;
  }

  // All unique subject names (defaults + any custom ones)
  const allSubjectNames = [
    ...DEFAULT_SUBJECTS,
    ...subjects
      .filter((s) => !DEFAULT_SUBJECTS.includes(s.subject))
      .map((s) => s.subject),
  ];

  async function handleContinue() {
    if (!canSubmit) return;
    setSubmitting(true);

    if (userId) {
      await supabase
        .from('users')
        .update({
          display_name: name.trim(),
          grade_level: numericGrade,
          onboarding_answers: { subjects },
          onboarding_step: 2,
        })
        .eq('id', userId);
    }

    setSubmitting(false);
    router.push('/onboarding/schedule');
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

          {/* Scrollable content */}
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
                    <Text style={styles.label}>STEP 2 OF 4 · YOU</Text>
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(STAGGER_MS * 3).duration(320)}>
                    <Text style={styles.title}>Tell Chronos about you.</Text>
                  </Animated.View>

                  <Animated.View
                    entering={FadeInDown.delay(STAGGER_MS * 4).duration(320)}
                    style={styles.fields}
                  >
                    {/* Name + Grade */}
                    <View>
                      <Text style={styles.inputLabel}>NAME</Text>
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Alex Rivera"
                        placeholderTextColor={colors.text.tertiary}
                        style={styles.input}
                      />
                    </View>

                    <View>
                      <Text style={styles.inputLabel}>GRADE LEVEL</Text>
                      <TextInput
                        value={gradeLevel}
                        onChangeText={setGradeLevel}
                        placeholder="11"
                        keyboardType="number-pad"
                        placeholderTextColor={colors.text.tertiary}
                        style={styles.input}
                      />
                    </View>

                    {/* Subject chips */}
                    <View>
                      <Text style={styles.inputLabel}>YOUR SUBJECTS</Text>
                      <Text style={styles.subjectHint}>
                        Tap to add. Dots show confidence (1–5).
                      </Text>
                      <View style={styles.chipGrid}>
                        {allSubjectNames.map((subjectName) => (
                          <SubjectChip
                            key={subjectName}
                            subject={subjectName}
                            selected={isSelected(subjectName)}
                            confidence={getConfidence(subjectName)}
                            onToggle={() => toggleSubject(subjectName)}
                            onConfidenceChange={(v) => setConfidence(subjectName, v)}
                            colors={colors}
                            chipStyles={styles}
                          />
                        ))}

                        {/* Add custom subject */}
                        {showCustomInput ? (
                          <View style={styles.customInputWrap}>
                            <TextInput
                              value={customSubject}
                              onChangeText={setCustomSubject}
                              placeholder="Subject name"
                              placeholderTextColor={colors.text.tertiary}
                              style={styles.customInput}
                              autoFocus
                              returnKeyType="done"
                              onSubmitEditing={addCustomSubject}
                            />
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => setShowCustomInput(true)}
                            style={[styles.chip, styles.addChip]}
                          >
                            <Text style={[styles.chipText, { color: colors.accent.blue }]}>
                              + Add
                            </Text>
                          </Pressable>
                        )}
                      </View>
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
                onPress={() => { void handleContinue(); }}
                disabled={!canSubmit}
                loading={submitting}
              />
            </View>
            {subjects.length === 0 && (
              <Text style={styles.disclaimer}>
                Select at least one subject to continue.
              </Text>
            )}
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
    kbWrap: {
      flex: 1,
    },
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
      gap: spacing.lg,
    },
    inputLabel: {
      ...typography.micro,
      color: c.text.tertiary,
      marginBottom: spacing.xs,
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
    subjectHint: {
      ...typography.callout,
      color: c.text.tertiary,
      marginBottom: spacing.sm,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.glass.light,
      alignItems: 'center',
    },
    chipSelected: {
      borderColor: c.accent.blue,
      backgroundColor: c.glass.accent,
    },
    chipText: {
      ...typography.callout,
      color: c.text.primary,
    },
    addChip: {
      borderStyle: 'dashed',
      borderColor: c.accent.blue,
    },
    customInputWrap: {
      width: '100%',
    },
    customInput: {
      ...typography.callout,
      color: c.text.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.accent.blue,
      backgroundColor: c.glass.light,
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
