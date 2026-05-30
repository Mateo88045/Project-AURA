import { useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme, type ResolvedMode } from '../../lib/theme';
import { useShadowSchedule } from '../../hooks/useShadowSchedule';
import { GlassCard } from '../../components/ui/GlassCard';
import { DifficultyBars } from '../../components/ui/DifficultyBars';
import { AuraText } from '../../components/ui/AuraText';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';
import { useAuraToast } from '../../components/ui/AuraToast';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function scrimColor(mode: ResolvedMode): string {
  return mode === 'light' ? 'rgba(15, 23, 42, 0.28)' : 'rgba(7, 9, 15, 0.6)';
}

export default function ShadowScheduleReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors, resolvedMode), [colors, resolvedMode]);

  const today = useMemo(() => new Date(), []);
  const dayIso = today.toISOString().slice(0, 10);
  const { user: authUser } = useAuth();

  const { shadowBlocks, loading, error } = useShadowSchedule(authUser?.id ?? '', dayIso);
  const toast = useAuraToast();

  // Approve button animations
  const approveScale = useSharedValue(1);
  const flashProgress = useSharedValue(0);

  const approveAnimated = useAnimatedStyle(() => ({
    transform: [{ scale: approveScale.value }],
    backgroundColor: interpolateColor(
      flashProgress.value,
      [0, 1],
      [colors.accent.blue, colors.accent.emerald],
    ),
  }));

  function handleApprove() {
    haptic.success();
    approveScale.value = withSequence(
      withSpring(1.02, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 400 }),
    );
    flashProgress.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 200 }),
    );
    toast.show('Schedule locked in', 'success');
    // TODO: Supabase — update scheduled_blocks set status = 'approved' where day = dayIso
    setTimeout(() => router.back(), 500);
  }

  const friendlyDate = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.root}>
      <AmbientOrbs />

      {/* Scrim — tapping dismisses */}
      <Animated.View
        entering={FadeIn.duration(250)}
        style={StyleSheet.absoluteFill}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        entering={SlideInDown.springify().damping(22).stiffness(140).mass(1.1)}
        style={[styles.sheetWrap, { paddingTop: insets.top + 24 }]}
      >
        <GlassCard intensity="thick" borderAccent style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Chronos found {shadowBlocks.length} new task{shadowBlocks.length === 1 ? '' : 's'}
            </Text>
            <Text style={styles.headerDate}>{friendlyDate}</Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {loading && (
              <View style={styles.loading}>
                <AuraSkeleton height={60} />
                <AuraSkeleton height={60} />
              </View>
            )}

            {!loading && error && (
              <View style={styles.center}>
                <AuraText variant="body" color="hard">
                  Couldn&apos;t load shadow plan.
                </AuraText>
              </View>
            )}

            {!loading && !error && shadowBlocks.length === 0 && (
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>No shadow plan yet</Text>
                <Text style={styles.emptyBody}>
                  Chronos will draft a plan the next time you check in.
                </Text>
              </View>
            )}

            {!loading && !error && shadowBlocks.length > 0 && (
              <View>
                {shadowBlocks.map((block, i) => (
                  <Animated.View
                    key={block.id}
                    entering={FadeIn.delay(i * 40).duration(200)}
                  >
                    <View style={styles.row}>
                      <View style={styles.timeCol}>
                        <Text style={styles.rowTime}>
                          {formatTime(block.startTime)}
                        </Text>
                      </View>
                      <View style={styles.titleCol}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {block.task?.title ?? 'Untitled'}
                        </Text>
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          {block.task?.subject ?? ''} · {block.task?.estimatedMinutes ?? 0}m
                        </Text>
                      </View>
                      {block.task && (
                        <View style={styles.barsCol}>
                          <DifficultyBars level={block.task.difficulty} />
                        </View>
                      )}
                    </View>
                    {i < shadowBlocks.length - 1 && <View style={styles.divider} />}
                  </Animated.View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Buttons */}
          <View style={[styles.buttonRow, { paddingBottom: insets.bottom + spacing.md }]}>
            <Pressable
              onPress={() => {
                haptic.secondary();
                // TODO: open edit flow
              }}
              style={styles.editBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit plan"
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>

            <Animated.View style={[styles.approveBtnWrap, approveAnimated]}>
              <Pressable
                onPress={handleApprove}
                style={styles.approveBtnInner}
                disabled={loading || shadowBlocks.length === 0}
                accessibilityRole="button"
                accessibilityLabel="Approve plan"
              >
                <Text style={styles.approveBtnText}>Approve</Text>
              </Pressable>
            </Animated.View>
          </View>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

function makeStyles(c: ThemeColors, mode: ResolvedMode) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: scrimColor(mode),
    },
    sheetWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheet: {
      flex: 1,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
    },
    handleWrap: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border.glass,
    },
    header: {
      paddingHorizontal: spacing.screenPadding,
      paddingBottom: spacing.lg,
    },
    headerTitle: {
      ...typography.title1,
      color: c.text.primary,
    },
    headerDate: {
      ...typography.callout,
      marginTop: spacing.xs,
      color: c.text.secondary,
    },
    scroll: {
      flex: 1,
      paddingHorizontal: spacing.screenPadding,
    },
    loading: {
      gap: spacing.md,
    },
    center: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      ...typography.title2,
      color: c.text.primary,
    },
    emptyBody: {
      ...typography.body,
      marginTop: spacing.sm,
      color: c.text.secondary,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    timeCol: {
      width: 60,
    },
    rowTime: {
      ...typography.callout,
      color: c.text.tertiary,
    },
    titleCol: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      ...typography.headline,
      color: c.text.primary,
    },
    rowMeta: {
      ...typography.callout,
      color: c.text.secondary,
    },
    barsCol: {
      alignItems: 'flex-end',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border.subtle,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.screenPadding,
      paddingTop: spacing.md,
    },
    editBtn: {
      height: 52,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border.glass,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editBtnText: {
      ...typography.headline,
      color: c.text.secondary,
    },
    approveBtnWrap: {
      flex: 1,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    approveBtnInner: {
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    approveBtnText: {
      ...typography.headline,
      color: c.text.inverse,
    },
  });
}
