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
