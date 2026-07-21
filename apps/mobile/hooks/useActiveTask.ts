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
  // Wall-clock accounting: total ms accrued while running, plus the timestamp
  // the current running segment began. Reading Date.now() (not a +1/sec counter)
  // keeps elapsed accurate across app suspension — iOS throttles JS timers in
  // the background, so a tick counter badly undercounts real study time.
  const accumulatedMsRef = useRef<number>(0);
  const segmentStartRef = useRef<number | null>(null);
  const startedRef = useRef<boolean>(false);

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

  // Elapsed timer — driven off wall-clock time, not a per-second increment.
  useEffect(() => {
    const running = !isPaused && !loading && !error && !!task;
    if (!running) return;

    segmentStartRef.current = Date.now();
    const tick = () => {
      const segMs = segmentStartRef.current ? Date.now() - segmentStartRef.current : 0;
      setElapsedSeconds(Math.floor((accumulatedMsRef.current + segMs) / 1000));
    };
    tick();
    const id = setInterval(tick, 500);

    return () => {
      clearInterval(id);
      // Fold the just-ended running segment into the accumulated total so a
      // pause (or unmount/remount) doesn't lose or double-count elapsed time.
      if (segmentStartRef.current) {
        accumulatedMsRef.current += Date.now() - segmentStartRef.current;
        segmentStartRef.current = null;
      }
    };
  }, [isPaused, loading, error, task]);

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
      // Non-fatal: the timer keeps running and completion still records. Don't
      // surface this as a load error — that would replace the whole active
      // screen with "Couldn't load this task" over a successfully loaded task.
      startedRef.current = false;
      console.warn('[ActiveTask] Failed to mark in_progress:', updateError.message);
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
