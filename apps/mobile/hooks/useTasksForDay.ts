import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { Task } from '@chronos/shared/types';
import { isGuestId, loadGuestTasks, subscribeGuestTasks } from '../lib/guest';
import { addDaysToDayIso, localDayStartUtc } from '../lib/localDate';
import { getDemoTasksForDay } from '../lib/demoData';

/** Same visibility rule the Supabase query applies, for guest-local tasks. */
function isOpenTaskForDay(task: Task, day: string): boolean {
  return (
    task.dueDate >= `${day}T00:00:00Z` &&
    ['pending', 'scheduled', 'in_progress'].includes(task.status)
  );
}

interface TasksForDayResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function mapRowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    subject: row.subject as string,
    source: row.source as Task['source'],
    externalId: (row.external_id as string) ?? undefined,
    dueDate: row.due_date as string,
    difficulty: row.difficulty as Task['difficulty'],
    estimatedMinutes: row.estimated_minutes as number,
    taskType: row.task_type as Task['taskType'],
    status: row.status as Task['status'],
    description: (row.description as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export { mapRowToTask };

export function useTasksForDay(userId: string, day: string): TasksForDayResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      // Auth not resolved yet (userId still ''). Hold in the loading state
      // rather than querying a uuid column with an empty string (Postgres
      // 22P02); the effect re-runs once a real id arrives.
      if (!userId) return;

      if (isGuestId(userId)) {
        const guestTasks = (await loadGuestTasks()).filter((t) =>
          isOpenTaskForDay(t, day),
        );
        if (isMounted) {
          setTasks(
            [...getDemoTasksForDay(day), ...guestTasks].sort((a, b) =>
              a.dueDate.localeCompare(b.dueDate),
            ),
          );
          setLoading(false);
        }
        return;
      }

      try {
        // Bound to a single local day [day, nextDay). Without the upper bound
        // this returned every task due on or after `day`, so every week column
        // showed all future tasks; local-day instants keep the bucketing correct
        // for users off UTC.
        const nextDay = addDaysToDayIso(day, 1);
        const { data, error: queryError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .gte('due_date', localDayStartUtc(day))
          .lt('due_date', localDayStartUtc(nextDay))
          .in('status', ['pending', 'scheduled', 'in_progress'])
          .order('due_date', { ascending: true });

        if (!isMounted) return;

        if (queryError) {
          setError(queryError.message);
          setLoading(false);
          return;
        }

        setTasks((data ?? []).map(mapRowToTask));
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    load();

    // Guest-created tasks can arrive while this screen is mounted (e.g. the
    // New Task modal saves locally) — refetch so they appear immediately.
    const unsubscribe = isGuestId(userId)
      ? subscribeGuestTasks(() => load())
      : undefined;

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [userId, day, trigger]);

  return { tasks, loading, error, refetch };
}
