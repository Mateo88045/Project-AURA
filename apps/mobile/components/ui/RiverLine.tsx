import { StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/theme';

interface RiverLineProps {
  style?: ViewStyle;
}

export function RiverLine({ style }: RiverLineProps) {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={['transparent', colors.accent.sky, colors.accent.blue + '4D']}
      locations={[0, 0.4, 1]}
      style={[styles.line, style]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 56,
    top: 0,
    bottom: 0,
    width: 1,
  },
});
