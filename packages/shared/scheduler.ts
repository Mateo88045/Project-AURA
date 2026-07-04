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

export interface MinuteRange {
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

// ============================================================================
// Proposed-placement validation (Copilot Pipeline C guardrail gate)
//
// The conversational copilot proposes concrete time slots for a task
// ("move my essay to 9:30pm"). Those proposals must pass through the SAME
// rules the deterministic engine above enforces for its own placements —
// otherwise a copilot-driven reschedule could silently violate a guardrail
// (e.g. "no deep work after 9pm") or land on top of a fixed event.
//
// These functions are pure: the caller (apps/mobile copilot executor) loads
// the user's guardrails, fixed events, and existing blocks from Supabase and
// passes them in. No LLM, no I/O — same contract as schedule().
// ============================================================================

/** A concrete slot the copilot wants to place. Local ISO 8601 (YYYY-MM-DDTHH:MM). */
export interface ProposedBlock {
  startTime: string;
  endTime: string;
}

export type SlotViolationCode =
  | 'invalid_range'
  | 'no_work_after'
  | 'outside_day_hours'
  | 'fixed_event_conflict'
  | 'max_hours_per_day';

export interface SlotViolation {
  code: SlotViolationCode;
  day: string; // YYYY-MM-DD
  /** Human-readable, safe to surface directly to the student. */
  message: string;
}

export interface ProposedPlacementInput {
  /** The block(s) the copilot wants to place for a SINGLE task. */
  proposed: ProposedBlock[];
  /** Fixed events per day (YYYY-MM-DD → events). Buffer guardrail applies to these. */
  fixedEventsByDay: Record<string, FixedEvent[]>;
  guardrails: Guardrail[];
  /**
   * Ranges already occupied by OTHER tasks' scheduled blocks, per day. The
   * block(s) being moved must be excluded by the caller so a task doesn't
   * "conflict with itself." No buffer is applied to these.
   */
  otherBlocksByDay?: Record<string, MinuteRange[]>;
  /**
   * Total minutes the task needs. Defaults to the summed duration of `proposed`.
   * Used only by suggestValidPlacement when asking the scheduler for an
   * alternative.
   */
  taskMinutes?: number;
}

export interface PlacementValidation {
  valid: boolean;
  violations: SlotViolation[];
}

/** Parse a local ISO timestamp into its day + minute-of-day, or null if malformed. */
export function isoToDayMinutes(iso: string): { day: string; minute: number } | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return null;
  const hour = Number(m[2]);
  const min = Number(m[3]);
  if (hour > 23 || min > 59) return null;
  return { day: m[1], minute: hour * 60 + min };
}

function minutesToLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Subtract busy ranges from [start, end], returning the free gaps. */
function excludeRanges(
  start: number,
  end: number,
  busy: MinuteRange[],
): MinuteRange[] {
  if (end <= start) return [];
  const sorted = [...busy]
    .filter((r) => r.endMinute > start && r.startMinute < end)
    .sort((a, b) => a.startMinute - b.startMinute);
  const free: MinuteRange[] = [];
  let cursor = start;
  for (const r of sorted) {
    if (r.startMinute > cursor) {
      free.push({ startMinute: cursor, endMinute: Math.min(r.startMinute, end) });
    }
    cursor = Math.max(cursor, r.endMinute);
    if (cursor >= end) break;
  }
  if (cursor < end) free.push({ startMinute: cursor, endMinute: end });
  return free.filter((r) => r.endMinute > r.startMinute);
}

/** Free windows for a day, accounting for fixed events (+buffer) and other blocks. */
function freeWindowsForDay(
  day: string,
  input: ProposedPlacementInput,
): MinuteRange[] {
  const noWorkAfter = findNoWorkAfter(input.guardrails);
  const bufferMin = findBufferAfterEvent(input.guardrails);
  const dayEnd = Math.min(noWorkAfter ?? DAY_END, DAY_END);
  const fixed = input.fixedEventsByDay[day] ?? [];
  const fromFixed = computeFreeSlots(fixed, DAY_START, dayEnd, bufferMin);
  const otherBlocks = input.otherBlocksByDay?.[day] ?? [];
  if (otherBlocks.length === 0) return fromFixed;
  // Subtract other tasks' blocks (no buffer) from each fixed-event free window.
  return fromFixed.flatMap((w) =>
    excludeRanges(w.startMinute, w.endMinute, otherBlocks),
  );
}

/**
 * Validates that every proposed block obeys the same rules the scheduler
 * enforces: within working hours, before the no_work_after cutoff, not on top
 * of a fixed event or another task's block, and within the per-day max.
 * Reports one violation per offending block plus at most one aggregate
 * max_hours_per_day violation.
 */
export function validateProposedPlacement(
  input: ProposedPlacementInput,
): PlacementValidation {
  const violations: SlotViolation[] = [];
  const noWorkAfter = findNoWorkAfter(input.guardrails);
  const maxPerDay = findMaxHoursPerDay(input.guardrails);

  const proposedMinutesByDay: Record<string, number> = {};

  for (const block of input.proposed) {
    const start = isoToDayMinutes(block.startTime);
    const end = isoToDayMinutes(block.endTime);

    if (!start || !end || end.day !== start.day || end.minute <= start.minute) {
      violations.push({
        code: 'invalid_range',
        day: start?.day ?? '',
        message: 'That time range is invalid.',
      });
      continue;
    }

    const day = start.day;
    proposedMinutesByDay[day] =
      (proposedMinutesByDay[day] ?? 0) + (end.minute - start.minute);

    // Priority order gives the student the single clearest reason.
    if (noWorkAfter !== null && end.minute > noWorkAfter) {
      violations.push({
        code: 'no_work_after',
        day,
        message: `You've set no work after ${minutesToLabel(
          noWorkAfter,
        )}, and that slot runs to ${minutesToLabel(end.minute)}.`,
      });
      continue;
    }

    if (start.minute < DAY_START || end.minute > DAY_END) {
      violations.push({
        code: 'outside_day_hours',
        day,
        message: `Chronos only schedules between ${minutesToLabel(
          DAY_START,
        )} and ${minutesToLabel(DAY_END)}.`,
      });
      continue;
    }

    const windows = freeWindowsForDay(day, input);
    const fits = windows.some(
      (w) => start.minute >= w.startMinute && end.minute <= w.endMinute,
    );
    if (!fits) {
      violations.push({
        code: 'fixed_event_conflict',
        day,
        message: 'That slot overlaps a fixed event or another scheduled block.',
      });
      continue;
    }
  }

  if (maxPerDay !== null) {
    for (const [day, proposedMin] of Object.entries(proposedMinutesByDay)) {
      const otherMin = (input.otherBlocksByDay?.[day] ?? []).reduce(
        (a, r) => a + (r.endMinute - r.startMinute),
        0,
      );
      if (proposedMin + otherMin > maxPerDay) {
        violations.push({
          code: 'max_hours_per_day',
          day,
          message: `That would put ${((proposedMin + otherMin) / 60).toFixed(
            1,
          )}h of work on ${day}, over your ${(maxPerDay / 60).toFixed(
            1,
          )}h daily limit.`,
        });
      }
    }
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Asks the deterministic scheduler for a valid placement of the same task on
 * the same day(s), so the copilot can offer a concrete alternative instead of
 * guessing. Existing fixed events AND other tasks' blocks are treated as busy
 * so the suggestion never collides. Returns null if nothing fits.
 *
 * Known limitation: the scheduler's max_hours_per_day budget only counts what
 * IT places, so on an already-busy day the suggestion may not subtract other
 * tasks' minutes from that budget — the next full replan reconciles. It never
 * overlaps another block, which is the property that matters most.
 */
export function suggestValidPlacement(
  input: ProposedPlacementInput,
): ProposedBlock[] | null {
  const days = [...new Set(input.proposed.map((b) => b.startTime.slice(0, 10)))]
    .filter((d) => d.length === 10)
    .sort();
  if (days.length === 0) return null;

  const totalMinutes =
    input.taskMinutes ??
    input.proposed.reduce((sum, b) => {
      const s = isoToDayMinutes(b.startTime);
      const e = isoToDayMinutes(b.endTime);
      return sum + (s && e ? Math.max(0, e.minute - s.minute) : 0);
    }, 0);
  if (totalMinutes <= 0) return null;

  // Fold other tasks' blocks into each day's fixed events (as zero-length-named
  // busy ranges) so the scheduler routes around them too.
  const fixedEventsByDay: Record<string, FixedEvent[]> = {};
  for (const day of days) {
    const base = input.fixedEventsByDay[day] ?? [];
    const otherAsEvents: FixedEvent[] = (input.otherBlocksByDay?.[day] ?? []).map(
      (r, i) => ({
        id: `busy-${day}-${i}`,
        userId: '',
        title: 'Busy',
        startTime: minutesToHhmm(r.startMinute),
        endTime: minutesToHhmm(r.endMinute),
        daysOfWeek: [],
        createdAt: '',
      }),
    );
    fixedEventsByDay[day] = [...base, ...otherAsEvents];
  }

  const synthetic: Task = {
    id: 'copilot-suggestion',
    userId: '',
    title: 'suggestion',
    subject: '',
    source: 'manual',
    dueDate: `${days[days.length - 1]}T23:59:00`,
    difficulty: 3,
    estimatedMinutes: totalMinutes,
    taskType: 'other',
    status: 'pending',
    createdAt: '',
    updatedAt: '',
  };

  const result = schedule({
    tasks: [synthetic],
    fixedEventsByDay,
    dayKeys: days,
    guardrails: input.guardrails,
  });

  if (result.scheduledChunks.length === 0) return null;
  return result.scheduledChunks.map((c) => ({
    startTime: c.startTime,
    endTime: c.endTime,
  }));
}

function minutesToHhmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Validates that a guardrail's `value` jsonb matches the shape its rule type
 * requires — so the copilot's adjust_guardrail can't persist a malformed rule
 * that the scheduler's parsers (findNoWorkAfter etc.) would silently ignore.
 */
export function isValidGuardrailValue(
  ruleType: Guardrail['ruleType'],
  value: unknown,
): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  switch (ruleType) {
    case 'no_work_after':
      return typeof v.time === 'string' && /^\d{1,2}:\d{2}$/.test(v.time);
    case 'buffer_after_event':
      return typeof v.minutes === 'number' && Number.isFinite(v.minutes) && v.minutes >= 0;
    case 'max_hours_per_day':
      return typeof v.hours === 'number' && Number.isFinite(v.hours) && v.hours > 0;
    default:
      return false;
  }
}
