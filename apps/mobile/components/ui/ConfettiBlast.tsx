import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const COLORS = ['#A8DADC', '#457B9D', '#7ECFA0', '#F4A261', '#F1FAEE'];
const COUNT = 36;

interface ConfettiPieceProps {
  index: number;
  originX: number;
  originY: number;
}

function ConfettiPiece({ index, originX, originY }: ConfettiPieceProps) {
  const angle = (index / COUNT) * 2 * Math.PI + (Math.random() * 0.5 - 0.25);
  const speed = 160 + Math.random() * 220;
  const color = COLORS[index % COLORS.length];
  const size = 5 + Math.floor(Math.random() * 6);
  const delay = index * 15 + Math.random() * 40;
  const isRect = index % 3 !== 0;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const targetX = Math.cos(angle) * speed;
    const targetY = Math.sin(angle) * speed - 60; // upward bias

    opacity.value = withDelay(delay, withTiming(1, { duration: 60 }));
    tx.value = withDelay(delay, withSpring(targetX, { damping: 10, stiffness: 80, mass: 0.6 }));
    ty.value = withDelay(
      delay,
      withSpring(targetY + 120, { damping: 8, stiffness: 60, mass: 0.8 }), // gravity pull
    );
    rotate.value = withDelay(
      delay,
      withTiming(Math.random() > 0.5 ? 720 : -540, { duration: 1800, easing: Easing.out(Easing.quad) }),
    );
    opacity.value = withDelay(
      delay + 600,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        animStyle,
        {
          left: originX - size / 2,
          top: originY - size / 2,
          width: isRect ? size * 2 : size,
          height: size,
          borderRadius: isRect ? 2 : size / 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}

interface ConfettiBlastProps {
  playing: boolean;
}

export function ConfettiBlast({ playing }: ConfettiBlastProps) {
  if (!playing) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: COUNT }).map((_, i) => (
        <ConfettiPiece
          key={i}
          index={i}
          originX={200} // approximate screen center-x
          originY={260} // slightly above center-y
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
});
