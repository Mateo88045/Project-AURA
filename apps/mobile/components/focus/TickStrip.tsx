import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';

const MAX_TICKS = 60;

/** One tick per minute of the estimate (capped at 60); finished minutes fade. */
export function TickStrip({ totalMin, doneMin }: { totalMin: number; doneMin: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const count = Math.max(1, Math.min(MAX_TICKS, Math.round(totalMin)));
  const scale = count / Math.max(totalMin, 1);
  const done = Math.min(count, Math.floor(doneMin * scale));

  return (
    <View style={styles.row} accessibilityLabel={`${Math.round(doneMin)} of ${Math.round(totalMin)} minutes done`}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.tick, i < done && styles.tickDone, i % 5 === 4 && styles.tickTall]} />
      ))}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 28 },
    tick: { width: 2, height: 18, borderRadius: 1, backgroundColor: colors.text.onAccent },
    tickTall: { height: 28 },
    tickDone: { opacity: 0.3 },
  });
}
