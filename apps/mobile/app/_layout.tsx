import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { ToastProvider } from '../components/ui/AuraToast';
import { getAuthToken } from '../lib/storage';
import { registerPushToken, subscribeToNotifications } from '../services/notifications';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <AuthAndNotifications />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.bgDark },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen
              name="schedule/review"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="ai/chat" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="tasks/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="briefing" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="settings/connections" />
            <Stack.Screen name="settings/guardrails" />
            <Stack.Screen name="settings/brain" />
          </Stack>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AuthAndNotifications() {
  const router = useRouter();
  const segments = useSegments();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await getAuthToken();
      if (!mounted) return;
      const inOnboarding = segments[0] === 'onboarding';
      if (!token && !inOnboarding) router.replace('/onboarding');
      setBootstrapped(true);
    })();
    return () => {
      mounted = false;
    };
    // Intentionally run once — auth guard for cold boot only.
    // Sign-in / sign-out flows route explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!bootstrapped) return;
    registerPushToken().catch(() => {});
    const unsubscribe = subscribeToNotifications();
    return unsubscribe;
  }, [bootstrapped]);

  return <View />;
}
