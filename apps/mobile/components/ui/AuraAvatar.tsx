import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';

interface AuraAvatarProps {
  name: string;
  size?: number;
}

export function AuraAvatar({ name, size = 36 }: AuraAvatarProps) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <LinearGradient
      // Sky → Steel, lit from the top-left — reads as a lit sphere, not a flat chip.
      colors={[colors.accent.sky, colors.accent.blue]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          { color: colors.text.inverse, fontSize: Math.round(size * 0.38) },
        ]}
      >
        {initials}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.headline,
  },
});
