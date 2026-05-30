import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { Task } from '@chronos/shared/types';
import { mapRowToTask } from './useTasksForDay';

interface ActiveTaskResult {
  task: Task | null;
  elapsedSeconds: number;
  isPaused: boolean;
  loading: boolean;
  error: string | null;
  pause: () => void;
  resume: () => void;
  start: () => Promise<void>;
}

export function useActiveTask(taskId: string, userId: string): ActiveTaskResult {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef<boolean>(false);

  // Load task — does NOT mutate status. Caller invokes start() explicitly.
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
          .eq('user_id', userId)
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
  }, [taskId, userId]);

  // Elapsed timer
  useEffect(() => {
    if (isPaused || loading) return;

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, loading]);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'in_progress' })
      .eq('id', taskId)
      .eq('user_id', userId);
    if (updateError) {
      startedRef.current = false;
      setError(updateError.message);
    }
  }, [taskId, userId]);

  function pause() {
    setIsPaused(true);
  }

  function resume() {
    setIsPaused(false);
  }

  return { task, elapsedSeconds, isPaused, loading, error, pause, resume, start };
}
