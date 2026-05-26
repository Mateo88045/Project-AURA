import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle, Camera, BookOpen } from 'lucide-react-native';
import { Colors } from '@aura/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';

interface Entry {
  title: string;
  body: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export default function AiHubScreen() {
  const router = useRouter();

  const entries: Entry[] = [
    {
      title: 'Chat with Aura',
      body: 'Move things around, free up an evening, add a task — out loud.',
      icon: <MessageCircle color={Colors.mist} size={22} strokeWidth={1.8} />,
      onPress: () => router.push('/ai/chat'),
    },
    {
      title: 'Snap an assignment',
      body: 'Photograph a worksheet or handout. Aura reads it and schedules it.',
      icon: <Camera color={Colors.mist} size={22} strokeWidth={1.8} />,
      onPress: () => router.push('/photo/capture'),
    },
    {
      title: 'Sunday briefing',
      body: 'Your week ahead — at a glance, every Sunday evening.',
      icon: <BookOpen color={Colors.mist} size={22} strokeWidth={1.8} />,
      onPress: () => router.push('/briefing'),
    },
  ];

  return (
    <ScreenContainer>
      <Text style={styles.h1}>AI Hub</Text>
      <Text style={styles.sub}>Three ways to lean on Aura.</Text>
      <View style={{ gap: 12, marginTop: 28 }}>
        {entries.map((e) => (
          <Pressable
            key={e.title}
            onPress={e.onPress}
            accessibilityRole="button"
            accessibilityLabel={e.title}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.iconWrap}>{e.icon}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{e.title}</Text>
              <Text style={styles.cardBody}>{e.body}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 32, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -1.2 },
  sub: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.15)',
    backgroundColor: 'rgba(168,218,220,0.04)',
    alignItems: 'flex-start',
  },
  pressed: { opacity: 0.75 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(168,218,220,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  cardBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
});
