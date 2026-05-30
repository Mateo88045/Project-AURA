import { useEffect } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface CountUpTextProps {
  /** Target value to count up to */
  value: number;
  /** Optional suffix appended after the number (e.g. "h", "%") */
  suffix?: string;
  /** Animation duration in ms (default 800) */
  duration?: number;
  style?: StyleProp<TextStyle>;
}

export function CountUpText({ value, suffix = '', duration = 800, style }: CountUpTextProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [value, duration, progress]);

  const displayValue = useDerivedValue(() =>
    String(Math.round(progress.value * value)) + suffix,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- animatedProps.text is a Reanimated pattern not in RN types
  const animatedProps = useAnimatedProps<any>(() => ({
    text: displayValue.value,
    children: displayValue.value,
  }));

  return (
    <AnimatedText
      animatedProps={animatedProps}
      style={[styles.base, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {},
});
