// Deterministic greedy scheduler — Blueprint §6.4. PURE TYPESCRIPT, never an
// LLM. This is the Deno-runtime port of packages/shared/scheduler.ts with
// three additions the pipeline needs: per-task due-day caps (a chunk must
// never land after the assignment is due), short-task placement (a task or
// tail remainder under the 25-min chunk floor is still placeable at its own
// size), and timezone helpers (guardrails/fixed events are local wall times;
// scheduled_blocks are timestamptz).
// Keep the core algorithm in sync with packages/shared/scheduler.ts.

export interface SchedulerTask {
  id: string;
  estimatedMinutes: number;
  /** Last eligible local day (YYYY-MM-DD). Days after this are skipped. */
  dueDay?: string;
}

export interface BusyRange {
  startMinute: number; // minutes since 00:00 local
  endMinute: number;
}

export interface SchedulerGuardrail {
  ruleType: 'no_work_after' | 'buffer_after_event' | 'max_hours_per_day';
  value: Record<string, unknown>;
  active: boolean;
}

export interface ScheduledChunkLocal {
  taskId: string;
  day: string; // YYYY-MM-DD local
  startMinute: number;
  endMinute: number;
}

export interface ScheduleOutcome {
  scheduledChunks: ScheduledChunkLocal[];
  overloadedTaskIds: string[];
}

interface ScheduleInput {
  tasks: SchedulerTask[]; // pre-sorted by priority (due asc, difficulty desc)
  busyByDay: Record<string, BusyRange[]>; // fixed events + approved blocks
  dayKeys: string[]; // eligible local days, ascending
  guardrails: SchedulerGuardrail[];
}

const DAY_START = 6 * 60; // 06:00
const DAY_END = 23 * 60; // 23:00 — guardrail can pull this earlier
const MIN_CHUNK_MIN = 25;
const MAX_CHUNK_MIN = 75;

export function schedule(input: ScheduleInput): ScheduleOutcome {
  const noWorkAfter = findNoWorkAfter(input.guardrails);
  const bufferMin = findBufferAfterEvent(input.guardrails);
  const maxPerDay = findMaxHoursPerDay(input.guardrails);

  const usedByDay: Record<string, number> = {};
  for (const k of input.dayKeys) usedByDay[k] = 0;

  const slotsByDay: Record<string, BusyRange[]> = {};
  for (const day of input.dayKeys) {
    const busy = input.busyByDay[day] ?? [];
    const dayEnd = noWorkAfter ?? DAY_END;
    slotsByDay[day] = computeFreeSlots(busy, DAY_START, dayEnd, bufferMin);
  }

  const scheduledChunks: ScheduledChunkLocal[] = [];
  const overloadedTaskIds: string[] = [];

  for (const task of input.tasks) {
    let remaining = task.estimatedMinutes;

    for (const day of input.dayKeys) {
      if (remaining <= 0) break;
      if (task.dueDay && day > task.dueDay) break; // never schedule past due
      if ((maxPerDay ?? Infinity) - usedByDay[day] <= 0) continue;

      // A task (or its tail remainder) smaller than the chunk floor is still
      // placeable at its own size — otherwise 15-min tasks are unschedulable.
      const effectiveMin = Math.min(MIN_CHUNK_MIN, remaining);
      const slots = slotsByDay[day]
        .filter((s) => s.endMinute - s.startMinute >= effectiveMin)
        .sort((a, b) => b.endMinute - b.startMinute - (a.endMinute - a.startMinute));

      for (const slot of slots) {
        if (remaining <= 0) break;
        const slotMin = slot.endMinute - slot.startMinute;
        const dayCapacityLeft = (maxPerDay ?? Infinity) - usedByDay[day];
        if (dayCapacityLeft <= 0) break;
        const chunkMin = Math.min(slotMin, remaining, MAX_CHUNK_MIN, dayCapacityLeft);
        if (chunkMin < Math.min(MIN_CHUNK_MIN, remaining)) continue;

        const start = slot.startMinute;
        scheduledChunks.push({
          taskId: task.id,
          day,
          startMinute: start,
          endMinute: start + chunkMin,
        });
        remaining -= chunkMin;
        usedByDay[day] += chunkMin;
        slot.startMinute = start + chunkMin; // shrink the consumed slot
      }
    }

    if (remaining > 0) overloadedTaskIds.push(task.id);
  }

  return { scheduledChunks, overloadedTaskIds };
}

export function computeFreeSlots(
  busy: BusyRange[],
  dayStart: number,
  dayEnd: number,
  bufferMin: number,
): BusyRange[] {
  if (dayEnd <= dayStart) return [];
  const ranges = busy
    .map((e) => ({
      startMinute: Math.max(0, e.startMinute - bufferMin),
      endMinute: Math.min(24 * 60, e.endMinute + bufferMin),
    }))
    .sort((a, b) => a.startMinute - b.startMinute);

  const free: BusyRange[] = [];
  let cursor = dayStart;
  for (const r of ranges) {
    if (r.startMinute > cursor) {
      free.push({ startMinute: cursor, endMinute: Math.min(r.startMinute, dayEnd) });
    }
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

function findNoWorkAfter(guardrails: SchedulerGuardrail[]): number | null {
  const g = guardrails.find((x) => x.ruleType === 'no_work_after' && x.active);
  if (!g) return null;
  const time = (g.value as { time?: string }).time;
  return time ? hhmmToMinutes(time) : null;
}

function findBufferAfterEvent(guardrails: SchedulerGuardrail[]): number {
  const g = guardrails.find((x) => x.ruleType === 'buffer_after_event' && x.active);
  if (!g) return 0;
  return (g.value as { minutes?: number }).minutes ?? 0;
}

function findMaxHoursPerDay(guardrails: SchedulerGuardrail[]): number | null {
  const g = guardrails.find((x) => x.ruleType === 'max_hours_per_day' && x.active);
  if (!g) return null;
  const hours = (g.value as { hours?: number }).hours;
  return hours ? hours * 60 : null;
}

// ─── Timezone helpers ──────────────────────────────────────────────────────
// scheduled_blocks.start_time/end_time are timestamptz; fixed events and
// guardrails are local wall times. These convert between the two using the
// user's IANA timezone without any external date library.

/** Minutes east of UTC for `date` in `timeZone` (EDT → -240). */
export function tzOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - date.getTime()) / 60_000;
}

/** Local calendar day (YYYY-MM-DD) for an instant in `timeZone`. */
export function localDayKey(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Pure calendar-date arithmetic on a YYYY-MM-DD key. */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

/** Convert local wall-clock minutes on a local day to a UTC ISO instant. */
export function localMinutesToUtcIso(
  day: string,
  minutes: number,
  timeZone: string,
): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  // First guess: treat the wall time as UTC, then correct by the zone offset
  // at that instant. A second pass handles DST transitions on the boundary.
  const guess = new Date(`${day}T${pad(h)}:${pad(m)}:00Z`);
  let offset = tzOffsetMinutes(guess, timeZone);
  let utc = new Date(guess.getTime() - offset * 60_000);
  const secondOffset = tzOffsetMinutes(utc, timeZone);
  if (secondOffset !== offset) {
    utc = new Date(guess.getTime() - secondOffset * 60_000);
  }
  return utc.toISOString();
}

/** Local (day, minutes) for a UTC ISO instant in `timeZone`. */
export function utcIsoToLocalMinutes(
  iso: string,
  timeZone: string,
): { day: string; minutes: number } {
  const date = new Date(iso);
  const day = localDayKey(date, timeZone);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  return { day, minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
}
