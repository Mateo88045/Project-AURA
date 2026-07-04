/**
 * Chronos AI API client. The Gemini/Claude keys stay server-side (apps/api).
 * Resolution order for the base URL:
 *   1. EXPO_PUBLIC_AURA_API_URL  (set in .env / EAS for production)
 *   2. app.json `extra.auraApiUrl` (baked into the binary)
 *   3. local dev default (http://127.0.0.1:8787)
 */
import Constants from 'expo-constants';
import { supabase } from '@chronos/shared/supabase';

const DEFAULT_DEV_API = 'http://127.0.0.1:8787';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  auraApiUrl?: string;
  auraApiKey?: string;
};

export function getAuraApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_AURA_API_URL ?? extra.auraApiUrl ?? DEFAULT_DEV_API;
}

/**
 * Real users: sends the live Supabase session JWT, which apps/api verifies
 * server-side — the server derives identity from the verified token, never
 * from a header. Guest mode (no Supabase session): falls back to the shared
 * dev/guest key, which the server only ever honors for the guest-mode id.
 */
export async function getAuraApiHeaders(userId: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
    return headers;
  }

  const key = process.env.EXPO_PUBLIC_AURA_API_KEY ?? extra.auraApiKey;
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }
  headers['X-Dev-User-Id'] = userId;
  return headers;
}
