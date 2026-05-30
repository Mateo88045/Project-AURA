import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@chronos/shared/constants/colors';
import type { Difficulty } from '@chronos/shared/types';

interface Props {
  difficulty: Difficulty;
  showLabel?: boolean;
}

function colorFor(level: Difficulty): string {
  if (level <= 2) return Colors.green;
  if (level === 3) return Colors.amber;
  return Colors.red;
}

const LABELS: Record<Difficulty, string> = {
  1: 'Easy',
  2: 'Light',
  3: 'Moderate',
  4: 'Hard',
  5: 'Brutal',
};

export function DifficultyBadge({ difficulty, showLabel = true }: Props) {
  const fill = colorFor(difficulty);
  return (
    <View style={styles.container}>
      <View style={styles.bars} accessibilityLabel={`Difficulty ${difficulty} of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i <= difficulty ? fill : 'rgba(142,175,194,0.2)' },
            ]}
          />
        ))}
      </View>
      {showLabel ? <Text style={[styles.label, { color: fill }]}>{LABELS[difficulty]}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bars: { flexDirection: 'row', gap: 2 },
  bar: { width: 10, height: 3, borderRadius: 1.5 },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
