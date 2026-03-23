import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { AuraButton } from '../../components/ui/AuraButton';

/**
 * Onboarding — Welcome — /onboarding/
 */
export default function OnboardingWelcomeScreen() {
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
        className="flex-1 justify-between"
        style={{ paddingHorizontal: Layout.screenPadding, paddingTop: 80, paddingBottom: 40 }}
      >
        <View>
          <Text
            className="text-xs font-light tracking-[1.5px]"
            style={{ color: Colors.textSecondary }}
          >
            WELCOME
          </Text>
          <Text
            className="text-3xl font-semibold mt-2"
            style={{ color: Colors.textPrimary }}
          >
            Meet your new homework brain.
          </Text>
          <Text className="text-sm mt-3" style={{ color: Colors.textSecondary }}>
            Aura watches your classes, drafts a plan every night, and turns your free time into a calm, glowing river.
          </Text>
        </View>

        <View>
          <Text
            className="text-xs font-medium mb-2"
            style={{ color: Colors.textSecondary }}
          >
            STARTING TODAY · {friendlyDate.toUpperCase()}
          </Text>
          <AuraButton
            label="Get started"
            size="lg"
            onPress={() => router.push('/onboarding/connect')}
          />
          <Text className="text-xs mt-3" style={{ color: Colors.textSecondary }}>
            Takes about 1 minute. No schedules are changed without you approving them first.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbOne: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: Colors.mist,
    opacity: 0.16,
  },
  orbTwo: {
    position: 'absolute',
    bottom: -60,
    right: -20,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: Colors.steel,
    opacity: 0.14,
  },
});

