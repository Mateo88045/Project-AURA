import { supabase } from '@chronos/shared/supabase';
import type { FixedEvent, Guardrail, GuardrailRuleType } from '@chronos/shared/types';
import { hhmmToMinutes, type MinuteRange } from '@chronos/shared/scheduler';

/**
 * The slice of a user's schedule the copilot's guardrail gate needs to
 * validate a proposed time change: their guardrails, the fixed events that
 * fall on the affected days, and the ranges already occupied by OTHER tasks'
 * blocks on those days.
 */
export interface SchedulingContext {
  fixedEventsByDay: Record<string, FixedEvent[]>;
  guardrails: Guardrail[];
  otherBlocksByDay: Record<string, MinuteRange[]>;
}

function isGuardrailRuleType(v: unknown): v is GuardrailRuleType {
  return v === 'no_work_after' || v === 'buffer_after_event' || v === 'max_hours_per_day';
}

/**
 * Loads the scheduling context for a set of YYYY-MM-DD days.
 *
 * `excludeTaskId` drops the task being moved from `otherBlocksByDay` so a
 * reschedule/spread doesn't register as conflicting with its own current
 * blocks.
 */
export async function loadSchedulingContext(
  userId: string,
  days: string[],
  opts: { excludeTaskId?: string } = {},
): Promise<SchedulingContext> {
  const uniqueDays = [...new Set(days)].filter((d) => d.length === 10);

  const [guardrailsRes, eventsRes, blocksRes] = await Promise.all([
    supabase.from('guardrails').select('*').eq('user_id', userId).eq('active', true),
    supabase.from('fixed_events').select('*').eq('user_id', userId),
    supabase
      .from('scheduled_blocks')
      .select('*')
      .eq('user_id', userId)
      .in('day', uniqueDays)
      .in('status', ['shadow', 'approved']),
  ]);

  if (guardrailsRes.error) throw guardrailsRes.error;
  if (eventsRes.error) throw eventsRes.error;
  if (blocksRes.error) throw blocksRes.error;

  const guardrails: Guardrail[] = (guardrailsRes.data ?? [])
    .filter((row) => isGuardrailRuleType(row.rule_type))
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      ruleType: row.rule_type as GuardrailRuleType,
      value: (row.value ?? {}) as Record<string, unknown>,
      active: row.active,
      createdAt: row.created_at,
    }));

  const fixedEventsByDay: Record<string, FixedEvent[]> = {};
  for (const day of uniqueDays) {
    const dayOfWeek = new Date(day).getDay();
    fixedEventsByDay[day] = (eventsRes.data ?? [])
      .filter((row) => (row.days_of_week ?? []).includes(dayOfWeek))
      .map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        startTime: row.start_time,
        endTime: row.end_time,
        daysOfWeek: row.days_of_week ?? [],
        recurrenceRule: row.recurrence_rule ?? undefined,
        color: row.color ?? undefined,
        createdAt: row.created_at,
      }));
  }

  const otherBlocksByDay: Record<string, MinuteRange[]> = {};
  for (const day of uniqueDays) otherBlocksByDay[day] = [];
  for (const row of blocksRes.data ?? []) {
    if (opts.excludeTaskId && row.task_id === opts.excludeTaskId) continue;
    const day = row.day;
    if (!otherBlocksByDay[day]) otherBlocksByDay[day] = [];
    otherBlocksByDay[day].push({
      startMinute: hhmmToMinutes(row.start_time.slice(11, 16)),
      endMinute: hhmmToMinutes(row.end_time.slice(11, 16)),
    });
  }

  return { fixedEventsByDay, guardrails, otherBlocksByDay };
}
