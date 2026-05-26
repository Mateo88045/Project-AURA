import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '@aura/shared/constants/colors';

interface AuraButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AuraButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: AuraButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    if (disabled || loading) return;
    scale.value = withSequence(
      withSpring(0.96, { damping: 20, stiffness: 400 }),
      withSpring(1, { damping: 20, stiffness: 400 }),
    );
    onPress();
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : styles.ghost,
        (disabled || loading) && styles.disabled,
        animStyle,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textPrimary} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'ghost' && styles.ghostLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: Colors.steel,
  },
  ghost: {
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.mist,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  ghostLabel: {
    color: Colors.mist,
  },
});
