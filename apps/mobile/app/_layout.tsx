import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { ToastProvider } from '../components/ui/AuraToast';
import { DemoModeBanner } from '../components/ui/DemoModeBanner';
import { getAuthToken } from '../lib/storage';
import { getSupabaseOrNull } from '../lib/supabase';
import { IS_DEMO_MODE } from '../lib/env';
import { registerPushToken, subscribeToNotifications } from '../services/notifications';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <AuthAndNotifications />
          <DemoModeBanner />
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
            <Stack.Screen
              name="photo/capture"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
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
    const supabase = getSupabaseOrNull();

    async function checkAndRoute() {
      const inOnboarding = segments[0] === 'onboarding';
      let signedIn = false;
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        signedIn = !!data.session;
      } else if (IS_DEMO_MODE) {
        signedIn = !!(await getAuthToken());
      }
      if (!mounted) return;
      if (!signedIn && !inOnboarding) router.replace('/onboarding');
      setBootstrapped(true);
    }

    void checkAndRoute();

    if (!supabase) return () => {
      mounted = false;
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') router.replace('/onboarding');
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // Intentionally run once on mount; auth state listener handles updates.
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
