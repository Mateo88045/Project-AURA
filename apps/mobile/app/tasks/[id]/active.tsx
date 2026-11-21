import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, spacing, radius } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../../lib/theme';
import { AuraButton } from '../../../components/ui/AuraButton';
import { AuraSymbol } from '../../../components/ui/AuraSymbol';
import { AuraSkeleton } from '../../../components/ui/AuraSkeleton';
import { AuraText } from '../../../components/ui/AuraText';
import { TickStrip } from '../../../components/focus/TickStrip';
import { useActiveTask } from '../../../hooks/useActiveTask';
import { useTodaySchedule } from '../../../hooks/useTodaySchedule';
import { useAuth } from '../../../hooks/useAuth';
import { haptic } from '../../../lib/haptics';
import { toLocalDayIso } from '../../../lib/localDate';

function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function clock(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function TaskActiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const taskId = Array.isArray(id) ? id[0] : id ?? '';
  const { user: authUser } = useAuth();
  const userId = authUser?.id ?? '';
  const { task, elapsedSeconds, isPaused, loading, error, pause, resume, start } =
    useActiveTask(taskId, userId);
  const { scheduledBlocks } = useTodaySchedule(userId, toLocalDayIso(new Date()));

  useEffect(() => {
    if (!loading && !error && task) void start();
  }, [loading, error, task, start]);

  const estimateMin = task?.estimatedMinutes ?? 60;
  const remaining = estimateMin * 60 - elapsedSeconds;
  const over = remaining < 0;
  const endsAt = clock(new Date(Date.now() + Math.max(remaining, 0) * 1000));

  const upNext = useMemo(() => {
    const nowMs = Date.now();
    return scheduledBlocks
      .filter((b) => b.task && b.task.id !== taskId && b.status !== 'shadow' && b.status !== 'rejected')
      .filter((b) => new Date(b.startTime).getTime() > nowMs)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
  }, [scheduledBlocks, taskId]);

  function handleDone() {
    haptic.primaryCTA();
    const timedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    router.push(`/tasks/${taskId}/complete?elapsed=${timedMinutes}` as Href);
  }

  function handleTogglePause() {
    haptic.selection();
    if (isPaused) resume();
    else pause();
  }

  if (loading) {
    return (
      <View style={[styles.plain, { paddingTop: insets.top + 24 }]}>
        <View style={styles.loadingWrap}>
          <AuraSkeleton height={20} />
          <AuraSkeleton height={80} />
          <AuraSkeleton height={28} />
        </View>
      </View>
    );
  }

  if (error || !task) {
    return (
      <View style={[styles.plain, { paddingTop: insets.top + 24 }]}>
        <View style={styles.loadingWrap}>
          <AuraText variant="title2">Couldn&apos;t load this task.</AuraText>
          <AuraText variant="body" color="secondary">
            It may have been removed, or the connection dropped. Head back and try again.
          </AuraText>
          <AuraButton label="Go back" variant="outline" onPress={() => router.back()} fullWidth />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{isPaused ? 'Paused' : 'Focus'}</Text>
        <Pressable
          onPress={() => { haptic.selection(); router.back(); }}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close focus"
        >
          <AuraSymbol name="xmark" size={20} color={colors.text.onAccent} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.subject}>{task.subject}</Text>
        <Text style={styles.title} numberOfLines={3}>{task.title}</Text>

        <Text style={styles.countdown} accessibilityLiveRegion="polite" adjustsFontSizeToFit numberOfLines={1}>
          {over ? `+${mmss(-remaining)}` : mmss(remaining)}
        </Text>
        <Text style={styles.sub}>
          {over ? `over the ${estimateMin} min estimate` : `left of ${estimateMin} min · ends at ${endsAt}`}
        </Text>

        <View style={styles.ticks}>
          <TickStrip totalMin={estimateMin} doneMin={elapsedSeconds / 60} />
        </View>
      </View>

      {upNext?.task && (
        <Text style={styles.upNext} numberOfLines={1}>
          Up next · {upNext.task.title} at {clock(new Date(upNext.startTime))}
        </Text>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={handleTogglePause}
          style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.btnOutlineText}>{isPaused ? 'Resume' : 'Pause'}</Text>
        </Pressable>
        <Pressable
          onPress={handleDone}
          style={({ pressed }) => [styles.btn, styles.btnSolid, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.btnSolidText}>I&apos;m done</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  const ink = c.text.onAccent;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.accent.steel, paddingHorizontal: spacing.xl },
    plain: { flex: 1, backgroundColor: c.background.primary, paddingHorizontal: spacing.screenPadding },
    loadingWrap: { gap: spacing.md, marginTop: spacing.xl },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { fontSize: 13, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: ink, opacity: 0.8 },
    closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
    body: { flex: 1, justifyContent: 'center' },
    subject: { fontSize: 14, fontWeight: '600', color: ink, opacity: 0.75, marginBottom: 6 },
    title: { fontFamily: fontFamily.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, color: ink },
    countdown: {
      fontFamily: fontFamily.display,
      fontSize: 104,
      lineHeight: 112,
      letterSpacing: -4,
      color: ink,
      fontVariant: ['tabular-nums'],
      marginTop: spacing.xxl,
    },
    sub: { fontSize: 16, fontWeight: '500', color: ink, opacity: 0.8, fontVariant: ['tabular-nums'] },
    ticks: { marginTop: spacing.xl },
    upNext: { fontSize: 14, fontWeight: '500', color: ink, opacity: 0.75, marginBottom: spacing.md },
    actions: { flexDirection: 'row', gap: spacing.md },
    btn: { flex: 1, minHeight: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
    btnOutline: { borderWidth: 1.5, borderColor: ink },
    btnOutlineText: { fontSize: 17, fontWeight: '600', color: ink },
    btnSolid: { backgroundColor: ink },
    btnSolidText: { fontSize: 17, fontWeight: '700', color: c.accent.steelDeep },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
}
