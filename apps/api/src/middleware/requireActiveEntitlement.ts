// Server-side entitlement guard for paid-tier API endpoints (chat, ocr,
// jobs.trigger). The client also gates these via lib/requirePro.ts, but the
// API must enforce independently — a stale client or a forged client could
// otherwise still hit Anthropic/Gemini on a lapsed account.
//
// Reads users.entitlement_status (written by the RevenueCat webhook) and
// refuses with 402 if the user is lapsed. See docs/entitlement-design.md.

import type { Context, Next } from 'hono';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { env } from '../env.js';
import type { ApiVariables } from './auth.js';

export async function requireActiveEntitlement(
  c: Context<{ Variables: ApiVariables }>,
  next: Next,
) {
  // If Supabase isn't wired locally, fall through (dev mode). Production
  // deploys MUST have these set — see apps/api/.env.example.
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    await next();
    return;
  }

  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select('entitlement_status')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[requireActiveEntitlement] read failed', error);
      return c.json({ error: 'Entitlement check failed' }, 500);
    }

    if (data?.entitlement_status === 'lapsed') {
      return c.json(
        { error: 'Subscription required', code: 'lapsed' },
        402,
      );
    }
  } catch (err) {
    console.error('[requireActiveEntitlement]', err);
    return c.json({ error: 'Entitlement check failed' }, 500);
  }

  await next();
}
