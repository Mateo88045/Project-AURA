// /packages/shared/supabase.ts
// Mobile Supabase singleton. The app imports `{ supabase }` directly; the
// AsyncStorage adapter persists the auth session across launches. URL + anon
// key come from EXPO_PUBLIC_* env vars (see apps/mobile/.env).

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type { Database, Json } from './supabase/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in values.',
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
