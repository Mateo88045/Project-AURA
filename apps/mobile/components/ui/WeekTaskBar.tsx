import { View, StyleSheet } from 'react-native';
import { radius } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';

// Compact stand-in for a task in the week-at-a-glance grid: a single glowing
// bar whose height tracks how long the task takes and whose color tracks its
// difficulty. Stacked per day, the bars read as a load "column" you can compare
// across the week at a glance.
const MIN_HEIGHT = 14;
const MAX_HEIGHT = 34;
const MINUTES_TO_PX = 0.2;

export function weekBarHeight(estimatedMinutes: number): number {
  const raw = MIN_HEIGHT + estimatedMinutes * MINUTES_TO_PX;
  return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, raw));
}

interface WeekTaskBarProps {
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
}

export function WeekTaskBar({ difficulty, estimatedMinutes }: WeekTaskBarProps) {
  const { colors } = useTheme();
  const color = colors.difficulty[difficulty];
  return (
    <View
      style={[
        styles.bar,
        {
          height: weekBarHeight(estimatedMinutes),
          // Translucent body + colored edge: the load column stays readable
          // without shouting over the rest of the screen in solid saturation.
          backgroundColor: color + '73',
          borderColor: color + 'A6',
          shadowColor: color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    borderRadius: 5,
    borderWidth: 1,
    // A whisper of the alive-glow language from the Today river.
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
});
