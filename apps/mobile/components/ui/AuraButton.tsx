import type React from 'react';
import { useEffect, useMemo } from 'react';
import { Pressable, Text, View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { radius, typography, type ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { haptic } from '../../lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'ghost' | 'outline' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface VariantStyle {
  bg: string;
  border: string;
  borderW: number;
  text: string;
}

function makeVariantStyles(c: ThemeColors): Record<Variant, VariantStyle> {
  return {
    // Steel CTA — Chronos's primary action surface. Never a saturated indigo,
    // never a gradient, never a 9999 pill.
    primary:     { bg: c.accent.blue,  border: 'transparent',  borderW: 0, text: c.text.inverse },
    destructive: { bg: c.accent.coral, border: 'transparent',  borderW: 0, text: c.text.inverse },
    outline:     { bg: 'transparent',  border: c.border.glass, borderW: 1, text: c.text.primary },
    ghost:       { bg: 'transparent',  border: c.border.subtle, borderW: 1, text: c.text.secondary },
  };
}

const sizeStyles: Record<Size, { height: number; paddingHorizontal: number }> = {
  sm: { height: 36, paddingHorizontal: 14 },
  md: { height: 44, paddingHorizontal: 20 },
  lg: { height: 52, paddingHorizontal: 24 },
};

interface AuraButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  /** Optional icon element rendered before the label. */
  icon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Three-dot pulse — replaces ActivityIndicator. Each dot pulses opacity in
// sequence with an 180ms stagger. Anti-slop rule: never use the platform
// spinner; loading state is part of the design.
// ---------------------------------------------------------------------------

function ButtonPulse({ color }: { color: string }) {
  return (
    <View style={pulseStyles.row}>
      <PulseDot color={color} index={0} />
      <PulseDot color={color} index={1} />
      <PulseDot color={color} index={2} />
    </View>
  );
}

function PulseDot({ color, index }: { color: string; index: number }) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withDelay(
      index * 180,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.35, { duration: 420, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.35, { duration: 240 }),
        ),
        -1,
        false,
      ),
    );
  }, [index, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        pulseStyles.dot,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

const pulseStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export function AuraButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'md',
  style,
  fullWidth = false,
  icon,
}: AuraButtonProps) {
  const { colors } = useTheme();
  const variantStyles = useMemo(() => makeVariantStyles(colors), [colors]);
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }

  function handlePress() {
    if (variant === 'primary' || variant === 'destructive') {
      haptic.primaryCTA();
    } else {
      haptic.secondary();
    }
    onPress();
  }

  return (
    <AnimatedPressable
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: v.borderW,
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={label}
    >
      {loading ? (
        <ButtonPulse color={v.text} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[styles.label, { color: v.text }]}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Chronos buttons use radius.sm (8). Never 9999, never 12.
    borderRadius: radius.sm,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { flexShrink: 0 },
  label: { ...typography.headline, letterSpacing: -0.2 },
});
