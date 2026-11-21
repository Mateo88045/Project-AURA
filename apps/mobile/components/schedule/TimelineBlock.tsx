import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Line, Rect } from 'react-native-svg';
import { radius } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { clockLabel, meridiem } from './blockTime';

export type BlockKind = 'fixed' | 'homework' | 'live' | 'draft';

export interface TimelineItem {
  key: string;
  kind: BlockKind;
  title: string;
  startMin: number;
  endMin: number;
  /** Task id for homework blocks — the live block's Start opens it. */
  taskId?: string;
  subject?: string;
}

interface Props {
  item: TimelineItem;
  height: number;
  onStart?: () => void;
}

export function TimelineBlock({ item, height, onStart }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const compact = height < 52;
  const time = `${clockLabel(item.startMin)}–${clockLabel(item.endMin)} ${meridiem(item.endMin)}`;
  const isLive = item.kind === 'live';
  const meta = item.kind === 'draft' ? `Draft · ${time}` : item.subject ? `${item.subject} · ${time}` : time;

  return (
    <View
      style={[styles.base, styles[item.kind], { height }]}
      accessibilityLabel={`${item.title}, ${meta}`}
    >
      {item.kind === 'fixed' && <Hatch id={`hatch-${item.key}`} color={colors.timeline.hatch} />}
      <View style={[styles.inner, compact && styles.innerCompact]}>
        <View style={styles.textCol}>
          <Text style={[styles.title, isLive && styles.titleLive]} numberOfLines={compact ? 1 : 2}>
            {item.title}
          </Text>
          {!compact && (
            <Text style={[styles.meta, isLive && styles.metaLive]} numberOfLines={1}>
              {meta}
            </Text>
          )}
        </View>
        {isLive && onStart && (
          <Pressable
            onPress={onStart}
            style={({ pressed }) => [styles.startPill, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Start ${item.title}`}
            hitSlop={compact ? 8 : 0}
          >
            <Text style={styles.startText}>Start</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Hatch({ id, color }: { id: string; color: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id={id} patternUnits="userSpaceOnUse" width={8} height={8} patternTransform="rotate(135)">
          <Line x1={0} y1={0} x2={0} y2={8} stroke={color} strokeWidth={3} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: { borderRadius: radius.md, overflow: 'hidden' },
    fixed: {
      borderWidth: 1,
      borderColor: colors.timeline.hatchBorder,
      backgroundColor: colors.background.primary,
    },
    homework: { backgroundColor: colors.timeline.homework },
    live: { backgroundColor: colors.accent.steel },
    draft: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.accent.steel,
      backgroundColor: colors.glass.accent,
    },
    inner: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
    },
    innerCompact: { alignItems: 'center', paddingVertical: 0 },
    textCol: { flex: 1, gap: 2 },
    title: { fontSize: 15, fontWeight: '600', color: colors.timeline.homeworkText, letterSpacing: -0.1 },
    titleLive: { color: colors.text.onAccent },
    meta: { fontSize: 12, fontWeight: '500', color: colors.text.secondary, fontVariant: ['tabular-nums'] },
    metaLive: { color: colors.text.onAccent, opacity: 0.8 },
    startPill: {
      minHeight: 44,
      minWidth: 72,
      paddingHorizontal: 18,
      borderRadius: radius.full,
      backgroundColor: colors.text.onAccent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    startText: { fontSize: 15, fontWeight: '700', color: colors.accent.steelDeep },
    pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  });
}
