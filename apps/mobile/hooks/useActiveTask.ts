import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type {
  LiveActivityContentState,
  LiveActivityStatus,
  Task,
} from '@chronos/shared/types';
import { mapRowToTask } from './useTasksForDay';
import { getDemoTaskById, isDemoTaskId } from '../lib/demoData';
import {
  endTaskActivity,
  startTaskActivity,
  updateTaskActivity,
} from '../services/liveActivity';

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

  // Native Live Activity mirror (iOS 16.2+). The refs below define the visible
  // countdown window in epoch ms; the React state above stays the source of
  // truth and these only feed the lock-screen / Dynamic Island card. Everything
  // no-ops safely off iOS or without the widget extension.
  const activityIdRef = useRef<string | null>(null);
  const plannedMsRef = useRef<number>(0);
  const startsAtRef = useRef<number>(0);
  const endsAtRef = useRef<number>(0);
  const frozenRemainingRef = useRef<number>(0); // remaining ms captured at pause
  const taskRef = useRef<Task | null>(null);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  // Builds the payload mirrored to the native activity. Reads only refs + its
  // argument, so it's safe to call from stale closures (e.g. unmount cleanup).
  function buildActivityState(
    forTask: Task,
    paused: boolean,
    status: LiveActivityStatus,
  ): LiveActivityContentState {
    const remainingMs = paused
      ? frozenRemainingRef.current
      : Math.max(0, endsAtRef.current - Date.now());
    return {
      title: forTask.title,
      subject: forTask.subject,
      difficulty: forTask.difficulty,
      startsAt: startsAtRef.current,
      endsAt: endsAtRef.current,
      paused,
      remainingMs,
      status,
    };
  }

  // End the native activity when the focus screen unmounts (e.g. the student
  // navigates to the completion screen or backs out).
  useEffect(() => {
    return () => {
      const id = activityIdRef.current;
      if (id === null) return;
      const finalTask = taskRef.current;
      const finalState: LiveActivityContentState = finalTask
        ? buildActivityState(finalTask, false, 'completed')
        : {
            title: '',
            subject: '',
            difficulty: 1,
            startsAt: startsAtRef.current,
            endsAt: endsAtRef.current,
            paused: false,
            remainingMs: 0,
            status: 'completed',
          };
      void endTaskActivity(id, finalState);
      activityIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const running = !isPaused && !loading && !error && !!task;
    if (!running) return;

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
    // `error`/`task` gate `running` above, so both belong here too — otherwise
    // the timer effect won't re-evaluate when either flips (e.g. task load
    // finishes after loading already went false in a prior render).
  }, [isPaused, loading, error, task]);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Open the native Live Activity once, using the task's estimate as the
    // countdown window. Fire-and-forget: a missing native surface returns null
    // and the in-app timer carries the session regardless.
    const activeTask = task;
    if (activeTask && activityIdRef.current === null) {
      const now = Date.now();
      plannedMsRef.current = activeTask.estimatedMinutes * 60_000;
      startsAtRef.current = now;
      endsAtRef.current = now + plannedMsRef.current;
      frozenRemainingRef.current = plannedMsRef.current;
      const activityId = await startTaskActivity(
        { taskId },
        buildActivityState(activeTask, false, 'running'),
      );
      activityIdRef.current = activityId;
    }

    if (isDemoTaskId(taskId)) return;
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'in_progress' })
      .eq('id', taskId)
      .eq('user_id', userId);
    if (updateError) {
      // Best-effort status sync — a failed write must not kill a running
      // focus session. Allow a retry on the next start() call. Non-fatal: don't
      // surface this as a load error, which would replace the whole active
      // screen over a task that loaded successfully.
      startedRef.current = false;
      console.warn('[ActiveTask] Failed to mark in_progress:', updateError.message);
    }
    // buildActivityState only reads refs + its argument; task drives the
    // initial activity payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, userId, task]);

  function pause() {
    const runStarted = runStartedAtRef.current;
    if (runStarted !== null) {
      accumulatedRef.current += (Date.now() - runStarted) / 1000;
      runStartedAtRef.current = null;
    }
    setElapsedSeconds(Math.floor(accumulatedRef.current));
    setIsPaused(true);
    // Freeze the countdown and mirror the paused state to the Live Activity.
    frozenRemainingRef.current = Math.max(0, endsAtRef.current - Date.now());
    if (task) {
      void updateTaskActivity(activityIdRef.current, buildActivityState(task, true, 'paused'));
    }
  }

  function resume() {
    setIsPaused(false);
    // Shift the countdown window forward by the paused gap, keeping its total
    // length constant, so the native timer stays truthful.
    endsAtRef.current = Date.now() + frozenRemainingRef.current;
    startsAtRef.current = endsAtRef.current - plannedMsRef.current;
    if (task) {
      void updateTaskActivity(activityIdRef.current, buildActivityState(task, false, 'running'));
    }
  }

  return { task, elapsedSeconds, isPaused, loading, error, pause, resume, start };
}
