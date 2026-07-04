import type { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { env } from '../env.js';

export type ApiVariables = {
  userId: string;
};

/** Stable synthetic id for guest mode. Must match apps/mobile/lib/guest.ts GUEST_USER_ID. */
export const GUEST_USER_ID = 'guest-user';

export type UserVerifier = (token: string) => Promise<{ userId: string } | null>;

function buildSupabaseVerifier(): UserVerifier | null {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return null;
  const client = createClient(env.supabaseUrl, env.supabaseAnonKey);
  return async (token) => {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return null;
    return { userId: data.user.id };
  };
}

/**
 * Verifies the caller's identity from `Authorization: Bearer <token>`.
 *
 * Two paths:
 *  1. A real Supabase session JWT — verified against Supabase Auth
 *     (auth.getUser), userId comes from the verified token's `sub`, never
 *     from a client-supplied header.
 *  2. The shared dev/guest key — only ever authenticates as GUEST_USER_ID or
 *     env.devUserId. A leaked shared key can therefore never be used to
 *     impersonate an arbitrary real student id (the original vulnerability:
 *     `X-Dev-User-Id` was trusted verbatim for any value).
 *
 * `verifyToken` is injectable so tests can simulate Supabase verification
 * without a network call; production use (the `requireAuth` export below)
 * wires up the real Supabase client from env.
 */
export function createAuthMiddleware(
  verifyToken: UserVerifier | null = buildSupabaseVerifier(),
) {
  return async function requireAuth(
    c: Context<{ Variables: ApiVariables }>,
    next: Next,
  ) {
    const auth = c.req.header('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (env.auraApiKey && token === env.auraApiKey) {
      const requestedUserId = c.req.header('x-dev-user-id') ?? env.devUserId;
      if (requestedUserId === GUEST_USER_ID || requestedUserId === env.devUserId) {
        c.set('userId', requestedUserId);
        await next();
        return;
      }
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!verifyToken) {
      return c.json({ error: 'Auth not configured' }, 500);
    }

    const verified = await verifyToken(token);
    if (!verified) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('userId', verified.userId);
    await next();
  };
}

export const requireAuth = createAuthMiddleware();
