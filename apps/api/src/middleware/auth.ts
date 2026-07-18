import type { Context, Next } from 'hono';
import { env } from '../env.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

export type ApiVariables = {
  userId: string;
};

/**
 * API auth.
 *
 * Production mode (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set): the client
 * sends its Supabase session JWT as `Authorization: Bearer <jwt>`. We verify
 * it against Supabase Auth and derive the user id from the token — client
 * headers are never trusted for identity. This is what stops an attacker who
 * extracts anything from the app bundle from impersonating another user or
 * running up the AI bill under fake user ids.
 *
 * Dev modes (no Supabase env):
 *   - AURA_API_KEY set → shared-key auth, X-Dev-User-Id picks the user.
 *   - nothing set      → open local mode with DEV_USER_ID.
 */
export async function apiAuth(c: Context<{ Variables: ApiVariables }>, next: Next) {
  const auth = c.req.header('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  const supabaseConfigured = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);

  if (supabaseConfigured) {
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    try {
      const { data, error } = await getSupabaseAdmin().auth.getUser(token);
      if (error || !data?.user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      c.set('userId', data.user.id);
    } catch (err) {
      console.error('[apiAuth] token verification failed', err);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
    return;
  }

  if (!env.auraApiKey) {
    // Local open mode — still attach a user id for logging
    c.set('userId', c.req.header('x-dev-user-id') ?? env.devUserId);
    await next();
    return;
  }

  if (token !== env.auraApiKey) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('userId', c.req.header('x-dev-user-id') ?? env.devUserId);
  await next();
}

/** @deprecated Renamed — kept so older imports keep compiling. */
export const devAuth = apiAuth;
