import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';

export interface LaterRow {
  key: string;
  time: string;
  title: string;
  /** "30 min · Easy · due Wed" — homework only. */
  meta?: string;
  kind: 'homework' | 'fixed' | 'free';
  isDraft?: boolean;
}

const TIME_W = 52;
const RAIL_W = 22;
const GAP = 12;

export function LaterTodayList({ rows }: { rows: LaterRow[] }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View accessibilityLabel="Later today">
      <Text style={s.section}>Later today</Text>
      {rows.map((r, i) => {
        const last = i === rows.length - 1;
        const hw = r.kind === 'homework';
        return (
          <View key={r.key} style={[s.row, !last && s.rowGap]}>
            <Text style={[s.time, !hw && s.dim]}>{r.time}</Text>
            <View style={s.rail}>
              {!last && <View style={s.line} />}
              {i > 0 && <View style={[s.line, s.lineTop]} />}
              {hw ? (
                <View style={[s.dot, r.isDraft && s.draftDot]} />
              ) : (
                <View style={[s.ring, r.kind === 'free' && s.ringFree]} />
              )}
            </View>
            <View style={s.body}>
              <Text style={[s.title, !hw && s.titleDim]} numberOfLines={2}>{r.title}</Text>
              {r.meta ? <Text style={s.meta}>{r.isDraft ? `Draft · ${r.meta}` : r.meta}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    section: { ...typography.nSection, color: c.text.secondary, marginTop: 28, marginBottom: 10 },
    row: { flexDirection: 'row', gap: GAP },
    rowGap: { paddingBottom: 18 },
    time: { ...typography.nSubhead, lineHeight: 22, width: TIME_W, color: c.text.primary, fontVariant: ['tabular-nums'] },
    dim: { color: c.text.secondary },
    rail: { width: RAIL_W, alignItems: 'center' },
    // Rail segments: one from this dot down, one from the top to this dot, so
    // the line starts at the first dot and ends at the last.
    line: { position: 'absolute', top: 11, bottom: 0, left: RAIL_W / 2, width: 1, backgroundColor: c.border.glass },
    lineTop: { top: 0, bottom: undefined, height: 11 },
    dot: { marginTop: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent.sky },
    draftDot: { backgroundColor: c.background.primary, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.accent.sky },
    ring: { marginTop: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: c.background.primary, borderWidth: 1, borderColor: c.text.tertiary },
    ringFree: { borderColor: c.accent.sky },
    body: { flex: 1 },
    title: { ...typography.nHeadline, color: c.text.primary },
    titleDim: { fontWeight: '400', color: c.text.secondary },
    meta: { ...typography.nSubhead, color: c.text.secondary, marginTop: 2 },
  });
}
