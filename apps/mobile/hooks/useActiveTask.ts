import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { Task } from '@chronos/shared/types';
import { mapRowToTask } from './useTasksForDay';
import { getDemoTaskById, isDemoTaskId } from '../lib/demoData';

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
  const startedRef = useRef<boolean>(false);
  // Wall-clock timekeeping: JS timers freeze while the app is backgrounded,
  // so elapsed time is derived from timestamps, never from tick counts. The
  // interval only refreshes the display.
  const runStartedAtRef = useRef<number | null>(null);
  const accumulatedRef = useRef<number>(0); // seconds banked across pauses

  // Load task — does NOT mutate status. Caller invokes start() explicitly.
  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      if (isDemoTaskId(taskId)) {
        if (isMounted) {
          setTask(getDemoTaskById(taskId) ?? null);
          setLoading(false);
        }
        return;
      }

      // Auth not resolved yet (userId still ''). Hold in the loading state
      // rather than querying a uuid column with an empty string (Postgres
      // 22P02); the effect re-runs once a real id arrives.
      if (!userId) return;

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

  // Elapsed timer — timestamp-derived so time spent backgrounded still counts.
  useEffect(() => {
    if (isPaused || loading) return;

    if (runStartedAtRef.current === null) {
      runStartedAtRef.current = Date.now();
    }

    const refresh = () => {
      const runStarted = runStartedAtRef.current;
      const running = runStarted === null ? 0 : (Date.now() - runStarted) / 1000;
      setElapsedSeconds(Math.floor(accumulatedRef.current + running));
    };

    refresh();
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [isPaused, loading]);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (isDemoTaskId(taskId)) return;
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'in_progress' })
      .eq('id', taskId)
      .eq('user_id', userId);
    if (updateError) {
      // Best-effort status sync — a failed write must not kill a running
      // focus session. Allow a retry on the next start() call.
      startedRef.current = false;
      console.warn('[ActiveTask] Failed to mark in_progress:', updateError.message);
    }
  }, [taskId, userId]);

  function pause() {
    const runStarted = runStartedAtRef.current;
    if (runStarted !== null) {
      accumulatedRef.current += (Date.now() - runStarted) / 1000;
      runStartedAtRef.current = null;
    }
    setElapsedSeconds(Math.floor(accumulatedRef.current));
    setIsPaused(true);
  }

  function resume() {
    setIsPaused(false);
  }

  return { task, elapsedSeconds, isPaused, loading, error, pause, resume, start };
}
