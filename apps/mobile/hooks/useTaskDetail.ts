import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { Task } from '@chronos/shared/types';
import { mapRowToTask } from './useTasksForDay';
import { getDemoTaskById, isDemoTaskId } from '../lib/demoData';

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

      // Demo tasks (served to guest sessions) live in-memory and were never
      // written to Supabase — looking them up by id there always 400s.
      if (isDemoTaskId(taskId)) {
        if (isMounted) {
          setTask(getDemoTaskById(taskId) ?? null);
          setLoading(false);
        }
        return;
      }

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
