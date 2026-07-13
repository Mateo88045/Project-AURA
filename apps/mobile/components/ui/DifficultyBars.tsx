import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Springs } from '@chronos/shared/constants/motion';
import { useTheme } from '../../lib/theme';

interface DifficultyBarsProps {
  level: 1 | 2 | 3 | 4 | 5;
  /** Set to false to skip the fill-in animation (e.g. inside lists that already stagger) */
  animated?: boolean;
  /** Compact fits inside list rows (10px bars per the spec); regular is for heroes and detail views. */
  size?: 'regular' | 'compact';
}

const BAR_WIDTHS = { regular: 16, compact: 10 } as const;
const BAR_GAPS = { regular: 4, compact: 2 } as const;
const STAGGER = 60;

function Bar({ active, color, index, animated, barWidth }: {
  active: boolean;
  color: string;
  index: number;
  animated: boolean;
  barWidth: number;
}) {
  // Each bar animates its width from 0 → barWidth on mount.
  // Inactive bars skip the animation and stay at full width immediately.
  const width = useSharedValue(animated && active ? 0 : barWidth);

  useEffect(() => {
    if (animated && active) {
      width.value = withDelay(index * STAGGER, withSpring(barWidth, Springs.bouncy));
    }
  }, [animated, active, index, width, barWidth]);

  const animStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <Animated.View
      style={[
        styles.bar,
        animStyle,
        { backgroundColor: color },
      ]}
    />
  );
}

export function DifficultyBars({ level, animated = true, size = 'regular' }: DifficultyBarsProps) {
  const { colors } = useTheme();
  const active = colors.difficulty[level];
  const inactive = colors.border.subtle;
  const barWidth = BAR_WIDTHS[size];

  return (
    <View style={[styles.row, { gap: BAR_GAPS[size] }]}>
      {([1, 2, 3, 4, 5] as const).map((i) => (
        <Bar
          key={i}
          active={i <= level}
          color={i <= level ? active : inactive}
          index={i - 1}
          animated={animated}
          barWidth={barWidth}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  bar: { height: 3, borderRadius: 2 },
});
