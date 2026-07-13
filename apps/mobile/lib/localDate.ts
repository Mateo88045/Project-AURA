// Local-calendar date helpers.
//
// `Date.toISOString()` renders the UTC calendar date, which is *yesterday*
// for any user west of UTC in the evening (or *tomorrow* east of UTC in the
// morning). Chronos's `day` keys are local calendar days — a student's
// "today" is the date on their wall clock — so every YYYY-MM-DD the app
// produces or parses must go through these helpers, never toISOString().

/** Format a Date as YYYY-MM-DD using the device's local calendar. */
export function toLocalDayIso(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local YYYY-MM-DD for N days from now (negative = past). */
export function localDayIsoWithOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDayIso(d);
}

/**
 * Parse a YYYY-MM-DD day key at local noon. Parsing the bare string would
 * yield UTC midnight, whose local weekday can differ from the key's — noon
 * keeps the weekday stable in every timezone.
 */
export function localDateFromDayIso(dayIso: string): Date {
  return new Date(`${dayIso}T12:00:00`);
}

/** Local weekday (0 = Sunday) for a YYYY-MM-DD day key. */
export function localWeekday(dayIso: string): number {
  return localDateFromDayIso(dayIso).getDay();
}
