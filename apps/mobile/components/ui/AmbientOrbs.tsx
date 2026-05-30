import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../lib/theme';

// ---------------------------------------------------------------------------
// AmbientOrbs — the atmospheric depth behind every screen.
//
// Two slow-breathing radial gradients painted with the only two atmospheric
// hues Chronos knows: Mist (#A8DADC) and Steel (#457B9D). They live behind
// content (zIndex -1), pulse 0.3 → 0.5 → 0.3 over 4s, and never compete with
// the foreground. Per the spec: orbs are *atmosphere*, not focal points.
// ---------------------------------------------------------------------------

export function AmbientOrbs() {
  const { colors, resolvedMode } = useTheme();
  // Mist orb stays subtle; Steel orb gets a hair more presence on cream paper.
  const mistAlpha  = resolvedMode === 'light' ? '14' : '12';
  const steelAlpha = resolvedMode === 'light' ? '1A' : '14';

  const mistOpacity  = useSharedValue(0.3);
  const steelOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Slow 4s pulse, offset between the two so they never peak together.
    mistOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.3, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    steelOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.5, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [mistOpacity, steelOpacity]);

  const mistStyle  = useAnimatedStyle(() => ({ opacity: mistOpacity.value }));
  const steelStyle = useAnimatedStyle(() => ({ opacity: steelOpacity.value }));

  return (
    <View style={[styles.container, { pointerEvents: 'none' }]}>
      {/* Mist orb — top-left */}
      <Animated.View style={[styles.mistOrb, mistStyle]}>
        <LinearGradient
          colors={[colors.accent.sky + mistAlpha, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Steel orb — mid-right */}
      <Animated.View style={[styles.steelOrb, steelStyle]}>
        <LinearGradient
          colors={[colors.accent.blue + steelAlpha, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  mistOrb: {
    position: 'absolute',
    top: -60,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
  },
  steelOrb: {
    position: 'absolute',
    top: 140,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
  },
});
