import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { spacing, typography, radius } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../../lib/theme';
import { AmbientOrbs } from '../../../components/ui/AmbientOrbs';
import { AuraButton } from '../../../components/ui/AuraButton';
import { AuraSymbol } from '../../../components/ui/AuraSymbol';
import { DifficultyBars } from '../../../components/ui/DifficultyBars';
import { AuraSkeleton } from '../../../components/ui/AuraSkeleton';
import { AuraText } from '../../../components/ui/AuraText';
import { useActiveTask } from '../../../hooks/useActiveTask';
import { haptic } from '../../../lib/haptics';
import { useAuth } from '../../../hooks/useAuth';
const STAGGER_MS = 40;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TaskActiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const taskId = Array.isArray(id) ? id[0] : id ?? '';
  const { user: authUser } = useAuth();
  const { task, elapsedSeconds, isPaused, loading, error, pause, resume, start } =
    useActiveTask(taskId, authUser?.id ?? '');

  const estimatedSeconds = (task?.estimatedMinutes ?? 60) * 60;
  const progressRatio = Math.min(elapsedSeconds / Math.max(estimatedSeconds, 1), 1);

  // Mark task in_progress once it has loaded successfully.
  useEffect(() => {
    if (!loading && !error && task) {
      void start();
    }
  }, [loading, error, task, start]);

  // Progress bar — drive shared value from React state via effect, then read in worklet.
  const progressWidth = useSharedValue(0);
  useEffect(() => {
    const pct = Math.min((elapsedSeconds / Math.max(estimatedSeconds, 1)) * 100, 100);
    progressWidth.value = withTiming(pct, { duration: 800 });
  }, [elapsedSeconds, estimatedSeconds, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as `${number}%`,
  }));

  // Color tier — depends on React state, applied as a regular style.
  const tierColor =
    progressRatio < 0.7
      ? colors.accent.emerald
      : progressRatio < 0.9
      ? colors.accent.amber
      : colors.accent.coral;

  function handleDone() {
    haptic.primaryCTA();
    router.push(`/tasks/${taskId}/complete` as Href);
  }

  function handleTogglePause() {
    haptic.selection();
    if (isPaused) resume();
    else pause();
  }

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
        <AmbientOrbs />
        <View style={styles.loadingWrap}>
          <AuraSkeleton height={20} />
          <AuraSkeleton height={60}  />
          <AuraSkeleton height={8}  />
        </View>
      </View>
    );
  }

  if (error || !task) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
        <AmbientOrbs />
        <View style={styles.errorWrap}>
          <AuraText variant="title2">Couldn&apos;t load this task.</AuraText>
          <AuraText variant="body" color="secondary" style={styles.errorBody}>
            {error ?? 'The task may have been removed.'}
          </AuraText>
          <View style={styles.errorButton}>
            <AuraButton
              label="Go back"
              variant="outline"
              onPress={() => router.back()}
              fullWidth
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
      <AmbientOrbs />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View entering={FadeIn.duration(220)} style={styles.headerRow}>
          <Pressable
            onPress={() => { haptic.selection(); router.back(); }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AuraSymbol name="chevron.left" size={20} color={colors.text.secondary} />
          </Pressable>
          <Animated.View entering={FadeInDown.delay(STAGGER_MS).duration(280)} style={styles.flex}>
            <Text style={styles.subject}>{task?.subject ?? ''}</Text>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {task?.title ?? ''}
            </Text>
            {task && (
              <View style={styles.difficultyWrap}>
                <DifficultyBars level={task.difficulty} animated={false} />
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </View>

      {/* Timer section */}
      <Animated.View
        entering={FadeInDown.delay(STAGGER_MS * 3).duration(320)}
        style={styles.timerSection}
      >
        <Text style={[styles.timerValue, { color: tierColor }]}>
          {formatElapsed(elapsedSeconds)}
        </Text>
        {isPaused && <Text style={styles.pausedLabel}>PAUSED</Text>}
        <Text style={styles.estLabel}>
          Est. {task?.estimatedMinutes ?? 0}m
        </Text>
      </Animated.View>

      {/* Progress bar */}
      <Animated.View
        entering={FadeIn.delay(STAGGER_MS * 4).duration(280)}
        style={styles.progressSection}
      >
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { backgroundColor: tierColor }, progressBarStyle]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabelLeft}>0</Text>
          <Text style={styles.progressLabelRight}>{task?.estimatedMinutes ?? 0}m</Text>
        </View>
      </Animated.View>

      {/* Action buttons */}
      <Animated.View
        entering={FadeInDown.delay(STAGGER_MS * 5).duration(280)}
        style={styles.actions}
      >
        <AuraButton
          label="Done Early"
          size="lg"
          fullWidth
          onPress={handleDone}
        />
        <View style={styles.actionGap} />
        <AuraButton
          label={isPaused ? 'Resume' : 'Pause'}
          variant="outline"
          size="md"
          fullWidth
          onPress={handleTogglePause}
        />
      </Animated.View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
      paddingHorizontal: spacing.screenPadding,
    },
    flex: { flex: 1 },
    header: {
      paddingBottom: spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.glass.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    subject: {
      ...typography.caption,
      color: c.accent.blue,
      letterSpacing: 1.5,
      marginBottom: spacing.xs,
    },
    taskTitle: {
      ...typography.displayMedium,
      color: c.text.primary,
    },
    difficultyWrap: {
      marginTop: spacing.sm,
    },
    timerSection: {
      alignItems: 'center',
      paddingVertical: spacing.xxl + 16,
    },
    timerValue: {
      fontSize: 72,
      fontWeight: '300' as const,
      letterSpacing: -2,
      lineHeight: 80,
    },
    pausedLabel: {
      ...typography.micro,
      color: c.text.tertiary,
      letterSpacing: 2.5,
      marginTop: spacing.sm,
    },
    estLabel: {
      ...typography.callout,
      color: c.text.tertiary,
      marginTop: spacing.sm,
    },
    progressSection: {
      marginBottom: spacing.xxl + 16,
    },
    progressTrack: {
      height: 4,
      borderRadius: radius.sm,
      backgroundColor: c.border.subtle,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.sm,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    progressLabelLeft: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    progressLabelRight: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    actions: {
      marginTop: 'auto',
    },
    actionGap: {
      height: spacing.sm,
    },
    loadingWrap: {
      flex: 1,
      padding: spacing.screenPadding,
      gap: spacing.md,
    },
    errorWrap: {
      flex: 1,
      paddingHorizontal: spacing.screenPadding,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    errorBody: {
      textAlign: 'center',
    },
    errorButton: {
      marginTop: spacing.lg,
      width: '100%',
    },
  });
}
