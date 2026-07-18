// Shadow-schedule runner — the I/O wrapper around the pure scheduler.
// Loads a user's open tasks, fixed events, guardrails, and approved blocks,
// replaces their shadow blocks for the next `horizonDays`, and returns what
// was placed. Used by the daily-trigger pipeline (step 6–7).

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import type { Database } from './supabaseAdmin.ts';
import {
  addDays,
  hhmmToMinutes,
  localDayKey,
  localMinutesToUtcIso,
  schedule,
  utcIsoToLocalMinutes,
  type BusyRange,
  type SchedulerGuardrail,
  type SchedulerTask,
} from './scheduler.ts';

export interface ReplanResult {
  scheduledBlockCount: number;
  scheduledTaskIds: string[];
  overloadedTaskIds: string[];
}

const HORIZON_DAYS = 7;
const MIN_PLACEABLE_MIN = 5;

/** Weekday (0=Sun..6=Sat) of a local YYYY-MM-DD calendar date. */
function weekdayOf(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export async function replanShadowSchedule(
  supabase: SupabaseClient<Database>,
  userId: string,
  timezone: string,
): Promise<ReplanResult> {
  const tz = timezone || 'America/New_York';
  const today = localDayKey(new Date(), tz);
  const dayKeys = Array.from({ length: HORIZON_DAYS }, (_, i) => addDays(today, i));

  // ── Load inputs in parallel ──────────────────────────────────────────────
  const [tasksRes, eventsRes, guardrailsRes, blocksRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, due_date, difficulty, estimated_minutes')
      .eq('user_id', userId)
      .in('status', ['pending', 'scheduled']),
    supabase
      .from('fixed_events')
      .select('start_time, end_time, days_of_week')
      .eq('user_id', userId),
    supabase
      .from('guardrails')
      .select('rule_type, value, active')
      .eq('user_id', userId)
      .eq('active', true),
    supabase
      .from('scheduled_blocks')
      .select('id, task_id, start_time, end_time, status, day')
      .eq('user_id', userId)
      .in('day', dayKeys),
  ]);

  if (tasksRes.error) throw new Error(`tasks query: ${tasksRes.error.message}`);
  if (eventsRes.error) throw new Error(`fixed_events query: ${eventsRes.error.message}`);
  if (guardrailsRes.error) throw new Error(`guardrails query: ${guardrailsRes.error.message}`);
  if (blocksRes.error) throw new Error(`blocks query: ${blocksRes.error.message}`);

  const openTasks = tasksRes.data ?? [];
  if (openTasks.length === 0) {
    return { scheduledBlockCount: 0, scheduledTaskIds: [], overloadedTaskIds: [] };
  }

  // ── Busy time: fixed events by weekday + approved blocks ─────────────────
  const busyByDay: Record<string, BusyRange[]> = {};
  for (const day of dayKeys) busyByDay[day] = [];

  // Today's elapsed hours are gone — block everything up to "now" so the plan
  // never schedules work in the past.
  const nowLocal = utcIsoToLocalMinutes(new Date().toISOString(), tz);
  if (busyByDay[nowLocal.day] && nowLocal.minutes > 0) {
    busyByDay[nowLocal.day].push({ startMinute: 0, endMinute: nowLocal.minutes });
  }

  // deno-lint-ignore no-explicit-any
  for (const event of (eventsRes.data ?? []) as any[]) {
    const startMinute = hhmmToMinutes(String(event.start_time).slice(0, 5));
    const endMinute = hhmmToMinutes(String(event.end_time).slice(0, 5));
    if (endMinute <= startMinute) continue;
    const dows: number[] = event.days_of_week ?? [];
    for (const day of dayKeys) {
      if (dows.includes(weekdayOf(day))) {
        busyByDay[day].push({ startMinute, endMinute });
      }
    }
  }

  const approvedMinutesByTask = new Map<string, number>();
  const shadowBlockIds: string[] = [];
  for (const block of blocksRes.data ?? []) {
    if (block.status === 'shadow') {
      shadowBlockIds.push(block.id);
      continue; // being replaced — not busy time
    }
    const start = utcIsoToLocalMinutes(block.start_time, tz);
    const end = utcIsoToLocalMinutes(block.end_time, tz);
    if (busyByDay[start.day]) {
      const endMinute = start.day === end.day ? end.minutes : 24 * 60;
      busyByDay[start.day].push({ startMinute: start.minutes, endMinute });
    }
    if (block.status === 'approved' && block.task_id) {
      const mins = Math.max(
        0,
        (new Date(block.end_time).getTime() - new Date(block.start_time).getTime()) / 60_000,
      );
      approvedMinutesByTask.set(
        block.task_id,
        (approvedMinutesByTask.get(block.task_id) ?? 0) + mins,
      );
    }
  }

  // ── Order tasks (due asc, difficulty desc) and compute remaining need ────
  const ordered = [...openTasks].sort((a, b) => {
    if (a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1;
    return b.difficulty - a.difficulty;
  });

  const schedulerTasks: SchedulerTask[] = [];
  for (const task of ordered) {
    const remaining =
      task.estimated_minutes - (approvedMinutesByTask.get(task.id) ?? 0);
    if (remaining < MIN_PLACEABLE_MIN) continue; // effectively already planned
    const dueDay = localDayKey(new Date(task.due_date), tz);
    schedulerTasks.push({
      id: task.id,
      estimatedMinutes: Math.round(remaining),
      // Overdue work is still schedulable — treat it as due today.
      dueDay: dueDay < today ? today : dueDay,
    });
  }

  const guardrails: SchedulerGuardrail[] = (guardrailsRes.data ?? []).map((g) => ({
    ruleType: g.rule_type as SchedulerGuardrail['ruleType'],
    value: (g.value ?? {}) as Record<string, unknown>,
    active: g.active,
  }));

  const { scheduledChunks, overloadedTaskIds } = schedule({
    tasks: schedulerTasks,
    busyByDay,
    dayKeys,
    guardrails,
  });

  // ── Replace shadow blocks ────────────────────────────────────────────────
  if (shadowBlockIds.length > 0) {
    const { error: deleteErr } = await supabase
      .from('scheduled_blocks')
      .delete()
      .in('id', shadowBlockIds);
    if (deleteErr) throw new Error(`shadow delete: ${deleteErr.message}`);
  }

  if (scheduledChunks.length > 0) {
    const { error: insertErr } = await supabase.from('scheduled_blocks').insert(
      scheduledChunks.map((chunk) => ({
        user_id: userId,
        task_id: chunk.taskId,
        start_time: localMinutesToUtcIso(chunk.day, chunk.startMinute, tz),
        end_time: localMinutesToUtcIso(chunk.day, chunk.endMinute, tz),
        status: 'shadow' as const,
        day: chunk.day,
      })),
    );
    if (insertErr) throw new Error(`shadow insert: ${insertErr.message}`);
  }

  // ── Flip placed tasks to 'scheduled' ─────────────────────────────────────
  const scheduledTaskIds = [...new Set(scheduledChunks.map((c) => c.taskId))];
  if (scheduledTaskIds.length > 0) {
    const { error: statusErr } = await supabase
      .from('tasks')
      .update({ status: 'scheduled' })
      .in('id', scheduledTaskIds)
      .in('status', ['pending']);
    if (statusErr) console.error('[scheduleRunner] status update failed:', statusErr.message);
  }

  return {
    scheduledBlockCount: scheduledChunks.length,
    scheduledTaskIds,
    overloadedTaskIds,
  };
}
