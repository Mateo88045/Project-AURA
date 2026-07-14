import { useMemo, useRef } from 'react';
import { View, Pressable, Text, StyleSheet, PanResponder, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
import { radius, typography, difficultyLabels } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { Springs, GestureSprings } from '@chronos/shared/constants/motion';
import { haptic } from '../../lib/haptics';
import { AuraSymbol } from './AuraSymbol';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Right-swipe distance that triggers completion
const COMPLETE_THRESHOLD = 88;

const CARD_BORDER_LEFT = 2;
const CARD_PADDING_H = 14;
const DOT_SIZE = 6;

interface TaskBlockProps {
  title: string;
  subject: string;
  estimatedMinutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  variant: 'fixed' | 'scheduled';
  onPress?: () => void;
  /** Called when the user swipes right past the threshold. Scheduled tasks only. */
  onComplete?: () => void;
  /** Hide the in-card status dot when an external rail (Today timeline) owns it. */
  showDot?: boolean;
  style?: ViewStyle;
}

export function TaskBlock({
  title,
  subject,
  estimatedMinutes,
  difficulty,
  variant,
  onPress,
  onComplete,
  showDot = true,
  style,
}: TaskBlockProps) {
  const { colors } = useTheme();
  const isScheduled = variant === 'scheduled';
  const difficultyColor = colors.difficulty[difficulty];
  const swipeEnabled = isScheduled && !!onComplete;

  // Press scale
  const scale = useSharedValue(1);
  // Swipe translateX — only right (positive) values
  const translateX = useSharedValue(0);
  // Whether the current drag is past the completion threshold (haptic guard)
  const crossedRef = useRef(false);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  // Green reveal behind the card — opacity driven by translateX
  const revealStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, COMPLETE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [0, COMPLETE_THRESHOLD],
          [0.7, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // PanResponder — universally compatible (native + web), avoids findNodeHandle crash.
  // Only captures the gesture when the user moves ≥ 10px horizontally;
  // vertical scrolls and taps pass through untouched.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gs) =>
          swipeEnabled && gs.dx > 10 && Math.abs(gs.dy) < 10,
        onPanResponderMove: (_, gs) => {
          const raw = Math.max(0, gs.dx);
          translateX.value =
            raw < COMPLETE_THRESHOLD
              ? raw
              : COMPLETE_THRESHOLD + (raw - COMPLETE_THRESHOLD) * 0.2;

          // Haptic once per threshold crossing — not on every move event
          // past it, which would buzz continuously while dragging.
          const past = raw >= COMPLETE_THRESHOLD;
          if (past && !crossedRef.current) {
            haptic.selection();
          }
          crossedRef.current = past;
        },
        onPanResponderRelease: (_, gs) => {
          crossedRef.current = false;
          const didComplete =
            gs.dx >= COMPLETE_THRESHOLD || (gs.vx ?? 0) > 0.4;
          if (didComplete && onComplete) {
            translateX.value = withTiming(400, { duration: 260 }, () => {
              runOnJS(onComplete)();
            });
          } else {
            translateX.value = withSpring(0, GestureSprings.snap);
          }
        },
        onPanResponderTerminate: () => {
          crossedRef.current = false;
          translateX.value = withSpring(0, GestureSprings.snap);
        },
      }),
    [swipeEnabled, onComplete, translateX],
  );

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      {/* Green reveal layer — behind the card */}
      {swipeEnabled && (
        <Animated.View
          style={[
            styles.revealBg,
            { backgroundColor: colors.accent.emerald },
            revealStyle,
          ]}
        >
          <AuraSymbol name="checkmark" size={18} color={colors.text.inverse} />
        </Animated.View>
      )}

      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.97, Springs.gentle);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, Springs.gentle);
        }}
        onPress={onPress}
        style={[
          styles.base,
          isScheduled
            ? {
                backgroundColor: colors.glass.accent,
                borderColor: colors.border.glass,
                borderWidth: 1,
              }
            : styles.fixedBg,
          { borderLeftColor: isScheduled ? difficultyColor : colors.border.subtle },
          pressStyle,
        ]}
      >
        {showDot && (
          <View style={styles.dot}>
            <View
              style={[
                styles.dotInner,
                isScheduled
                  ? {
                      backgroundColor: difficultyColor,
                      shadowColor: difficultyColor,
                      shadowOpacity: 0.6,
                      shadowRadius: 6,
                    }
                  : { borderWidth: 1.5, borderColor: colors.border.glass },
              ]}
            />
          </View>
        )}
        <View style={styles.content}>
          <Text
            style={[
              isScheduled ? styles.titleScheduled : styles.titleFixed,
              { color: isScheduled ? colors.text.primary : colors.text.tertiary },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {isScheduled && (
            <Text style={[styles.meta, { color: colors.text.secondary }]}>
              {subject} · {estimatedMinutes}m ·{' '}
              <Text style={[styles.difficultyWord, { color: difficultyColor }]}>
                {difficultyLabels[difficulty]}
              </Text>
            </Text>
          )}
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  revealBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 8,
    width: COMPLETE_THRESHOLD - 8,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: CARD_PADDING_H,
    paddingVertical: 10,
    borderLeftWidth: CARD_BORDER_LEFT,
    borderRadius: radius.md,
    gap: 10,
    backgroundColor: 'transparent',
  },
  fixedBg: { backgroundColor: 'transparent' },
  dot: { width: DOT_SIZE, height: DOT_SIZE, justifyContent: 'center', alignItems: 'center' },
  dotInner: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  content: { flex: 1 },
  titleScheduled: { ...typography.headline },
  titleFixed: { ...typography.body },
  meta: { ...typography.callout, marginTop: 2 },
  difficultyWord: { fontWeight: '600' as const },
});
