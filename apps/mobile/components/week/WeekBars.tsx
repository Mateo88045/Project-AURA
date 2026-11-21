import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { radius } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { haptic } from '../../lib/haptics';
import type { DayLoad } from '../../hooks/useWeekLoad';

interface Props {
  load: DayLoad[];
  heaviestIso: string | null;
  selectedIso: string | null;
  todayIso: string;
  onSelect: (iso: string) => void;
}

function hours(min: number): string {
  if (min === 0) return '—';
  const h = min / 60;
  return `${h.toFixed(h < 10 ? 1 : 0)} h`;
}

export function WeekBars({ load, heaviestIso, selectedIso, todayIso, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const max = Math.max(60, ...load.map((d) => d.minutes));

  return (
    <View style={styles.list}>
      {load.map((d) => {
        const heavy = d.iso === heaviestIso;
        const selected = d.iso === selectedIso;
        const name = d.date.toLocaleDateString(undefined, { weekday: 'short' });
        return (
          <Pressable
            key={d.iso}
            onPress={() => { haptic.selection(); onSelect(d.iso); }}
            style={[styles.row, selected && styles.rowSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${name}, ${d.tasks.length} due, ${hours(d.minutes)}`}
          >
            <Text style={[styles.day, d.iso === todayIso && styles.dayToday]}>{name}</Text>
            <View style={styles.track}>
              {d.minutes > 0 && (
                <View
                  style={[
                    styles.fill,
                    { width: `${(d.minutes / max) * 100}%` },
                    heavy && styles.fillHeavy,
                  ]}
                />
              )}
            </View>
            <Text style={[styles.hours, heavy && styles.hoursHeavy]}>{hours(d.minutes)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    list: { gap: 2 },
    row: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 8,
      borderRadius: radius.sm,
    },
    rowSelected: { backgroundColor: c.glass.accent },
    day: { width: 40, fontSize: 14, fontWeight: '600', color: c.text.secondary },
    dayToday: { color: c.text.primary },
    track: { flex: 1, height: 12, borderRadius: 6, backgroundColor: c.glass.light, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 6, backgroundColor: c.accent.steel },
    fillHeavy: { backgroundColor: c.accent.amber },
    hours: { width: 48, textAlign: 'right', fontSize: 14, fontWeight: '600', color: c.text.primary, fontVariant: ['tabular-nums'] },
    hoursHeavy: { color: c.text.warn },
  });
}
