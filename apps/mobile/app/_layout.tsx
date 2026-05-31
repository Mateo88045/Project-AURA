import '../global.css';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { ThemeProvider, useTheme } from '../lib/theme';
import { AuraToastProvider } from '../components/ui/AuraToast';
import { useAuth } from '../hooks/useAuth';
import { useOnboardingGate } from '../hooks/useOnboardingGate';

// Handle foreground notifications — show as banners
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedApp() {
  const { colors, resolvedMode } = useTheme();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isComplete, targetRoute, loading: gateLoading } = useOnboardingGate(
    isAuthenticated ? user?.id ?? null : null,
  );
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (authLoading || gateLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';

    // Not authenticated → send to auth
    if (!isAuthenticated) {
      if (!inAuthGroup) router.replace('/auth');
      return;
    }

    // Authenticated but onboarding incomplete → send to correct onboarding step
    if (!isComplete) {
      // Already in onboarding — let them navigate within it
      if (inOnboardingGroup) return;
      router.replace(targetRoute as '/onboarding');
      return;
    }

    // Authenticated + onboarding complete → send to main app
    if (inAuthGroup || inOnboardingGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authLoading, gateLoading, isComplete, targetRoute, segments, router]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background.primary }]}>
      <AuraToastProvider>
        <StatusBar style={resolvedMode === 'light' ? 'dark' : 'light'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background.primary },
            animation: 'fade',
            animationDuration: 250,
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="auth"
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="onboarding"
            options={{ animation: 'fade_from_bottom' }}
          />
          <Stack.Screen
            name="schedule/review"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="briefing"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="tasks/[id]/index"
            options={{ animation: 'ios_from_right' }}
          />
          <Stack.Screen
            name="tasks/[id]/complete"
            options={{ presentation: 'transparentModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="tasks/new"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="tasks/scan"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="tasks/[id]/active"
            options={{ animation: 'ios_from_right' }}
          />
        </Stack>
      </AuraToastProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
