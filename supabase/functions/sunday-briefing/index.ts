// sunday-briefing Edge Function.
// Invoked weekly via pg_cron (Sunday 18:00 UTC).
// Aggregates the past week's task_completions, counts upcoming tasks, sends per-user push.

// @ts-ignore — Deno-only HTTP module
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseAdmin, validateCronAuth } from '../_shared/supabaseAdmin.ts';
import { notifySundayBriefing, type ExpoPushToken } from '../_shared/pushSender.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (!validateCronAuth(req)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);

    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('id, push_token, timezone')
      .not('push_token', 'is', null);
    if (userErr) throw new Error(`users query: ${userErr.message}`);
    if (!users?.length) {
      return jsonResponse({ status: 'no_recipients', sent: 0 });
    }

    let sent = 0;
    let skipped = 0;

    // Per-user processing in parallel — each call is cheap (one COUNT + one HTTP push)
    await Promise.all(
      users.map(async (user) => {
        try {
          // Past-week completions for velocity calibration
          const { data: completions } = await supabase
            .from('task_completions')
            .select('estimated_minutes, actual_minutes')
            .eq('user_id', user.id)
            .gte('completed_at', weekStart.toISOString());

          // Upcoming task count
          const { count: upcomingCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .in('status', ['pending', 'scheduled'])
            .lte('due_date', weekEnd.toISOString());

          if (!upcomingCount || upcomingCount === 0) {
            skipped++;
            return;
          }

          // Used by the scheduler to recalibrate; logged for now.
          const velocityRatio = computeVelocityRatio(completions ?? []);
          if (velocityRatio !== null) {
            console.log(`[briefing] user ${user.id} velocity: ${velocityRatio.toFixed(2)}`);
          }

          // TODO: feed completions + upcomingCount to Claude Sonnet for a personalised
          // 1-paragraph briefing. For now send the deterministic count notification.
          if (!user.push_token) {
            skipped++;
            return;
          }
          await notifySundayBriefing(user.push_token as ExpoPushToken, upcomingCount);
          sent++;
        } catch (err) {
          console.error(`[briefing] user ${user.id} failed:`, err);
        }
      }),
    );

    return jsonResponse({ status: 'complete', sent, skipped, total: users.length });
  } catch (err) {
    console.error('[sunday-briefing] fatal:', err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Average ratio of actual to estimated minutes across the week.
 * <1 means the student finished faster than the grader predicted;
 * >1 means tasks took longer. Used by the scheduler to recalibrate.
 */
function computeVelocityRatio(
  completions: Array<{ estimated_minutes: number; actual_minutes: number }>,
): number | null {
  if (completions.length === 0) return null;
  const ratios = completions
    .filter((c) => c.estimated_minutes > 0)
    .map((c) => c.actual_minutes / c.estimated_minutes);
  if (ratios.length === 0) return null;
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}
