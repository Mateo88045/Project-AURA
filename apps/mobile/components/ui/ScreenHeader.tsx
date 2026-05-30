import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '@chronos/shared/constants/colors';

interface Props {
  title: string;
  eyebrow?: string;
  showBack?: boolean;
}

export function ScreenHeader({ title, eyebrow, showBack = true }: Props) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
        >
          <ArrowLeft color={Colors.textSecondary} size={20} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168,218,220,0.08)',
  },
  eyebrow: { color: Colors.mist, fontSize: 10, letterSpacing: 2.5, fontWeight: '600' },
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: '700', letterSpacing: -0.5, marginTop: 4 },
});
