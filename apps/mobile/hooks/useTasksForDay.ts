import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { Task } from '@chronos/shared/types';

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

      try {
        const { data, error: queryError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .gte('due_date', `${day}T00:00:00Z`)
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

    return () => {
      isMounted = false;
    };
  }, [userId, day, trigger]);

  return { tasks, loading, error, refetch };
}
