import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { difficultyLabels, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import type { BlockStatus } from '@chronos/shared/types';
import { supabase } from '@chronos/shared/supabase';
import { useTheme } from '../../lib/theme';
import { useShadowSchedule } from '../../hooks/useShadowSchedule';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import { useAuth } from '../../hooks/useAuth';
import { useRequirePro } from '../../lib/requirePro';
import { haptic } from '../../lib/haptics';
import { toLocalDayIso } from '../../lib/localDate';
import { clock, dateFromHHMM, formatDue, minutesBetween } from '../../lib/dayFormat';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { useAuraToast } from '../../components/ui/AuraToast';
import { DraftPlanRow } from '../../components/schedule/DraftPlanRow';

export default function ShadowScheduleReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const today = useMemo(() => new Date(), []);
  const dayIso = toLocalDayIso(today);
  const { user: authUser } = useAuth();

  const { shadowBlocks, loading, error } = useShadowSchedule(authUser?.id ?? '', dayIso);
  // Fixed events give the draft its context (school, dinner); read-only here.
  const { fixedEvents } = useTodaySchedule(authUser?.id ?? '', dayIso);
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

  // One time-sorted list: dim fixed rows interleaved with the draft blocks.
  const rows = useMemo(() => {
    const fixed = fixedEvents.map((e) => ({ key: `f-${e.id}`, start: dateFromHHMM(e.startTime, today), title: e.title, block: undefined }));
    const drafts = displayBlocks.map((b) => ({ key: b.id, start: new Date(b.startTime), title: b.task?.title ?? 'Untitled', block: b }));
    return [...fixed, ...drafts].sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [fixedEvents, displayBlocks, today]);
  const kept = displayBlocks.filter((b) => b.status !== 'rejected');
  const doneBy = kept.length ? new Date(Math.max(...kept.map((b) => new Date(b.endTime).getTime()))) : null;

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


  async function handleApprove() {
    // Race guard — if any per-row write is mid-flight, bail rather than have
    // bulk and per-row updates collide on the same block.
    if (anyBusy) return;

    // Approve only blocks the user hasn't already acted on. An explicit
    // rejection must survive bulk-approve, otherwise the per-row affordance
    // is a lie.
    const targets = displayBlocks.filter((b) => b.status === 'shadow').map((b) => b.id);


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


  const subline = [
    today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
    `${kept.length} ${kept.length === 1 ? 'block' : 'blocks'}`,
    doneBy ? `done by ${clock(doneBy)}` : null,
  ].filter(Boolean).join(' · ');
  const approveLabel =
    pendingCount === 0 ? 'Done' : pendingCount === shadowBlocks.length ? 'Approve plan' : `Approve ${pendingCount} left`;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => { haptic.secondary(); router.back(); }}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Back to Today"
        >
          <AuraSymbol name="chevron.left" size={20} color={colors.accent.sky} />
          <Text style={styles.navText}>Today</Text>
        </Pressable>
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
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Edit plan with Chronos"
        >
          <Text style={styles.navText}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Draft plan</Text>
          {!loading && shadowBlocks.length > 0 && <Text style={styles.subline}>{subline}</Text>}
          <Text style={styles.explain}>
            Chronos built this from your assignments. Nothing is locked in until you approve it.
          </Text>
        </View>

        {loading && (
          <View style={styles.list}>
            <AuraSkeleton height={64} />
            <AuraSkeleton height={64} />
          </View>
        )}

        {!loading && error && <Text style={[styles.explain, styles.pad]}>Couldn&apos;t load the draft plan.</Text>}

        {!loading && !error && shadowBlocks.length === 0 && (
          <Text style={[styles.explain, styles.pad]}>No draft yet. Chronos drafts one the next time you check in.</Text>
        )}

        {!loading && !error && shadowBlocks.length > 0 && (
          <View style={styles.list}>
            {rows.map((r, i) => {
              if (!r.block) {
                return <DraftPlanRow key={r.key} first={i === 0} time={clock(r.start)} title={r.title} />;
              }
              const b = r.block;
              const t = b.task;
              const meta = [
                `${minutesBetween(new Date(b.startTime), new Date(b.endTime))} min`,
                t ? difficultyLabels[t.difficulty] : null,
                formatDue(t?.dueDate, today),
              ].filter(Boolean).join(' · ');
              return (
                <DraftPlanRow
                  key={r.key}
                  first={i === 0}
                  time={clock(r.start)}
                  title={r.title}
                  meta={meta}
                  status={b.status}
                  disabled={bulkBusy || busyIds.has(b.id)}
                  onKeep={() => requirePro('approve_block', () => setBlockStatus(b.id, b.status === 'approved' ? 'shadow' : 'approved'))}
                  onSkip={() => requirePro('reject_block', () => setBlockStatus(b.id, 'rejected'))}
                  onUndo={() => requirePro('undo_block', () => setBlockStatus(b.id, 'shadow'))}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={() => { haptic.primaryCTA(); requirePro('bulk_approve', handleApprove); }}
          disabled={loading || shadowBlocks.length === 0 || anyBusy}
          style={[styles.approve, (loading || shadowBlocks.length === 0 || anyBusy) && styles.approveDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.approveText}>{approveLabel}</Text>
        </Pressable>
        <Text style={styles.hint}>Keep or skip a block, then approve the rest</Text>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background.primary },
    nav: { height: 44, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navBtn: { height: 44, minWidth: 44, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 2 },
    navText: { ...typography.nBody, color: c.accent.sky },
    scroll: { paddingBottom: 24 },
    header: { paddingHorizontal: 20 },
    title: { ...typography.nLargeTitle, color: c.text.primary, marginTop: 2 },
    subline: { ...typography.nSubhead, color: c.text.secondary, marginTop: 4, fontVariant: ['tabular-nums'] },
    explain: { ...typography.nSubhead, lineHeight: 21, color: c.text.secondary, marginTop: 12 },
    pad: { paddingHorizontal: 20 },
    list: { marginTop: 20, marginHorizontal: 16, borderRadius: 14, backgroundColor: c.background.surface, overflow: 'hidden' },
    footer: { paddingHorizontal: 16, paddingTop: 12 },
    approve: { height: 54, borderRadius: 14, backgroundColor: c.accent.blue, alignItems: 'center', justifyContent: 'center' },
    approveDisabled: { opacity: 0.5 },
    approveText: { ...typography.nHeadline, color: c.text.primary },
    hint: { ...typography.nFootnote, fontWeight: '400', color: c.text.secondary, textAlign: 'center', marginTop: 10 },
  });
}
