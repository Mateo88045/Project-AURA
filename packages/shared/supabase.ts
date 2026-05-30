// /packages/shared/supabase.ts
// Real Supabase client factory. The mobile app imports the singleton from
// `apps/mobile/lib/supabase.ts` because the AsyncStorage adapter is a native
// dep that only exists in the mobile workspace. This file exports the types
// and the factory.

import { createClient, SupabaseClient, SupportedStorage } from '@supabase/supabase-js';
import type { Database } from './supabase/database.types';

export type { Database, Json } from './supabase/database.types';
export type ChronosSupabase = SupabaseClient<Database>;

export interface CreateClientOptions {
  url: string;
  publishableKey: string;
  storage: SupportedStorage;
}

export function createChronosClient({
  url,
  publishableKey,
  storage,
}: CreateClientOptions): ChronosSupabase {
  if (!url || !publishableKey) {
    throw new Error(
      '[supabase] Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY — check app.json extras / env.',
    );
  }
  return createClient<Database>(url, publishableKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // RN does not handle URL session detection
      flowType: 'pkce',
    },
    db: { schema: 'public' },
    global: {
      headers: { 'x-application-name': 'chronos-mobile' },
    },
  });
}
