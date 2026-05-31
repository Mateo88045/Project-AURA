// /packages/shared/supabase.ts
// Mobile Supabase singleton. The app imports `{ supabase }` directly; the
// AsyncStorage adapter persists the auth session across launches. URL + anon
// key come from EXPO_PUBLIC_* env vars (see apps/mobile/.env).

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export type { Database, Json } from './supabase/database.types';

// Prefer EXPO_PUBLIC_* env vars (set in apps/mobile/.env or EAS), but fall back
// to the public values baked into app.json `extra` so the app connects out of
// the box without a local .env. Both the URL and the publishable/anon key are
// public client credentials — safe to ship in the binary.
const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabasePublishableKey ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing Supabase URL or key. Set EXPO_PUBLIC_SUPABASE_URL / ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY, or app.json extra.supabaseUrl / ' +
      'extra.supabasePublishableKey.',
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // RN does not handle URL session detection
    },
  },
);
