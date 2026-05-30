import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { Task } from '@chronos/shared/types';
import { mapRowToTask } from './useTasksForDay';

interface TaskDetailResult {
  task: Task | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTaskDetail(taskId: string): TaskDetailResult {
  const [task, setTask] = useState<Task | null>(null);
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
          .eq('id', taskId)
          .single();

        if (!isMounted) return;

        if (queryError) {
          setError(queryError.message);
          setLoading(false);
          return;
        }

        setTask(mapRowToTask(data));
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
  }, [taskId, trigger]);

  return { task, loading, error, refetch };
}
