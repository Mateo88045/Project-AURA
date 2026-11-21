import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { difficultyLabels, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { haptic } from '../../lib/haptics';
import { DifficultyBars } from '../ui/DifficultyBars';

interface UpNextCardProps {
  mode: 'now' | 'next';
  /** Minutes until start (next mode only). */
  startsInMin: number;
  title: string;
  timeRange: string;
  subject: string;
  due: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  onStart: () => void;
  onPush: () => void;
}

function statusLine(mode: 'now' | 'next', startsIn: number): string {
  if (mode === 'now') return 'Now';
  if (startsIn < 1) return 'Up next · starting now';
  if (startsIn < 60) return `Up next · starts in ${startsIn} min`;
  const h = Math.floor(startsIn / 60);
  return `Up next · starts in ${h} h${startsIn % 60 ? ` ${startsIn % 60} min` : ''}`;
}

export function UpNextCard(p: UpNextCardProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const meta = [p.timeRange, p.subject, p.due].filter(Boolean).join(' · ');

  return (
    <View style={s.card} accessibilityLabel="Up next">
      <View style={s.statusRow}>
        <View style={s.dot} />
        <Text style={s.status}>{statusLine(p.mode, p.startsInMin)}</Text>
      </View>
      <Text style={s.title} numberOfLines={2}>{p.title}</Text>
      <Text style={s.meta} numberOfLines={1}>{meta}</Text>
      <View style={s.diffRow} accessibilityLabel={`Difficulty ${p.difficulty} of 5`}>
        <DifficultyBars level={p.difficulty} size="compact" />
        <Text style={s.diffLabel}>{difficultyLabels[p.difficulty]}</Text>
      </View>
      <View style={s.actions}>
        <Pressable
          style={[s.btn, s.primary]}
          onPress={() => { haptic.primaryCTA(); p.onStart(); }}
          accessibilityRole="button"
        >
          <Text style={s.primaryText}>Start focus</Text>
        </Pressable>
        <Pressable
          style={[s.btn, s.secondary]}
          onPress={() => { haptic.secondary(); p.onPush(); }}
          accessibilityRole="button"
        >
          <Text style={s.secondaryText}>Push 30 min</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: { marginTop: 24, padding: 18, paddingBottom: 16, borderRadius: 20, backgroundColor: c.background.surface },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent.sky },
    status: { ...typography.nFootnote, color: c.accent.sky },
    title: { ...typography.nTitle, color: c.text.primary, marginTop: 10 },
    meta: { ...typography.nSubhead, color: c.text.secondary, marginTop: 4, fontVariant: ['tabular-nums'] },
    diffRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    diffLabel: { ...typography.nSubhead, color: c.text.primary },
    actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    btn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    primary: { backgroundColor: c.accent.blue },
    secondary: { backgroundColor: c.background.raised },
    primaryText: { ...typography.nHeadline, color: c.text.primary },
    secondaryText: { ...typography.nHeadline, color: c.text.primary },
  });
}
