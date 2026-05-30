import { View, Text, StyleSheet } from 'react-native';
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
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accent.blue,
        },
      ]}
    >
      <Text style={[styles.initials, { color: colors.text.inverse }]}>
        {initials}
      </Text>
    </View>
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
