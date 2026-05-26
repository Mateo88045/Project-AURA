import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AppState } from 'react-native';
import { createAuraClient, AuraSupabase } from '@aura/shared/supabase';

function readExtra(key: string): string | undefined {
  return (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.[key] as
    | string
    | undefined;
}

export const SUPABASE_URL: string =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? readExtra('supabaseUrl') ?? '';

export const SUPABASE_PUBLISHABLE_KEY: string =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  readExtra('supabasePublishableKey') ??
  '';

export const IS_SUPABASE_CONFIGURED: boolean =
  SUPABASE_URL.length > 0 && SUPABASE_PUBLISHABLE_KEY.length > 0;

let _client: AuraSupabase | null = null;

export function getSupabase(): AuraSupabase {
  if (_client) return _client;
  _client = createAuraClient({
    url: SUPABASE_URL,
    publishableKey: SUPABASE_PUBLISHABLE_KEY,
    storage: AsyncStorage,
  });
  // Keep tokens refreshed while the app is in foreground. Per Supabase RN docs:
  // https://supabase.com/docs/reference/javascript/initializing
  AppState.addEventListener('change', (state) => {
    if (!_client) return;
    if (state === 'active') {
      _client.auth.startAutoRefresh();
    } else {
      _client.auth.stopAutoRefresh();
    }
  });
  return _client;
}

/**
 * Safe variant: returns `null` when the project isn't configured. Hooks use
 * this to fall back to demo data when Supabase isn't wired up.
 */
export function getSupabaseOrNull(): AuraSupabase | null {
  if (!IS_SUPABASE_CONFIGURED) return null;
  return getSupabase();
}
