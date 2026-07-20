import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
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
import type { BlockStatus } from '@chronos/shared/types';
import { useTheme, type ResolvedMode } from '../../lib/theme';
import { useShadowSchedule } from '../../hooks/useShadowSchedule';
import { GlassCard } from '../../components/ui/GlassCard';
import { DifficultyBars } from '../../components/ui/DifficultyBars';
import { AuraText } from '../../components/ui/AuraText';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';
import { useAuraToast } from '../../components/ui/AuraToast';
import { supabase } from '@chronos/shared/supabase';
import { useRequirePro } from '../../lib/requirePro';
import { toLocalDayIso } from '../../lib/dates';

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
  const dayIso = toLocalDayIso(today);
  const { user: authUser } = useAuth();

  const { shadowBlocks, loading, error } = useShadowSchedule(authUser?.id ?? '', dayIso);
  const toast = useAuraToast();
  const requirePro = useRequirePro();

  // Per-row optimistic status overrides + race guards. The original list from
  // useShadowSchedule is treated as a snapshot; user actions layer on top.
  const [overrides, setOverrides] = useState<Record<string, BlockStatus>>({});
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState<boolean>(false);

  const displayBlocks = useMemo(
    () => shadowBlocks.map((b) => ({ ...b, status: overrides[b.id] ?? b.status })),
    [shadowBlocks, overrides],
  );
  const pendingCount = displayBlocks.filter((b) => b.status === 'shadow').length;
  const anyBusy = bulkBusy || busyIds.size > 0;

  async function setBlockStatus(blockId: string, next: BlockStatus) {
    // Race guard — a bulk write in flight, or this row already mid-update, owns
    // the next write. Bail rather than queue, so two fast taps can't fight.
    if (bulkBusy || busyIds.has(blockId)) return;

    const prev = overrides[blockId];
    setOverrides((o) => ({ ...o, [blockId]: next }));
    setBusyIds((s) => {
      const n = new Set(s);
      n.add(blockId);
      return n;
    });
    haptic.selection();

    const { error: updateError } = await supabase
      .from('scheduled_blocks')
      .update({ status: next })
      .eq('id', blockId)
      .eq('user_id', authUser?.id ?? '');

    setBusyIds((s) => {
      const n = new Set(s);
      n.delete(blockId);
      return n;
    });

    if (updateError) {
      setOverrides((o) => {
        const n = { ...o };
        if (prev === undefined) delete n[blockId];
        else n[blockId] = prev;
        return n;
      });
      toast.show('Could not update — try again', 'error');
    }
  }

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

  async function handleApprove() {
    // Race guard — if any per-row write is mid-flight, bail rather than have
    // bulk and per-row updates collide on the same block.
    if (anyBusy) return;

    // Approve only blocks the user hasn't already acted on. An explicit
    // rejection must survive bulk-approve, otherwise the per-row affordance
    // is a lie.
    const targets = displayBlocks.filter((b) => b.status === 'shadow').map((b) => b.id);

    approveScale.value = withSequence(
      withSpring(1.02, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 400 }),
    );
    flashProgress.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 200 }),
    );

    if (targets.length === 0) {
      haptic.success();
      router.back();
      return;
    }

    setBulkBusy(true);
    const { error: updateError } = await supabase
      .from('scheduled_blocks')
      .update({ status: 'approved' })
      .eq('user_id', authUser?.id ?? '')
      .in('id', targets);
    setBulkBusy(false);

    if (updateError) {
      toast.show('Could not approve schedule — try again', 'error');
      return;
    }

    setOverrides((o) => {
      const next = { ...o };
      for (const id of targets) next[id] = 'approved';
      return next;
    });
    haptic.success();
    toast.show('Schedule locked in', 'success');
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

            {!loading && !error && displayBlocks.length > 0 && (
              <View>
                {displayBlocks.map((block, i) => {
                  const rowStatus = block.status;
                  const rowBusy = busyIds.has(block.id);
                  const disableRow = bulkBusy || rowBusy;
                  const isRejected = rowStatus === 'rejected';
                  const isApproved = rowStatus === 'approved';
                  return (
                    <Animated.View
                      key={block.id}
                      entering={FadeIn.delay(i * 40).duration(200)}
                    >
                      <View style={[styles.row, isRejected && styles.rowRejected]}>
                        <View style={styles.timeCol}>
                          <Text style={[styles.rowTime, isRejected && styles.textStrike]}>
                            {formatTime(block.startTime)}
                          </Text>
                        </View>
                        <View style={styles.titleCol}>
                          <Text
                            style={[styles.rowTitle, isRejected && styles.textStrike]}
                            numberOfLines={1}
                          >
                            {block.task?.title ?? 'Untitled'}
                          </Text>
                          <Text
                            style={[styles.rowMeta, isRejected && styles.textStrike]}
                            numberOfLines={1}
                          >
                            {block.task?.subject ?? ''} · {block.task?.estimatedMinutes ?? 0}m
                          </Text>
                        </View>
                        <View style={styles.actions}>
                          {isRejected ? (
                            <Pressable
                              onPress={() =>
                                requirePro('undo_block', () =>
                                  setBlockStatus(block.id, 'shadow'),
                                )
                              }
                              disabled={disableRow}
                              style={[styles.undoBtn, disableRow && styles.btnDisabled]}
                              accessibilityRole="button"
                              accessibilityLabel="Undo reject"
                            >
                              <AuraSymbol
                                name="arrow.left"
                                size={12}
                                color={colors.text.secondary}
                              />
                              <Text style={styles.undoText}>Undo</Text>
                            </Pressable>
                          ) : (
                            <>
                              <Pressable
                                onPress={() =>
                                  requirePro('approve_block', () =>
                                    setBlockStatus(block.id, isApproved ? 'shadow' : 'approved'),
                                  )
                                }
                                disabled={disableRow}
                                style={[
                                  styles.iconBtn,
                                  isApproved && styles.iconBtnApproved,
                                  disableRow && styles.btnDisabled,
                                ]}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isApproved }}
                                accessibilityLabel={isApproved ? 'Unapprove block' : 'Approve block'}
                              >
                                <AuraSymbol
                                  name="checkmark"
                                  size={14}
                                  color={isApproved ? colors.accent.emerald : colors.text.secondary}
                                />
                              </Pressable>
                              <Pressable
                                onPress={() =>
                                  requirePro('reject_block', () =>
                                    setBlockStatus(block.id, 'rejected'),
                                  )
                                }
                                disabled={disableRow}
                                style={[styles.iconBtn, disableRow && styles.btnDisabled]}
                                accessibilityRole="button"
                                accessibilityLabel="Reject block"
                              >
                                <AuraSymbol
                                  name="xmark"
                                  size={14}
                                  color={colors.text.secondary}
                                />
                              </Pressable>
                            </>
                          )}
                        </View>
                        {block.task && !isRejected && (
                          <View style={styles.barsCol}>
                            <DifficultyBars level={block.task.difficulty} />
                          </View>
                        )}
                      </View>
                      {i < displayBlocks.length - 1 && <View style={styles.divider} />}
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Buttons */}
          <View style={[styles.buttonRow, { paddingBottom: insets.bottom + spacing.md }]}>
            <Pressable
              onPress={() => {
                haptic.secondary();
                router.push(
                  ('/(tabs)/ai/chat?prompt=' +
                    encodeURIComponent("Help me adjust today's plan.") +
                    '&context=' +
                    encodeURIComponent('Editing shadow plan')) as Href,
                );
              }}
              style={styles.editBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit plan"
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>

            <Animated.View style={[styles.approveBtnWrap, approveAnimated]}>
              <Pressable
                onPress={() => requirePro('bulk_approve', handleApprove)}
                style={styles.approveBtnInner}
                disabled={loading || shadowBlocks.length === 0 || anyBusy}
                accessibilityRole="button"
                accessibilityLabel={pendingCount > 0 ? 'Approve remaining blocks' : 'Done'}
              >
                <Text style={styles.approveBtnText}>
                  {pendingCount === 0
                    ? 'Done'
                    : pendingCount === shadowBlocks.length
                      ? 'Approve all'
                      : `Approve remaining (${pendingCount})`}
                </Text>
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
    rowRejected: {
      opacity: 0.45,
    },
    textStrike: {
      textDecorationLine: 'line-through',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.glass.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnApproved: {
      backgroundColor: c.glass.accent,
      borderColor: c.border.accent,
    },
    btnDisabled: {
      opacity: 0.5,
    },
    undoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.glass.light,
    },
    undoText: {
      ...typography.caption,
      color: c.text.secondary,
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
