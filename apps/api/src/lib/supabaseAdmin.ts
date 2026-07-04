import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env.js';

/**
 * Service-role Supabase client — bypasses RLS. Server-only; never expose this
 * key or client to the mobile app. Used for writes that must not be
 * reachable from a client session (e.g. subscription_status, written only by
 * the RevenueCat webhook handler).
 */
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}
