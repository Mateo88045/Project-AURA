// Plain clock/duration formatting shared by Today, Review and Copilot.

/** 4:45 (no meridiem — Dusk shows bare tabular times). */
export function clock(d: Date): string {
  return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** HH:MM (today, local) → Date */
export function dateFromHHMM(hhmm: string, base = new Date()): Date {
  const [h, m = '0'] = hhmm.split(':');
  const d = new Date(base);
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d;
}

export function minutesBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

/** 125 → "2 h 05 m", 45 → "45 m" */
export function formatDuration(min: number): string {
  if (min < 60) return `${min} m`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} m`;
}

/** "due today" / "due tomorrow" / "due Wed" / "" when missing or past a week. */
export function formatDue(iso: string | undefined, now = new Date()): string {
  if (!iso) return '';
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return '';
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(due) - startOf(now)) / 86400000);
  if (days < 0) return 'overdue';
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  if (days < 7) return `due ${due.toLocaleDateString(undefined, { weekday: 'short' })}`;
  return `due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}
