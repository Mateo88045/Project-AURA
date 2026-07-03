import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { OnboardingProgress } from '../../components/ui/OnboardingProgress';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
          animation: 'slide_from_right',
        }}
      />
      {/* Persistent across every onboarding screen; hides itself on the paywall. */}
      <OnboardingProgress />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
