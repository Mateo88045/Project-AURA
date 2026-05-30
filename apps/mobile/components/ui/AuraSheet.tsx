import { ReactNode, useEffect, useMemo } from 'react';
import { Modal, Pressable, View, StyleSheet, PanResponder } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GestureSprings } from '@chronos/shared/constants/motion';
import { radius, spacing } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { GlassCard } from './GlassCard';

// Distance past which a drag triggers dismissal (px)
const DISMISS_THRESHOLD = 180;
// Velocity past which a fast flick triggers dismissal (px/s)
const DISMISS_VELOCITY = 0.5;
// Off-screen starting/ending position
const OFF_SCREEN = 700;

interface AuraSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function AuraSheet({ visible, onClose, children }: AuraSheetProps) {
  const { colors, resolvedMode } = useTheme();
  const scrimColor = resolvedMode === 'light' ? 'rgba(15, 23, 42, 0.28)' : 'rgba(0, 0, 0, 0.5)';

  // Manual translateY — fully controls the sheet position
  const translateY = useSharedValue(OFF_SCREEN);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, GestureSprings.dismiss);
    }
  }, [visible, translateY]);

  function dismiss() {
    translateY.value = withTiming(OFF_SCREEN, { duration: 260 }, () => {
      runOnJS(onClose)();
    });
  }

  // PanResponder — works everywhere (native + web), no findNodeHandle.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8,
        onPanResponderMove: (_, gs) => {
          translateY.value = Math.max(0, gs.dy);
        },
        onPanResponderRelease: (_, gs) => {
          const shouldDismiss =
            gs.dy > DISMISS_THRESHOLD || gs.vy > DISMISS_VELOCITY;
          if (shouldDismiss) {
            dismiss();
          } else {
            translateY.value = withSpring(0, GestureSprings.snap);
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Scrim fades out as sheet is dragged down
  const scrimAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, DISMISS_THRESHOLD * 1.5],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      {/* Scrim backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, scrimAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: scrimColor }]} />
        </Pressable>
      </Animated.View>

      {/* Sheet — drag-to-dismiss via PanResponder */}
      <Animated.View
        style={[styles.sheet, sheetAnimStyle]}
        {...panResponder.panHandlers}
      >
        <GlassCard intensity="thick" borderAccent style={styles.card}>
          {/* Drag handle — visual affordance */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border.glass }]} />
          </View>
          <View style={styles.body}>{children}</View>
        </GlassCard>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  body: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
});
