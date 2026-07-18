import { StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

interface RadialGlowProps {
  /** Diameter of the glow in px. */
  size: number;
  /** Center color (hex, no alpha — opacity is handled by the gradient stops). */
  color: string;
  /** Peak opacity at the center. Defaults to 0.35. */
  centerOpacity?: number;
  style?: ViewStyle;
}

/**
 * A true radial glow: full color at the center falling off to fully
 * transparent at the rim. Use this instead of a LinearGradient inside an
 * overflow-hidden circle — that trick leaves a hard-edged disk wherever the
 * gradient hasn't reached transparent by the circle's boundary.
 */
export function RadialGlow({ size, color, centerOpacity = 0.35, style }: RadialGlowProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={[styles.svg, style]}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={centerOpacity} />
          <Stop offset="55%" stopColor={color} stopOpacity={centerOpacity * 0.45} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#glow)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
  },
});
