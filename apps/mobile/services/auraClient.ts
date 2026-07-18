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
  // `??` only falls through on null/undefined, not on '' — and app.json ships
  // `extra.auraApiUrl: ""` until a real API URL is configured, so an explicit
  // empty-string check is required or the chain "resolves" to a relative,
  // unreachable URL instead of the local dev default.
  return (
    process.env.EXPO_PUBLIC_AURA_API_URL ||
    extra.auraApiUrl ||
    DEFAULT_DEV_API
  );
}

/**
 * Auth headers for the AI API.
 *
 * Preferred: the caller's Supabase session JWT — the server verifies it and
 * derives the user id from the token, so identity can't be forged. The static
 * dev key + X-Dev-User-Id pair is only a fallback for local dev against an
 * apps/api instance that has no Supabase configured; the production server
 * rejects it.
 */
export async function getAuraApiHeaders(userId: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
      return headers;
    }
  } catch {
    // No session (guest / signed out) — fall through to the dev key.
  }

  const key = process.env.EXPO_PUBLIC_AURA_API_KEY ?? extra.auraApiKey;
  headers['X-Dev-User-Id'] = userId;
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}
