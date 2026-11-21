import { useMemo } from 'react';
import type { Task } from '@chronos/shared/types';
import { useTasksForDay } from './useTasksForDay';
import { toLocalDayIso } from '../lib/localDate';

export interface DayLoad {
  date: Date;
  iso: string;
  tasks: Task[];
  minutes: number;
}

/** Homework due on each of seven days, with summed estimates. */
export function useWeekLoad(userId: string, days: Date[]) {
  const isos = days.map(toLocalDayIso);
  // Seven fixed calls — hook order never changes.
  const r0 = useTasksForDay(userId, isos[0]);
  const r1 = useTasksForDay(userId, isos[1]);
  const r2 = useTasksForDay(userId, isos[2]);
  const r3 = useTasksForDay(userId, isos[3]);
  const r4 = useTasksForDay(userId, isos[4]);
  const r5 = useTasksForDay(userId, isos[5]);
  const r6 = useTasksForDay(userId, isos[6]);
  const results = [r0, r1, r2, r3, r4, r5, r6];

  const loading = results.some((r) => r.loading);
  const error = results.find((r) => r.error)?.error ?? null;
  const key = results.map((r) => r.tasks.map((t) => t.id).join('|')).join(',');

  const load: DayLoad[] = useMemo(
    () =>
      days.map((date, i) => {
        // Guest-local tasks come back for every day on or after their due day;
        // keep each one only on its own due day. Demo tasks are placed per weekday.
        const tasks = results[i].tasks.filter(
          (t) => t.id.startsWith('demo-') || toLocalDayIso(new Date(t.dueDate)) === isos[i],
        );
        return { date, iso: isos[i], tasks, minutes: tasks.reduce((s, t) => s + t.estimatedMinutes, 0) };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, isos.join(',')],
  );

  const refetch = () => results.forEach((r) => r.refetch());
  return { load, loading, error, refetch };
}
