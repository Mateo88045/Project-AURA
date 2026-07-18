// daily-trigger Edge Function — Pipeline A (Blueprint Section 6.2).
//
// Invoked every 15 minutes by pg_cron (see supabase/migrations/...cron_jobs.sql).
// Finds users whose daily_trigger_time falls in the current 15-minute window,
// then runs the full pipeline for each:
//   Fetch → Normalize → Grade → Schedule → Shadow Draft → Push Notify
//
// Fully wired: Supabase reads/writes, dedup, deterministic scheduling
// (_shared/scheduleRunner.ts), push notification.
// Stubbed (sharp signatures): Google/Canvas fetch.

// @ts-ignore — Deno-only HTTP module
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseAdmin, validateCronAuth, type Database } from '../_shared/supabaseAdmin.ts';
import { gradeTaskBatch, type GraderResult } from '../_shared/grader.ts';
import { notifyScheduleReady, type ExpoPushToken } from '../_shared/pushSender.ts';
import { replanShadowSchedule } from '../_shared/scheduleRunner.ts';

type ConnectionRow = Database['public']['Tables']['connections']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

interface RawAssignment {
  platform: 'google_classroom' | 'canvas';
  externalId: string;
  title: string;
  subject: string;
  dueDate: string; // ISO 8601
  description?: string;
}

// ─── HTTP entrypoint ───────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Cron auth check
  if (!validateCronAuth(req)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date();

    // ── Find users due in this 15-min window ────────────────────────────────
    const { data: dueUsers, error: dueErr } = await supabase.rpc(
      'users_due_for_daily_trigger',
      { now_utc: now.toISOString() },
    );
    if (dueErr) throw new Error(`dispatcher query: ${dueErr.message}`);
    if (!dueUsers?.length) {
      return jsonResponse({ status: 'no_users_due', dispatched: 0 });
    }

    console.log(`[daily-trigger] processing ${dueUsers.length} users`);

    // Process all users in parallel — bounded by Edge Function wall-clock (50s)
    const results = await Promise.allSettled(
      dueUsers.map((u: { id: string }) => runPipelineForUser(u.id, supabase)),
    );

    const summary = {
      total: dueUsers.length,
      succeeded: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    };

    for (const r of results) {
      if (r.status === 'rejected') console.error('[daily-trigger]', r.reason);
    }

    return jsonResponse({ status: 'complete', ...summary });
  } catch (err) {
    console.error('[daily-trigger] fatal:', err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

// ─── Per-user pipeline ─────────────────────────────────────────────────────
async function runPipelineForUser(
  userId: string,
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<{ userId: string; newTasks: number; scheduledBlocks: number }> {
  // ── 1. Load user + connections ────────────────────────────────────────────
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, timezone, push_token, entitlement_status')
    .eq('id', userId)
    .single();
  if (userErr || !user) throw new Error(`user ${userId} not found: ${userErr?.message}`);

  // ── Entitlement gate (docs/entitlement-design.md — Option A "frozen") ────
  // The dispatcher RPC already filters lapsed users out; this is defense in
  // depth in case the pipeline is invoked directly (manual replay, tests).
  // No fetch, no Gemini grading, no scheduling for lapsed users.
  if (user.entitlement_status === 'lapsed') {
    console.log(`[daily-trigger] skipping lapsed user ${userId}`);
    return { userId, newTasks: 0, scheduledBlocks: 0 };
  }

  const { data: connections, error: connErr } = await supabase
    .from('connections')
    .select('platform, oauth_token, refresh_token, canvas_api_token, canvas_base_url')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (connErr) throw new Error(`connections query: ${connErr.message}`);

  // ── 2. Fetch raw assignments from each platform ─────────────────────────
  // No connections is fine — manual/photo tasks still get scheduled below.
  const rawAssignments: RawAssignment[] = [];
  for (const conn of (connections ?? []) as ConnectionRow[]) {
    try {
      const assignments = await fetchAssignments(conn);
      rawAssignments.push(...assignments);
    } catch (err) {
      console.error(`[daily-trigger] platform fetch failed for ${conn.platform}:`, err);
      // Continue — partial sync beats no sync
    }
  }

  // ── 3. De-dup against existing tasks ────────────────────────────────────
  const externalIds = rawAssignments.map((a) => a.externalId);
  const { data: existing } = await supabase
    .from('tasks')
    .select('external_id, source')
    .eq('user_id', userId)
    .in('external_id', externalIds.length ? externalIds : ['']);

  const knownKeys = new Set((existing ?? []).map((e) => `${e.source}::${e.external_id}`));
  const newAssignments = rawAssignments.filter(
    (a) => !knownKeys.has(`${a.platform}::${a.externalId}`),
  );

  // ── 4–5. Grade via Gemini Flash and insert the new tasks ────────────────
  let insertedCount = 0;
  if (newAssignments.length > 0) {
    const graded: GraderResult[] = await gradeTaskBatch(
      newAssignments.map((a) => ({ title: a.title, subject: a.subject, description: a.description })),
      userId,
    );

    const tasksToInsert: TaskInsert[] = newAssignments.map((a, i) => {
      const g = graded[i];
      if (!g) throw new Error(`grader returned no result at index ${i}`);
      return {
        user_id: userId,
        title: a.title,
        subject: a.subject,
        source: a.platform,
        external_id: a.externalId,
        due_date: a.dueDate,
        difficulty: g.difficulty,
        estimated_minutes: g.estimatedMinutes,
        task_type: g.taskType,
        status: 'pending',
        description: a.description ?? null,
      };
    });

    const { data: insertedTasks, error: insertErr } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select('id');
    if (insertErr) throw new Error(`task insert: ${insertErr.message}`);
    insertedCount = insertedTasks?.length ?? 0;
  }

  // ── 6–7. Deterministic scheduler (pure TS, NEVER an LLM) + shadow draft ──
  // Runs over ALL open tasks — platform, manual, and photo alike — so the
  // nightly plan reflects everything, not just tonight's fetch.
  const replan = await replanShadowSchedule(supabase, userId, user.timezone);

  // ── 8. Push notification (best-effort) ──────────────────────────────────
  if (user.push_token && replan.scheduledBlockCount > 0) {
    try {
      await notifyScheduleReady(user.push_token as ExpoPushToken, replan.scheduledBlockCount);
    } catch (err) {
      console.error(`[daily-trigger] push failed for ${userId}:`, err);
    }
  }

  return { userId, newTasks: insertedCount, scheduledBlocks: replan.scheduledBlockCount };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Stubs to be replaced ──────────────────────────────────────────────────

/**
 * TODO: implement Google Classroom + Canvas API clients.
 * Google: classroom.googleapis.com/v1/courses/{id}/courseWork using OAuth refresh_token.
 * Canvas: GET {canvas_base_url}/api/v1/courses/:id/assignments with canvas_api_token bearer.
 */
async function fetchAssignments(conn: ConnectionRow): Promise<RawAssignment[]> {
  console.warn(`[daily-trigger] fetchAssignments stub — ${conn.platform}`);
  return [];
}
