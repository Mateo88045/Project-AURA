import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fontFamily, radius } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { weekOf, sameDay } from './blockTime';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Current week, Monday first, with today filled in ink. */
export function DayStrip({ today }: { today: Date }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const days = useMemo(() => weekOf(today), [today]);

  return (
    <View style={styles.row} accessibilityRole="summary">
      {days.map((d, i) => {
        const isToday = sameDay(d, today);
        return (
          <View
            key={d.toISOString()}
            style={[styles.cell, isToday && styles.cellToday]}
            accessibilityLabel={d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' })}
          >
            <Text style={[styles.letter, isToday && styles.textToday]}>{DAY_LETTERS[i]}</Text>
            <Text style={[styles.num, isToday && styles.textToday]}>{d.getDate()}</Text>
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
    cell: {
      flex: 1,
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      gap: 2,
    },
    cellToday: { backgroundColor: colors.text.primary },
    letter: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6, color: colors.text.tertiary },
    num: {
      fontFamily: fontFamily.displayMedium,
      fontSize: 18,
      color: colors.text.primary,
      fontVariant: ['tabular-nums'],
    },
    textToday: { color: colors.background.primary },
  });
}
