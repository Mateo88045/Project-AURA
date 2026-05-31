import { useMemo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  Alert,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { supabase } from '@chronos/shared/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../../lib/theme';
import { AmbientOrbs } from '../../../components/ui/AmbientOrbs';
import { GlassCard } from '../../../components/ui/GlassCard';
import { DifficultyBars } from '../../../components/ui/DifficultyBars';
import { AuraSymbol } from '../../../components/ui/AuraSymbol';
import { AuraButton } from '../../../components/ui/AuraButton';
import { AuraSkeleton } from '../../../components/ui/AuraSkeleton';
import { useTaskDetail } from '../../../hooks/useTaskDetail';
import { haptic } from '../../../lib/haptics';
import type { TaskSource, TaskType } from '@chronos/shared/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Labels & helpers
// ---------------------------------------------------------------------------

const TASK_TYPE_LABEL: Record<TaskType, string> = {
  essay: 'Essay',
  problem_set: 'Problem Set',
  reading: 'Reading',
  project: 'Project',
  study_guide: 'Study Guide',
  quiz_prep: 'Quiz Prep',
  other: 'Other',
};

const SOURCE_LABEL: Record<TaskSource, string> = {
  google_classroom: 'Google Classroom',
  canvas: 'Canvas',
  manual: 'Manual',
  photo: 'Photo',
};

function formatDue(iso: string): { label: string; relative: string } {
  const due = new Date(iso);
  const now = new Date();
  const hours = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60));
  const label = due.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const relative =
    hours < 1 ? 'Due now' : hours < 24 ? `in ${hours}h` : `in ${Math.round(hours / 24)}d`;
  return { label, relative };
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ---------------------------------------------------------------------------
// Meta chip — icon + value (in a glass pill)
// ---------------------------------------------------------------------------

interface MetaChipProps {
  icon: string;
  label: string;
  value: string;
  tint: string;
  chipStyles: ReturnType<typeof makeChipStyles>;
}

function MetaChip({ icon, label, value, tint, chipStyles }: MetaChipProps) {
  return (
    <GlassCard intensity="light" style={chipStyles.chip}>
      <View style={[chipStyles.iconBox, { backgroundColor: tint + '22' }]}>
        <AuraSymbol name={icon} size={14} color={tint} weight="semibold" />
      </View>
      <View style={chipStyles.text}>
        <Text style={chipStyles.label}>{label}</Text>
        <Text style={chipStyles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </GlassCard>
  );
}

function makeChipStyles(c: ThemeColors) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flex: 1,
      minWidth: 140,
    },
    iconBox: {
      width: 24,
      height: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      flex: 1,
    },
    label: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    value: {
      ...typography.bodyMedium,
      color: c.text.primary,
      marginTop: 1,
    },
  });
}

// ---------------------------------------------------------------------------
// Mock scheduled blocks for the task (would come from useScheduledBlocks)
// ---------------------------------------------------------------------------

interface MockBlock {
  id: string;
  day: string;
  start: string;
  end: string;
}

const MOCK_BLOCKS: MockBlock[] = [
  { id: 'b1', day: 'Tonight', start: '7:30 PM', end: '8:50 PM' },
  { id: 'b2', day: 'Tomorrow', start: '4:00 PM', end: '5:20 PM' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function TaskDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const chipStyles = useMemo(() => makeChipStyles(colors), [colors]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const { task, loading, error, refetch } = useTaskDetail(id ?? '');

  const backScale = useSharedValue(1);
  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  const due = useMemo(() => (task ? formatDue(task.dueDate) : null), [task]);

  if (loading) {
    return (
      <View style={styles.root}>
        <AmbientOrbs />
        <View style={[styles.loadingWrap, { paddingTop: insets.top + 24, paddingHorizontal: spacing.screenPadding }]}>
          <AuraSkeleton height={28} style={{ marginBottom: 8 }} />
          <AuraSkeleton height={44} style={{ marginBottom: 24 }} />
          <AuraSkeleton height={80} style={{ marginBottom: 12 }} />
          <AuraSkeleton height={80} />
        </View>
      </View>
    );
  }

  if (error || !task) {
    return (
      <View style={styles.root}>
        <AmbientOrbs />
        <View style={[styles.loadingWrap, { paddingTop: insets.top + 40 }]}>
          <Text style={[styles.loadingText, { marginBottom: 16 }]}>Couldn't load task.</Text>
          <AuraButton label="Try again" variant="outline" onPress={refetch} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AmbientOrbs />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header row */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.headerRow}>
          <AnimatedPressable
            hitSlop={12}
            onPressIn={() => {
              backScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
            }}
            onPressOut={() => {
              backScale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            onPress={() => {
              haptic.secondary();
              router.back();
            }}
            style={[styles.headerBtn, backAnimatedStyle]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <AuraSymbol name="chevron.left" size={22} color={colors.text.primary} />
          </AnimatedPressable>
          <Pressable
            hitSlop={12}
            onPress={() => haptic.selection()}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="More"
          >
            <AuraSymbol name="ellipsis" size={20} color={colors.text.secondary} />
          </Pressable>
        </Animated.View>

        {/* Subject label */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <Text style={styles.subject}>{task.subject.toUpperCase()}</Text>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={styles.title}>{task.title}</Text>
        </Animated.View>

        {/* Difficulty row */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(500)}
          style={styles.difficultyRow}
        >
          <View style={styles.difficultyCol}>
            <Text style={styles.eyebrow}>DIFFICULTY</Text>
            <DifficultyBars level={task.difficulty} />
          </View>
          <View style={styles.difficultyCol}>
            <Text style={styles.eyebrow}>TYPE</Text>
            <Text style={styles.typeLabel}>{TASK_TYPE_LABEL[task.taskType]}</Text>
          </View>
        </Animated.View>

        {/* Meta chips (2x2) */}
        <Animated.View
          entering={FadeInDown.delay(220).duration(500)}
          style={styles.metaGrid}
        >
          <MetaChip
            icon="clock.fill"
            label="DUE"
            value={due ? due.relative : '—'}
            tint={colors.accent.coral}
            chipStyles={chipStyles}
          />
          <MetaChip
            icon="calendar.badge.clock"
            label="DURATION"
            value={formatDuration(task.estimatedMinutes)}
            tint={colors.accent.blue}
            chipStyles={chipStyles}
          />
          <MetaChip
            icon="book.closed.fill"
            label="SOURCE"
            value={SOURCE_LABEL[task.source]}
            tint={colors.accent.emerald}
            chipStyles={chipStyles}
          />
          <MetaChip
            icon="waveform"
            label="STATUS"
            value={task.status.replace('_', ' ')}
            tint={colors.accent.sky}
            chipStyles={chipStyles}
          />
        </Animated.View>

        {/* Due card — full due string */}
        {due ? (
          <Animated.View entering={FadeInDown.delay(280).duration(500)}>
            <GlassCard intensity="light" style={styles.dueCard}>
              <LinearGradient
                colors={[colors.accent.coral + '18', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <AuraSymbol name="clock.fill" size={16} color={colors.accent.coral} />
              <Text style={styles.dueText}>{due.label}</Text>
            </GlassCard>
          </Animated.View>
        ) : null}

        {/* Description */}
        {task.description ? (
          <>
            <Animated.Text
              entering={FadeInDown.delay(340).duration(500)}
              style={styles.sectionLabel}
            >
              DESCRIPTION
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(360).duration(500)}>
              <GlassCard intensity="light" style={styles.descCard}>
                <Text style={styles.descText}>{task.description}</Text>
              </GlassCard>
            </Animated.View>
          </>
        ) : null}

        {/* Scheduled blocks */}
        <Animated.Text
          entering={FadeInDown.delay(420).duration(500)}
          style={styles.sectionLabel}
        >
          SCHEDULED BLOCKS
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(440).duration(500)}>
          <GlassCard intensity="light" style={styles.blocksCard}>
            {MOCK_BLOCKS.map((b, i) => (
              <View key={b.id}>
                <View style={styles.blockRow}>
                  <View style={styles.blockDot} />
                  <View style={styles.blockTextCol}>
                    <Text style={styles.blockDay}>{b.day}</Text>
                    <Text style={styles.blockTime}>
                      {b.start} – {b.end}
                    </Text>
                  </View>
                  <AuraSymbol
                    name="chevron.right"
                    size={14}
                    color={colors.text.tertiary}
                  />
                </View>
                {i < MOCK_BLOCKS.length - 1 ? <View style={styles.blockDivider} /> : null}
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeInDown.delay(520).duration(500)}
          style={styles.actionRow}
        >
          <AuraButton
            label="Mark done"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {
              haptic.success();
              router.push(`/tasks/${task.id}/complete` as Href);
            }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(580).duration(500)} style={styles.secondaryRow}>
          <AuraButton
            label="Reschedule"
            variant="outline"
            size="md"
            onPress={() => {
              haptic.secondary();
              router.push('/schedule/review' as Href);
            }}
            style={styles.secondaryBtn}
          />
          <AuraButton
            label="Remove"
            variant="ghost"
            size="md"
            onPress={() => {
              haptic.secondary();
              Alert.alert(
                'Remove task',
                `“${task.title}” and its scheduled time will be deleted.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                      await supabase.from('tasks').delete().eq('id', task.id);
                      haptic.success();
                      router.back();
                    },
                  },
                ],
              );
            }}
            style={styles.secondaryBtn}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    scrollContent: {
      paddingHorizontal: spacing.screenPadding,
    },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
    },
    loadingText: {
      ...typography.body,
      color: c.text.tertiary,
    },

    // Header
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    } as ViewStyle,

    // Title
    subject: {
      ...typography.caption,
      color: c.accent.sky,
      marginBottom: 8,
    },
    title: {
      ...typography.displayMedium,
      color: c.text.primary,
      lineHeight: 36,
    },

    // Difficulty row
    difficultyRow: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
    difficultyCol: {
      flex: 1,
      gap: 8,
    },
    eyebrow: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    typeLabel: {
      ...typography.title2,
      color: c.text.primary,
    },

    // Meta grid
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },

    // Due card
    dueCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: 14,
      overflow: 'hidden',
    },
    dueText: {
      ...typography.bodyMedium,
      color: c.text.primary,
    },

    // Section labels
    sectionLabel: {
      ...typography.caption,
      color: c.text.tertiary,
      marginTop: spacing.xl,
      marginBottom: 10,
      paddingHorizontal: 4,
    },

    // Description
    descCard: {
      padding: spacing.cardPadding,
    },
    descText: {
      ...typography.body,
      color: c.text.secondary,
      lineHeight: 22,
    },

    // Blocks
    blocksCard: {
      paddingVertical: 4,
    },
    blockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: 14,
    },
    blockDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.accent.sky,
      shadowColor: c.accent.sky,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 6,
    },
    blockTextCol: {
      flex: 1,
    },
    blockDay: {
      ...typography.bodyMedium,
      color: c.text.primary,
    },
    blockTime: {
      ...typography.callout,
      color: c.text.tertiary,
      marginTop: 2,
    },
    blockDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border.subtle,
      marginLeft: spacing.cardPadding + 22,
    },

    // Actions
    actionRow: {
      marginTop: spacing.xl,
    },
    secondaryRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    secondaryBtn: {
      flex: 1,
    },
  });
}
