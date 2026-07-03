import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { spacing } from '@chronos/shared/theme';
import { Springs } from '@chronos/shared/constants/motion';
import { useTheme } from '../../lib/theme';

// Canonical onboarding order — derived from the router.push() chain, not the
// file listing. The paywall is intentionally absent: it is the conversion
// moment, not a numbered step, so this indicator hides itself there.
const ONBOARDING_STEPS = [
  'index', // app/onboarding/index.tsx — route segment is just 'onboarding'
  'connect',
  'profile',
  'schedule',
  'preferences',
  'questionnaire',
] as const;

const DOT_INACTIVE = 4;
const DOT_ACTIVE = 8;

interface StepDotProps {
  active: boolean;
  inactiveColor: string;
  activeColor: string;
}

// One dot. When it becomes the active step its fill slides wider and warms to
// the accent — a subtle "the current moment is here" cue as screens advance.
function StepDot({ active, inactiveColor, activeColor }: StepDotProps) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, Springs.gentle);
  }, [active, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [DOT_INACTIVE, DOT_ACTIVE]),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor],
    ),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

/**
 * Persistent onboarding step indicator, rendered once from the onboarding
 * layout so it survives screen transitions. Reads the active route to decide
 * which step is current; renders nothing outside the numbered flow (e.g. the
 * paywall).
 */
export function OnboardingProgress() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const segments = useSegments();

  // Last segment identifies the screen; the index route reports as 'onboarding'.
  const lastSegment = segments[segments.length - 1];
  const routeName = lastSegment === 'onboarding' ? 'index' : lastSegment;
  const currentStep = ONBOARDING_STEPS.indexOf(
    routeName as (typeof ONBOARDING_STEPS)[number],
  );

  // Not a numbered step (paywall, or any non-onboarding route) — stay invisible.
  if (currentStep === -1) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      style={[styles.container, { top: insets.top + spacing.sm }]}
      pointerEvents="none"
    >
      <View
        style={styles.row}
        accessibilityRole="progressbar"
        accessibilityLabel="Onboarding progress"
        accessibilityValue={{ min: 1, max: ONBOARDING_STEPS.length, now: currentStep + 1 }}
      >
        {ONBOARDING_STEPS.map((step, i) => (
          <StepDot
            key={step}
            active={i === currentStep}
            inactiveColor={colors.border.subtle}
            activeColor={colors.accent.blue}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  dot: {
    height: DOT_INACTIVE,
    borderRadius: DOT_INACTIVE / 2,
  },
});
