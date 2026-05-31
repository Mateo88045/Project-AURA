import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
import { gradeAssignmentPhoto } from '../../services/ocr';
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

type Mode = 'capture' | 'analyzing' | 'review';

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: 'Easy',
  2: 'Light',
  3: 'Moderate',
  4: 'Hard',
  5: 'Very Hard',
};

export default function ScanTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user: authUser } = useAuth();
  const { createTask, loading: saving } = useCreateTask(authUser?.id ?? '');
  const toast = useAuraToast();

  const [mode, setMode] = useState<Mode>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [autoReadFailed, setAutoReadFailed] = useState(false);

  // Review form fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('other');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [dueDate, setDueDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });

  const canSave = title.trim().length > 0 && subject.trim().length > 0;

  async function analyze(base64: string | null | undefined, uri: string) {
    setImageUri(uri);
    setMode('analyzing');
    setAutoReadFailed(false);

    if (!base64) {
      setAutoReadFailed(true);
      setMode('review');
      return;
    }

    try {
      const scanned = await gradeAssignmentPhoto(authUser?.id ?? '', base64);
      setTitle(scanned.title);
      setSubject(scanned.subject);
      setTaskType(scanned.taskType);
      setDifficulty(scanned.difficulty);
      setEstimatedMinutes(scanned.estimatedMinutes);
      if (scanned.dueDate) setDueDate(new Date(scanned.dueDate));
      haptic.success();
    } catch {
      // Backend unreachable or couldn't read — fall back to manual entry.
      setAutoReadFailed(true);
    } finally {
      setMode('review');
    }
  }

  async function takePhoto() {
    haptic.secondary();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast.show('Camera access is needed to scan', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.5,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;
    await analyze(result.assets[0].base64, result.assets[0].uri);
  }

  async function pickFromLibrary() {
    haptic.secondary();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.show('Photo access is needed to scan', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.5,
      allowsEditing: true,
      mediaTypes: ['images'],
    });
    if (result.canceled || !result.assets[0]) return;
    await analyze(result.assets[0].base64, result.assets[0].uri);
  }

  function adjustMinutes(delta: number) {
    haptic.selection();
    setEstimatedMinutes((prev) => Math.min(300, Math.max(15, prev + delta)));
  }

  async function handleSave() {
    if (!canSave || saving) return;
    haptic.primaryCTA();
    try {
      await createTask({
        title: title.trim(),
        subject: subject.trim(),
        dueDate: dueDate.toISOString(),
        taskType,
        estimatedMinutes,
        difficulty,
        source: 'photo',
      });
      haptic.success();
      toast.show('Added to your schedule', 'success');
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
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => { haptic.selection(); router.back(); }}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <AuraSymbol name="xmark" size={20} color={colors.text.secondary} />
          </Pressable>
          <Text style={styles.headerTitle}>Scan assignment</Text>
          <View style={styles.headerRight} />
        </View>
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
          {/* CAPTURE */}
          {mode === 'capture' && (
            <Animated.View entering={FadeIn.duration(280)}>
              <View style={styles.hero}>
                <View style={styles.heroIcon}>
                  <AuraSymbol name="camera.viewfinder" size={40} color={colors.accent.sky} />
                </View>
                <Text style={styles.heroTitle}>Photograph any assignment</Text>
                <Text style={styles.heroBody}>
                  Snap a worksheet, syllabus, or whiteboard. Chronos reads it, grades the
                  difficulty, and finds the time to do it.
                </Text>
              </View>

              <View style={styles.captureButtons}>
                <AuraButton label="Take photo" size="lg" fullWidth onPress={() => { void takePhoto(); }} />
                <Pressable
                  onPress={() => { void pickFromLibrary(); }}
                  style={styles.libraryBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Choose from library"
                >
                  <AuraSymbol name="photo.on.rectangle" size={18} color={colors.text.secondary} />
                  <Text style={styles.libraryBtnText}>Choose from library</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* ANALYZING */}
          {mode === 'analyzing' && (
            <Animated.View entering={FadeIn.duration(280)} style={styles.analyzing}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
              ) : null}
              <View style={styles.analyzingRow}>
                <ActivityIndicator color={colors.accent.sky} />
                <Text style={styles.analyzingText}>Reading your assignment…</Text>
              </View>
            </Animated.View>
          )}

          {/* REVIEW */}
          {mode === 'review' && (
            <Animated.View entering={FadeInDown.duration(280)}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.reviewImage} contentFit="cover" />
              ) : null}

              {autoReadFailed ? (
                <View style={styles.noticeRow}>
                  <AuraSymbol name="exclamationmark.circle" size={14} color={colors.accent.amber} />
                  <Text style={styles.noticeText}>
                    Couldn&apos;t read it automatically — fill in the details below.
                  </Text>
                </View>
              ) : (
                <View style={styles.noticeRow}>
                  <AuraSymbol name="checkmark.circle.fill" size={14} color={colors.accent.emerald} />
                  <Text style={styles.noticeTextOk}>Here&apos;s what I found — edit anything.</Text>
                </View>
              )}

              <GlassCard intensity="thick" style={styles.formCard}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>TITLE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Chapter 7 problem set"
                    placeholderTextColor={colors.text.tertiary}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>SUBJECT</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. AP Chemistry"
                    placeholderTextColor={colors.text.tertiary}
                    value={subject}
                    onChangeText={setSubject}
                  />
                </View>
              </GlassCard>

              {/* Task type */}
              <Text style={styles.sectionLabel}>TASK TYPE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Estimated time */}
              <Text style={styles.sectionLabel}>ESTIMATED TIME</Text>
              <GlassCard intensity="light" style={styles.stepperCard}>
                <View style={styles.stepperRow}>
                  <Pressable onPress={() => adjustMinutes(-15)} style={styles.stepperBtn} accessibilityRole="button" accessibilityLabel="Decrease 15 minutes">
                    <AuraSymbol name="minus" size={18} color={colors.text.secondary} />
                  </Pressable>
                  <View style={styles.stepperValue}>
                    <Text style={styles.stepperNumber}>{estimatedMinutes}</Text>
                    <Text style={styles.stepperUnit}>min</Text>
                  </View>
                  <Pressable onPress={() => adjustMinutes(15)} style={styles.stepperBtn} accessibilityRole="button" accessibilityLabel="Increase 15 minutes">
                    <AuraSymbol name="plus" size={18} color={colors.text.secondary} />
                  </Pressable>
                </View>
              </GlassCard>

              {/* Difficulty */}
              <Text style={styles.sectionLabel}>DIFFICULTY</Text>
              <GlassCard intensity="light" style={styles.difficultyCard}>
                <View style={styles.difficultyRow}>
                  <View style={[styles.difficultyBarsWrap, { pointerEvents: 'none' }]}>
                    <DifficultyBars level={difficulty} animated={false} />
                  </View>
                  <View style={styles.difficultyHitTargets}>
                    {([1, 2, 3, 4, 5] as const).map((level) => (
                      <Pressable
                        key={level}
                        onPress={() => { haptic.selection(); setDifficulty(level); }}
                        style={styles.difficultyHitTarget}
                        accessibilityRole="button"
                        accessibilityLabel={`Difficulty ${level}`}
                      />
                    ))}
                  </View>
                  <Text style={styles.difficultyLabel}>{DIFFICULTY_LABEL[difficulty]}</Text>
                </View>
              </GlassCard>

              <View style={styles.actions}>
                <AuraButton
                  label={saving ? 'Adding…' : 'Add to schedule'}
                  size="lg"
                  fullWidth
                  onPress={handleSave}
                  disabled={!canSave}
                />
                <Pressable
                  onPress={() => { haptic.selection(); setMode('capture'); setImageUri(null); }}
                  style={styles.retakeBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.retakeText}>Retake photo</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background.primary },
    flex: { flex: 1 },
    header: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.md },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.glass.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { ...typography.title2, color: c.text.primary },
    headerRight: { width: 36 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.xxl + 16 },

    // Capture
    hero: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
    heroIcon: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.glass.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    heroTitle: { ...typography.title1, color: c.text.primary, textAlign: 'center' },
    heroBody: { ...typography.body, color: c.text.secondary, textAlign: 'center', paddingHorizontal: spacing.md },
    captureButtons: { marginTop: spacing.xl, gap: spacing.md, alignItems: 'center' },
    libraryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    libraryBtnText: { ...typography.bodyMedium, color: c.text.secondary },

    // Analyzing
    analyzing: { alignItems: 'center', paddingTop: spacing.lg, gap: spacing.lg },
    previewImage: { width: '100%', height: 280, borderRadius: radius.xl },
    analyzingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    analyzingText: { ...typography.body, color: c.text.secondary },

    // Review
    reviewImage: { width: '100%', height: 160, borderRadius: radius.lg, marginBottom: spacing.md },
    noticeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
    noticeText: { ...typography.callout, color: c.accent.amber, flex: 1 },
    noticeTextOk: { ...typography.callout, color: c.text.secondary, flex: 1 },
    formCard: { borderRadius: radius.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
    field: { paddingVertical: spacing.md },
    fieldLabel: { ...typography.micro, color: c.text.tertiary, marginBottom: spacing.xs, letterSpacing: 1.5 },
    input: { ...typography.body, color: c.text.primary, paddingVertical: spacing.xs },
    divider: { height: 1, backgroundColor: c.border.subtle },
    sectionLabel: { ...typography.micro, color: c.text.tertiary, letterSpacing: 1.5, marginTop: spacing.xl, marginBottom: spacing.sm },
    chipRow: { gap: spacing.sm, paddingRight: spacing.screenPadding },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    chipSelected: { backgroundColor: c.glass.accent, borderColor: c.border.accent },
    chipText: { ...typography.callout, color: c.text.secondary },
    chipTextSelected: { color: c.text.primary },
    stepperCard: { borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stepperBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    stepperValue: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
    stepperNumber: { ...typography.displayMedium, color: c.text.primary },
    stepperUnit: { ...typography.callout, color: c.text.secondary },
    difficultyCard: { borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    difficultyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    difficultyBarsWrap: {},
    difficultyHitTargets: { position: 'absolute', left: 0, top: -8, flexDirection: 'row', gap: 4 },
    difficultyHitTarget: { width: 28, height: 32 },
    difficultyLabel: { ...typography.callout, color: c.text.secondary, marginLeft: spacing.xs },
    actions: { marginTop: spacing.xl, gap: spacing.md, alignItems: 'center' },
    retakeBtn: { paddingVertical: spacing.xs },
    retakeText: { ...typography.callout, color: c.text.secondary, fontWeight: '500' },
  });
}
