// delete-account Edge Function.
// Invoked from the app (Settings → Delete account) with the user's JWT.
// Required by App Store Guideline 5.1.1(v): apps with account creation must let
// users delete their account from within the app.
//
// Deletes the auth user with the service role; the public.users row and all
// child rows (tasks, scheduled_blocks, guardrails, conversations, connections,
// task_completions, fixed_events) cascade via their ON DELETE CASCADE FKs.

// @ts-ignore — Deno-only HTTP module
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return json({ error: 'unauthorized' }, 401);
  }

  try {
    const supabase = getSupabaseAdmin();

    // Resolve the caller's user id from their JWT.
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ error: 'invalid_token' }, 401);
    }
    const userId = userData.user.id;

    // Best-effort explicit cleanup in case any FK isn't set to cascade.
    await supabase.from('tasks').delete().eq('user_id', userId);
    await supabase.from('scheduled_blocks').delete().eq('user_id', userId);
    await supabase.from('guardrails').delete().eq('user_id', userId);
    await supabase.from('conversations').delete().eq('user_id', userId);
    await supabase.from('connections').delete().eq('user_id', userId);
    await supabase.from('fixed_events').delete().eq('user_id', userId);
    await supabase.from('task_completions').delete().eq('user_id', userId);

    // Delete the auth user (cascades public.users).
    const { error: delErr } = await supabase.auth.admin.deleteUser(userId);
    if (delErr) {
      return json({ error: delErr.message }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'delete_failed' }, 500);
  }
});
