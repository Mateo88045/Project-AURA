/**
 * Chronos AI API client. The Gemini/Claude keys stay server-side (apps/api).
 * Resolution order for the base URL:
 *   1. EXPO_PUBLIC_AURA_API_URL  (set in .env / EAS for production)
 *   2. app.json `extra.auraApiUrl` (baked into the binary)
 *   3. local dev default (http://127.0.0.1:8787)
 */
import Constants from 'expo-constants';

const DEFAULT_DEV_API = 'http://127.0.0.1:8787';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  auraApiUrl?: string;
  auraApiKey?: string;
};

export function getAuraApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_AURA_API_URL ?? extra.auraApiUrl ?? DEFAULT_DEV_API;
}

export function getAuraApiHeaders(userId: string): Record<string, string> {
  const key = process.env.EXPO_PUBLIC_AURA_API_KEY ?? extra.auraApiKey;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Dev-User-Id': userId,
  };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}
