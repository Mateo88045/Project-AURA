import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { AuraButton } from '../../components/ui/AuraButton';

export default function AIHubScreen() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const friendlyDate = useMemo(
    () =>
      today.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    [today],
  );

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bgDark }}>
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />

      <View
        style={{ paddingHorizontal: Layout.screenPadding }}
        className="pt-12"
      >
        <Text className="text-2xl font-semibold" style={{ color: Colors.textPrimary }}>
          AI
        </Text>
        <Text className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
          Ask Aura to explain, simplify, and adjust your plan.
        </Text>

        <View className="mt-6 gap-3">
          <AuraButton
            label="Open chat"
            onPress={() => router.push('/(tabs)/ai/chat')}
          />
          <AuraButton
            label={`Explain my workload (${friendlyDate})`}
            variant="ghost"
            onPress={() => {
              // eslint-disable-next-line no-console
              console.log('[STUB] explain workload');
            }}
          />
          <AuraButton
            label="Suggest a lighter evening"
            variant="ghost"
            onPress={() => {
              // eslint-disable-next-line no-console
              console.log('[STUB] lighten evening');
            }}
          />
        </View>

        <View className="mt-10">
          <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
            Coming soon
          </Text>
          <Text className="text-sm mt-2" style={{ color: Colors.textSecondary }}>
            This hub will surface quick AI actions, weekly reflections, and your
            Sunday briefing.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbOne: {
    position: 'absolute',
    top: -70,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: Colors.mist,
    opacity: 0.1,
  },
  orbTwo: {
    position: 'absolute',
    bottom: -60,
    right: -30,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: Colors.steel,
    opacity: 0.12,
  },
});
