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
}

const BAR_WIDTH = 16;
const STAGGER = 60;

function Bar({ active, color, index, animated }: {
  active: boolean;
  color: string;
  index: number;
  animated: boolean;
}) {
  // Each bar animates its width from 0 → BAR_WIDTH on mount.
  // Inactive bars skip the animation and stay at full width immediately.
  const width = useSharedValue(animated && active ? 0 : BAR_WIDTH);

  useEffect(() => {
    if (animated && active) {
      width.value = withDelay(index * STAGGER, withSpring(BAR_WIDTH, Springs.bouncy));
    }
  }, [animated, active, index, width]);

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

export function DifficultyBars({ level, animated = true }: DifficultyBarsProps) {
  const { colors } = useTheme();
  const active = colors.difficulty[level];
  const inactive = colors.border.subtle;

  return (
    <View style={styles.row}>
      {([1, 2, 3, 4, 5] as const).map((i) => (
        <Bar
          key={i}
          active={i <= level}
          color={i <= level ? active : inactive}
          index={i - 1}
          animated={animated}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  bar: { width: BAR_WIDTH, height: 3, borderRadius: 2 },
});
