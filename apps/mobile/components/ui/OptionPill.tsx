import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@aura/shared/constants/colors';

interface OptionPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  size?: 'sm' | 'md';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function OptionPill({
  label,
  selected,
  onPress,
  size = 'md',
}: OptionPillProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(
      withSpring(0.94, { damping: 20, stiffness: 400 }),
      withSpring(1, { damping: 20, stiffness: 400 }),
    );
    onPress();
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        selected ? styles.selected : styles.unselected,
        animStyle,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unselected: {
    backgroundColor: Colors.transparent,
    borderColor: `${Colors.steel}66`,
  },
  selected: {
    backgroundColor: `${Colors.steel}33`,
    borderColor: Colors.steel,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedLabel: {
    color: Colors.mist,
    fontWeight: '600',
  },
});
