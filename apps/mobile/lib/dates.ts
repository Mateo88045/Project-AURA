/**
 * Local-calendar day key (YYYY-MM-DD). Screens key schedule queries by the
 * user's local day — `toISOString().slice(0, 10)` is UTC and lags a day for
 * anyone west of UTC in the evening (or east of UTC after midnight), which
 * shifts the whole schedule onto the wrong date.
 */
export function toLocalDayIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a `YYYY-MM-DD` day key into a Date anchored at local noon. Anchoring at
 * noon (not midnight) keeps the calendar date stable regardless of timezone —
 * `new Date('2026-06-01')` is UTC midnight and reads as the previous day west of
 * UTC, which is the bug `toLocalDayIso` exists to avoid. Use this for any
 * weekday / calendar math on a day key.
 */
export function dayIsoToLocalDate(day: string): Date {
  return new Date(`${day}T12:00:00`);
}

/**
 * Day of week (0=Sun … 6=Sat) for a `YYYY-MM-DD` key, in the user's local
 * calendar. Never use `new Date(day).getDay()` — that parses as UTC.
 */
export function weekdayFromDayIso(day: string): number {
  return dayIsoToLocalDate(day).getDay();
}

/** The `YYYY-MM-DD` key `n` days after `day` (n may be negative). */
export function addDaysToDayIso(day: string, n: number): string {
  const d = dayIsoToLocalDate(day);
  d.setDate(d.getDate() + n);
  return toLocalDayIso(d);
}

/**
 * The UTC instant (ISO 8601) at which a local calendar day begins. Use this to
 * bound `timestamptz` queries by the user's local day: `[localDayStartUtc(day),
 * localDayStartUtc(nextDay))`. Comparing a stored instant against `${day}T00:00:00Z`
 * silently buckets tasks by the UTC day instead, which skews by one for anyone
 * not on UTC.
 */
export function localDayStartUtc(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}
