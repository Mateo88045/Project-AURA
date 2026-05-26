import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: object;
}

export function AuraSkeleton({ width = '100%', height = 14, radius = 6, style }: Props) {
  const shimmer = useSharedValue(0.35);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [shimmer]);

  const animated = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  return (
    <View style={[{ width, height, borderRadius: radius }, styles.base, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animated, styles.shimmer, { borderRadius: radius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', backgroundColor: 'rgba(168,218,220,0.08)' },
  shimmer: { backgroundColor: 'rgba(168,218,220,0.18)' },
});
