import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { GlassCard } from './GlassCard';

interface StreakBadgeProps {
  streak: number;
  visible: boolean;
  isMilestone?: boolean;
}

export function StreakBadge({ streak, visible, isMilestone = false }: StreakBadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 140, mass: 0.9 });
      opacity.value = withTiming(1, { duration: 220 });
      scale.value = withSequence(
        withSpring(1.06, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 14, stiffness: 200 }),
      );
    } else {
      translateY.value = withTiming(80, { duration: 200 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, translateY, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (streak < 2) return null;

  return (
    <Animated.View style={[styles.wrap, animStyle]} pointerEvents="none">
      <GlassCard intensity="thick" borderAccent style={styles.card}>
        <Text style={styles.flame}>{isMilestone ? '🏆' : '🔥'}</Text>
        <View style={styles.textCol}>
          <Text style={[styles.count, { color: colors.accent.amber }]}>
            {streak} day streak
          </Text>
          {isMilestone && (
            <Text style={styles.milestone}>Milestone reached!</Text>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      alignSelf: 'center',
      marginTop: spacing.lg,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
      borderRadius: 20,
      shadowColor: c.accent.amber,
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
    },
    flame: {
      fontSize: 28,
    },
    textCol: {
      gap: 2,
    },
    count: {
      ...typography.title2,
    },
    milestone: {
      ...typography.callout,
      color: c.text.secondary,
    },
  });
}
