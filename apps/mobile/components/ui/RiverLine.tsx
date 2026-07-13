import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/theme';

interface RiverLineProps {
  /**
   * X-position (px) of the river's center, measured from the timeline's left
   * edge. Should equal the TaskBlock dot center so the thread passes through
   * every dot. Defaults to the legacy value for any older call sites.
   */
  x?: number;
  /**
   * Inset (px) from the top of the container to where the thread begins. Set to
   * the first row's half-height so the line starts at the first dot rather than
   * overhanging above it. Defaults to 0 (span the full container).
   */
  top?: number;
  /** Inset (px) from the bottom, so the thread ends at the last dot. */
  bottom?: number;
  style?: ViewStyle;
}

// Crisp thread that must sit dead-center on each dot; the wider strand is a soft
// aura around it so the line reads as flowing water, not a drawn ruler.
const CORE_WIDTH = 1.5;
const GLOW_WIDTH = 6;

export function RiverLine({ x = 56, top = 0, bottom = 0, style }: RiverLineProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.fill, style]} pointerEvents="none">
      {/* Soft aura — wider and dimmer, gives the thread a watery bloom. */}
      <LinearGradient
        colors={['transparent', colors.accent.sky + '33', colors.accent.blue + '1A']}
        locations={[0, 0.45, 1]}
        style={[styles.strand, { width: GLOW_WIDTH, left: x - GLOW_WIDTH / 2, top, bottom }]}
      />
      {/* Crisp core — threads exactly through each task dot. */}
      <LinearGradient
        colors={['transparent', colors.accent.sky, colors.accent.blue + '4D']}
        locations={[0, 0.4, 1]}
        style={[styles.strand, { width: CORE_WIDTH, left: x - CORE_WIDTH / 2, top, bottom }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  strand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
});
