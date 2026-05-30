import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import type { Difficulty, TaskType } from '@chronos/shared/types';
import { useTheme } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraButton } from '../../components/ui/AuraButton';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { DifficultyBars } from '../../components/ui/DifficultyBars';
import { useCreateTask } from '../../hooks/useCreateTask';
import { useAuraToast } from '../../components/ui/AuraToast';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';
const STAGGER_MS = 40;
const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'essay', label: 'Essay' },
  { value: 'problem_set', label: 'Problem Set' },
  { value: 'reading', label: 'Reading' },
  { value: 'project', label: 'Project' },
  { value: 'study_guide', label: 'Study Guide' },
  { value: 'quiz_prep', label: 'Quiz Prep' },
  { value: 'other', label: 'Other' },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NewTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user: authUser } = useAuth();
  const { createTask, loading } = useCreateTask(authUser?.id ?? '');
  const toast = useAuraToast();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [taskType, setTaskType] = useState<TaskType>('other');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<Difficulty>(3);

  const canSave = title.trim().length > 0 && subject.trim().length > 0;

  function adjustMinutes(delta: number) {
    setEstimatedMinutes((prev) => Math.min(300, Math.max(15, prev + delta)));
    haptic.selection();
  }

  async function handleSave() {
    if (!canSave || loading) return;
    haptic.primaryCTA();
    try {
      await createTask({
        title: title.trim(),
        subject: subject.trim(),
        dueDate: dueDate.toISOString(),
        taskType,
        estimatedMinutes,
        difficulty,
      });
      haptic.success();
      toast.show('Task added', 'success');
      router.back();
    } catch {
      toast.show('Something went wrong — try again', 'error');
    }
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <AmbientOrbs />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View entering={FadeIn.duration(220)} style={styles.headerRow}>
          <Pressable
            onPress={() => { haptic.selection(); router.back(); }}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <AuraSymbol name="xmark" size={20} color={colors.text.secondary} />
          </Pressable>
          <Text style={styles.headerTitle}>New Task</Text>
          <View style={styles.headerRight} />
        </Animated.View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(STAGGER_MS).duration(280)}>
            <GlassCard intensity="thick" style={styles.formCard}>
              {/* Title */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>TITLE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Write lab report"
                  placeholderTextColor={colors.text.tertiary}
                  value={title}
                  onChangeText={setTitle}
                  returnKeyType="next"
                  autoFocus
                />
              </View>

              <View style={styles.divider} />

              {/* Subject */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>SUBJECT</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. AP Chemistry"
                  placeholderTextColor={colors.text.tertiary}
                  value={subject}
                  onChangeText={setSubject}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.divider} />

              {/* Due date */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>DUE DATE</Text>
                <Pressable
                  onPress={() => {
                    haptic.selection();
                    // TODO: Open date picker — DateTimePicker or custom glass picker
                    // For now, advance by 1 day as a stub interaction
                    setDueDate((prev) => {
                      const d = new Date(prev);
                      d.setDate(d.getDate() + 1);
                      return d;
                    });
                  }}
                  style={styles.datePill}
                  accessibilityRole="button"
                >
                  <AuraSymbol name="calendar" size={16} color={colors.text.tertiary} />
                  <Text style={styles.datePillText}>{formatDate(dueDate)}</Text>
                  <AuraSymbol name="chevron.right" size={12} color={colors.text.tertiary} />
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Task type */}
          <Animated.View
            entering={FadeInDown.delay(STAGGER_MS * 2).duration(280)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>TASK TYPE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {TASK_TYPES.map(({ value, label }) => {
                const selected = taskType === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => { haptic.selection(); setTaskType(value); }}
                    style={[styles.chip, selected && styles.chipSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Estimated time */}
          <Animated.View
            entering={FadeInDown.delay(STAGGER_MS * 3).duration(280)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>ESTIMATED TIME</Text>
            <GlassCard intensity="light" style={styles.stepperCard}>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() => adjustMinutes(-15)}
                  style={styles.stepperBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease by 15 minutes"
                >
                  <AuraSymbol name="minus" size={18} color={colors.text.secondary} />
                </Pressable>
                <View style={styles.stepperValue}>
                  <Text style={styles.stepperNumber}>{estimatedMinutes}</Text>
                  <Text style={styles.stepperUnit}>min</Text>
                </View>
                <Pressable
                  onPress={() => adjustMinutes(15)}
                  style={styles.stepperBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Increase by 15 minutes"
                >
                  <AuraSymbol name="plus" size={18} color={colors.text.secondary} />
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Difficulty */}
          <Animated.View
            entering={FadeInDown.delay(STAGGER_MS * 4).duration(280)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>DIFFICULTY</Text>
            <GlassCard intensity="light" style={styles.difficultyCard}>
              <View style={styles.difficultyRow}>
                {/* Invisible hit targets overlaid on DifficultyBars */}
                <View style={[styles.difficultyBarsWrap, { pointerEvents: 'none' }]}>
                  <DifficultyBars level={difficulty} animated={false} />
                </View>
                <View style={styles.difficultyHitTargets}>
                  {([1, 2, 3, 4, 5] as const).map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => {
                        haptic.selection();
                        setDifficulty(level);
                      }}
                      style={styles.difficultyHitTarget}
                      accessibilityRole="button"
                      accessibilityLabel={`Difficulty ${level}`}
                    />
                  ))}
                </View>
                <Text style={styles.difficultyLabel}>
                  {difficulty === 1 && 'Easy'}
                  {difficulty === 2 && 'Light'}
                  {difficulty === 3 && 'Moderate'}
                  {difficulty === 4 && 'Hard'}
                  {difficulty === 5 && 'Very Hard'}
                </Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Save button */}
          <Animated.View
            entering={FadeInDown.delay(STAGGER_MS * 5).duration(280)}
            style={styles.saveWrap}
          >
            <AuraButton
              label={loading ? 'Saving…' : 'Save task'}
              size="lg"
              fullWidth
              onPress={handleSave}
            />
          </Animated.View>
        </ScrollView>
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
    flex: { flex: 1 },
    header: {
      paddingHorizontal: spacing.screenPadding,
      paddingBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.glass.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...typography.title2,
      color: c.text.primary,
    },
    headerRight: { width: 36 },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: spacing.screenPadding,
      paddingBottom: spacing.xxl + 16,
    },
    formCard: {
      borderRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    field: {
      paddingVertical: spacing.md,
    },
    fieldLabel: {
      ...typography.micro,
      color: c.text.tertiary,
      marginBottom: spacing.xs,
      letterSpacing: 1.5,
    },
    input: {
      ...typography.body,
      color: c.text.primary,
      paddingVertical: spacing.xs,
    },
    divider: {
      height: 1,
      backgroundColor: c.border.subtle,
    },
    datePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    datePillText: {
      ...typography.body,
      color: c.text.secondary,
      flex: 1,
    },
    section: {
      marginTop: spacing.xl,
    },
    sectionLabel: {
      ...typography.micro,
      color: c.text.tertiary,
      letterSpacing: 1.5,
      marginBottom: spacing.sm,
    },
    chipRow: {
      gap: spacing.sm,
      paddingRight: spacing.screenPadding,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    chipSelected: {
      backgroundColor: c.glass.accent,
      borderColor: c.border.accent,
    },
    chipText: {
      ...typography.callout,
      color: c.text.secondary,
    },
    chipTextSelected: {
      color: c.text.primary,
    },
    stepperCard: {
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepperBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperValue: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
    },
    stepperNumber: {
      ...typography.displayMedium,
      color: c.text.primary,
    },
    stepperUnit: {
      ...typography.callout,
      color: c.text.secondary,
    },
    difficultyCard: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    difficultyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    difficultyBarsWrap: {
      // Absolute positioned to allow Pressables over it
    },
    difficultyHitTargets: {
      position: 'absolute',
      left: 0,
      top: -8,
      flexDirection: 'row',
      gap: 4,
    },
    difficultyHitTarget: {
      width: 28,
      height: 32,
    },
    difficultyLabel: {
      ...typography.callout,
      color: c.text.secondary,
      marginLeft: spacing.xs,
    },
    saveWrap: {
      marginTop: spacing.xl,
    },
  });
}
