import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { spacing } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AuraSymbol } from './AuraSymbol';
import { AuraText } from './AuraText';

// Slow breath — matched to AmbientOrbs so the empty state feels like the same
// atmosphere settling, not a separate widget.
const BREATH_MS = 4000;
const ORB_SIZE = 176;

interface CalmEmptyStateProps {
  title: string;
  body: string;
  /** AuraSymbol glyph at the center of the glow. Defaults to the Chronos mark. */
  icon?: string;
}

/**
 * An empty state as a calm moment rather than a placeholder: the Chronos glyph
 * resting inside a soft, slowly breathing glow. Used when there's genuinely
 * nothing to show and we want the absence to feel like relief, not a blank.
 */
export function CalmEmptyState({ title, body, icon = 'sparkles' }: CalmEmptyStateProps) {
  const { colors } = useTheme();
  const breath = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: BREATH_MS, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: BREATH_MS, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [breath]);

  // Glow swells 0.9→1.08 in scale and 0.35→0.7 in opacity as it breathes.
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + breath.value * 0.35,
    transform: [{ scale: 0.9 + breath.value * 0.18 }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.wrap}>
      <View style={styles.orbWrap}>
        <Animated.View style={[styles.glow, glowStyle]}>
          <LinearGradient
            colors={[colors.accent.sky + '55', colors.accent.blue + '22', 'transparent']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        <AuraSymbol name={icon} size={44} color={colors.accent.sky} weight="light" />
      </View>
      <AuraText variant="title2" style={styles.title}>
        {title}
      </AuraText>
      <AuraText variant="body" color="secondary" style={styles.body}>
        {body}
      </AuraText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  orbWrap: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  glow: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: 'hidden',
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 300,
  },
});
