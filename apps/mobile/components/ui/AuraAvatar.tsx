import { View, Text } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';

interface AuraAvatarProps {
  name: string;
}

export function AuraAvatar({ name }: AuraAvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <View
      className="w-10 h-10 items-center justify-center"
      style={{
        borderRadius: 999,
        backgroundColor: Colors.bgDark,
        borderWidth: 1,
        borderColor: Colors.mist,
      }}
    >
      <Text className="text-sm font-semibold" style={{ color: Colors.textPrimary }}>
        {initials}
      </Text>
    </View>
  );
}

