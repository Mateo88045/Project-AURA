// daily-trigger Edge Function — Pipeline A (Blueprint Section 6.2).
//
// Invoked every 15 minutes by pg_cron (see supabase/migrations/...cron_jobs.sql).
// Finds users whose daily_trigger_time falls in the current 15-minute window,
// then runs the full pipeline for each:
//   Fetch → Normalize → Grade → Schedule → Shadow Draft → Push Notify
//
// Fully wired: Supabase reads/writes, dedup, push notification.
// Stubbed (sharp signatures): Google/Canvas fetch, deterministic scheduler, Gemini grader.

// @ts-ignore — Deno-only HTTP module
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseAdmin, validateCronAuth, type Database } from '../_shared/supabaseAdmin.ts';
import { gradeTaskBatch, type GraderResult } from '../_shared/grader.ts';
import { notifyScheduleReady, type ExpoPushToken } from '../_shared/pushSender.ts';

type ConnectionRow = Database['public']['Tables']['connections']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type BlockInsert = Database['public']['Tables']['scheduled_blocks']['Insert'];

interface RawAssignment {
  platform: 'google_classroom' | 'canvas';
  externalId: string;
  title: string;
  subject: string;
  dueDate: string; // ISO 8601
  description?: string;
}

interface ScheduledChunk {
  taskId: string;
  startTime: string;
  endTime: string;
  day: string;
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
    .select('id, timezone, push_token')
    .eq('id', userId)
    .single();
  if (userErr || !user) throw new Error(`user ${userId} not found: ${userErr?.message}`);

  const { data: connections, error: connErr } = await supabase
    .from('connections')
    .select('platform, oauth_token, refresh_token, canvas_api_token, canvas_base_url')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (connErr) throw new Error(`connections query: ${connErr.message}`);
  if (!connections?.length) {
    return { userId, newTasks: 0, scheduledBlocks: 0 };
  }

  // ── 2. Fetch raw assignments from each platform ─────────────────────────
  const rawAssignments: RawAssignment[] = [];
  for (const conn of connections as ConnectionRow[]) {
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

  if (newAssignments.length === 0) {
    return { userId, newTasks: 0, scheduledBlocks: 0 };
  }

  // ── 4. Grade via Gemini Flash ────────────────────────────────────────────
  const graded: GraderResult[] = await gradeTaskBatch(
    newAssignments.map((a) => ({ title: a.title, subject: a.subject, description: a.description })),
    userId,
  );

  // ── 5. Insert graded tasks ──────────────────────────────────────────────
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
    .select('id, title');
  if (insertErr) throw new Error(`task insert: ${insertErr.message}`);

  // ── 6. Deterministic scheduler — pure TS, NEVER an LLM ─────────────────
  const scheduledChunks = await runScheduler(userId, insertedTasks ?? []);

  // ── 7. Persist shadow blocks ────────────────────────────────────────────
  if (scheduledChunks.length > 0) {
    const blocksToInsert: BlockInsert[] = scheduledChunks.map((c) => ({
      user_id: userId,
      task_id: c.taskId,
      start_time: c.startTime,
      end_time: c.endTime,
      status: 'shadow',
      day: c.day,
    }));
    const { error: blockErr } = await supabase.from('scheduled_blocks').insert(blocksToInsert);
    if (blockErr) throw new Error(`block insert: ${blockErr.message}`);
  }

  // ── 8. Push notification (best-effort) ──────────────────────────────────
  if (user.push_token) {
    try {
      await notifyScheduleReady(user.push_token as ExpoPushToken, scheduledChunks.length);
    } catch (err) {
      console.error(`[daily-trigger] push failed for ${userId}:`, err);
    }
  }

  return { userId, newTasks: insertedTasks?.length ?? 0, scheduledBlocks: scheduledChunks.length };
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

/**
 * TODO: implement deterministic greedy scheduler (Blueprint Section 6.4).
 * MUST be pure TypeScript — NEVER call an LLM here.
 * Algorithm:
 *   1. Load user's fixed_events + guardrails
 *   2. Build free-time slots for the next N days
 *   3. Sort tasks by (due_date asc, difficulty desc)
 *   4. Greedily fit each task into the earliest slot that holds estimated_minutes
 *   5. Chunk multi-hour tasks across multiple days if needed
 */
async function runScheduler(
  _userId: string,
  _tasks: Array<{ id: string; title: string }>,
): Promise<ScheduledChunk[]> {
  console.warn('[daily-trigger] runScheduler stub — returning []');
  return [];
}
