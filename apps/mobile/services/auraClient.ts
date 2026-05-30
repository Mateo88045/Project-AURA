/**
 * Aura HTTP API client (dev: local Node server). Keys stay server-side.
 * Set EXPO_PUBLIC_AURA_API_URL (e.g. http://127.0.0.1:8787) and optional EXPO_PUBLIC_AURA_API_KEY.
 */
const DEFAULT_DEV_API = 'http://127.0.0.1:8787';

export function getAuraApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_AURA_API_URL ?? DEFAULT_DEV_API;
}

export function getAuraApiHeaders(userId: string): Record<string, string> {
  const key = process.env.EXPO_PUBLIC_AURA_API_KEY;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Dev-User-Id': userId,
  };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}
