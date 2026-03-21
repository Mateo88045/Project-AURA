import type { Context, Next } from 'hono';
import { env } from '../env.js';

export type AuraVariables = {
  userId: string;
};

/**
 * Dev auth: Authorization: Bearer <AURA_API_KEY>
 * Optional header X-Dev-User-Id overrides user id.
 * TODO: Supabase — verify JWT and map to users.id
 */
export async function devAuth(c: Context<{ Variables: AuraVariables }>, next: Next) {
  const auth = c.req.header('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

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
