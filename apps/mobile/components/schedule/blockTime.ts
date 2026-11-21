// Time helpers shared by the Daylight Blocks screens.

export function minutesFromHHMM(hhmm: string): number {
  const [h, m = '0'] = hhmm.split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

export function minutesFromIso(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

/** 17:45 → "5:45" (12-hour, no meridiem). */
export function clockLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}`;
}

/** 17:45 → "PM". */
export function meridiem(min: number): 'AM' | 'PM' {
  return Math.floor(min / 60) % 24 >= 12 ? 'PM' : 'AM';
}

/** 17 → "5 PM". */
export function hourLabel(hour: number): string {
  const h = hour % 24;
  return `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** 135 → "2 h 15 m", 40 → "40 m". */
export function durationLabel(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  if (h === 0) return `${m} m`;
  return `${h} h ${String(m).padStart(2, '0')} m`;
}

/** Monday-start week containing `d`, as local Dates at midnight. */
export function weekOf(d: Date): Date[] {
  const base = new Date(d);
  base.setHours(0, 0, 0, 0);
  const offset = (base.getDay() + 6) % 7; // Mon = 0
  base.setDate(base.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    return day;
  });
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
