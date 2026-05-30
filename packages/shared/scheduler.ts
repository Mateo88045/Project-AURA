// ============================================================================
// Chronos — Deterministic Scheduling Engine
//
// Per blueprint §6.4 this is PURE TYPESCRIPT. Never calls an LLM. Given a set
// of tasks, fixed events, and guardrails, it greedily fits work into the
// largest available slots, chunking long tasks across days and surfacing any
// task that won't fit as "overloaded."
//
// Input contract:
//   - tasks: open Tasks ordered by importance (caller picks the priority rule)
//   - fixedEventsByDay: minute ranges already blocked out per day
//   - dayKeys: which YYYY-MM-DD days are eligible for scheduling
//   - guardrails: hard rules the scheduler will never break
// Output contract:
//   - scheduledChunks: every minute that was placed
//   - overloadedTasks: tasks the scheduler could not fit in full
// ============================================================================

import type {
  Task,
  FixedEvent,
  Guardrail,
  ScheduledChunk,
  ScheduleResult,
} from './types';

interface SchedulerInput {
  tasks: Task[];
  fixedEventsByDay: Record<string, FixedEvent[]>;
  dayKeys: string[];
  guardrails: Guardrail[];
}

interface MinuteRange {
  startMinute: number; // minutes since 00:00 local
  endMinute: number;
}

const DAY_START = 6 * 60; // 06:00
const DAY_END = 23 * 60; // 23:00 — guardrail can pull this earlier
const MIN_CHUNK_MIN = 25;
const MAX_CHUNK_MIN = 75;

export function schedule(input: SchedulerInput): ScheduleResult {
  const noWorkAfter = findNoWorkAfter(input.guardrails);
  const bufferMin = findBufferAfterEvent(input.guardrails);
  const maxPerDay = findMaxHoursPerDay(input.guardrails);

  // Per-day budget remaining (minutes already scheduled by us)
  const usedByDay: Record<string, number> = {};
  for (const k of input.dayKeys) usedByDay[k] = 0;

  // Precompute free slots per day, sorted longest first.
  const slotsByDay: Record<string, MinuteRange[]> = {};
  for (const day of input.dayKeys) {
    const fixed = input.fixedEventsByDay[day] ?? [];
    const dayEnd = noWorkAfter ?? DAY_END;
    slotsByDay[day] = computeFreeSlots(fixed, DAY_START, dayEnd, bufferMin);
  }

  const scheduledChunks: ScheduledChunk[] = [];
  const overloadedTasks: Task[] = [];

  for (const task of input.tasks) {
    let remaining = task.estimatedMinutes;

    for (const day of input.dayKeys) {
      if (remaining <= 0) break;
      const dayCapacityLeft = (maxPerDay ?? Infinity) - (usedByDay[day] ?? 0);
      if (dayCapacityLeft <= 0) continue;

      // Sort slots longest first each iteration so picks stay fresh.
      const slots = slotsByDay[day]
        .filter((s) => s.endMinute - s.startMinute >= MIN_CHUNK_MIN)
        .sort((a, b) => b.endMinute - b.startMinute - (a.endMinute - a.startMinute));

      for (const slot of slots) {
        if (remaining <= 0) break;
        const slotMin = slot.endMinute - slot.startMinute;
        const chunkMin = Math.min(
          slotMin,
          remaining,
          MAX_CHUNK_MIN,
          dayCapacityLeft - (usedByDay[day] - (usedByDay[day] ?? 0)),
        );
        if (chunkMin < MIN_CHUNK_MIN) continue;

        const start = slot.startMinute;
        const end = start + chunkMin;
        scheduledChunks.push({
          taskId: task.id,
          startTime: minutesToIso(day, start),
          endTime: minutesToIso(day, end),
          day,
          chunkMinutes: chunkMin,
        });
        remaining -= chunkMin;
        usedByDay[day] += chunkMin;
        // Shrink the slot we just consumed.
        slot.startMinute = end;
      }
    }

    if (remaining > 0) overloadedTasks.push(task);
  }

  return { scheduledChunks, overloadedTasks };
}

// ---------------------------------------------------------------------------
// Helpers — small, pure, and individually testable.
// ---------------------------------------------------------------------------

export function computeFreeSlots(
  fixedEvents: FixedEvent[],
  dayStart: number,
  dayEnd: number,
  bufferMin: number,
): MinuteRange[] {
  if (dayEnd <= dayStart) return [];
  const ranges = fixedEvents
    .map((e) => ({
      startMinute: Math.max(0, hhmmToMinutes(e.startTime) - bufferMin),
      endMinute: Math.min(24 * 60, hhmmToMinutes(e.endTime) + bufferMin),
    }))
    .sort((a, b) => a.startMinute - b.startMinute);

  const free: MinuteRange[] = [];
  let cursor = dayStart;
  for (const r of ranges) {
    if (r.startMinute > cursor) free.push({ startMinute: cursor, endMinute: Math.min(r.startMinute, dayEnd) });
    cursor = Math.max(cursor, r.endMinute);
    if (cursor >= dayEnd) break;
  }
  if (cursor < dayEnd) free.push({ startMinute: cursor, endMinute: dayEnd });
  return free.filter((r) => r.endMinute > r.startMinute);
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

export function minutesToIso(day: string, minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

function findNoWorkAfter(guardrails: Guardrail[]): number | null {
  const g = guardrails.find((x) => x.ruleType === 'no_work_after' && x.active);
  if (!g) return null;
  const time = (g.value as { time?: string }).time;
  return time ? hhmmToMinutes(time) : null;
}

function findBufferAfterEvent(guardrails: Guardrail[]): number {
  const g = guardrails.find((x) => x.ruleType === 'buffer_after_event' && x.active);
  if (!g) return 0;
  return (g.value as { minutes?: number }).minutes ?? 0;
}

function findMaxHoursPerDay(guardrails: Guardrail[]): number | null {
  const g = guardrails.find((x) => x.ruleType === 'max_hours_per_day' && x.active);
  if (!g) return null;
  const hours = (g.value as { hours?: number }).hours;
  return hours ? hours * 60 : null;
}
