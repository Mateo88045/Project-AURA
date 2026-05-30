import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@chronos/shared/constants/colors';

interface Props {
  name: string;
  size?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ChronosAvatar({ name, size = 40 }: Props) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      accessibilityLabel={`Avatar for ${name}`}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(168,218,220,0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: Colors.mist, fontWeight: '600', letterSpacing: 0.5 },
});
