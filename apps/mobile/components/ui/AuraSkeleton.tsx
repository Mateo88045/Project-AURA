import { useEffect } from 'react';
import { type DimensionValue, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { radius } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';

interface AuraSkeletonProps {
  width?: DimensionValue;
  height?: number;
  rounded?: boolean;
  style?: ViewStyle;
}

// Shimmer highlight: transparent → mist glow → transparent, sweeps left-to-right.
const SHIMMER_DURATION = 1300;

export function AuraSkeleton({
  width = '100%',
  height = 16,
  rounded = true,
  style,
}: AuraSkeletonProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: SHIMMER_DURATION }),
      -1,
      false,
    );
  }, [translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    // Translate from -100% to +100% of container width (relative via percentage trick)
    // We animate from -1 to 1 and multiply by 100% in translateX as a ratio.
    // Since we can't use percentage translateX in RN, we use a wide gradient and translate it.
    transform: [{ translateX: translateX.value * 300 }],
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: rounded ? radius.full : radius.sm,
          backgroundColor: colors.background.surface,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(168, 218, 220, 0.14)',
            'rgba(168, 218, 220, 0.22)',
            'rgba(168, 218, 220, 0.14)',
            'transparent',
          ]}
          locations={[0, 0.3, 0.5, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -300,
    right: -300,
  },
});
