import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import type {
  LiveActivityContentState,
  Task,
  TaskSession,
} from '@aura/shared/types';
import {
  startTaskActivity,
  updateTaskActivity,
  endTaskActivity,
} from '../services/liveActivity';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'aura.taskSession.v1';

/**
 * The live focus-session controller. The React layer is the single source of
 * truth for timing; the native Live Activity merely mirrors it (see
 * services/liveActivity.ts). Only one session can be active at a time.
 */
export interface TaskSessionController {
  session: TaskSession | null;
  /** Live elapsed focus time in ms (excludes paused stretches). */
  elapsedMs: number;
  /** Time left against the planned duration; 0 once the estimate is hit. */
  remainingMs: number;
  /** 0–1 fraction of the planned duration consumed. */
  progress: number;
  /** True once elapsed has passed the planned duration. */
  isOvertime: boolean;
  isRunning: boolean;
  start: (task: Task) => Promise<void>;
  pause: () => void;
  resume: () => void;
  /** Adds minutes to the planned duration (e.g. +5, +10). */
  extend: (minutes: number) => void;
  /**
   * Ends the session and returns the task id + rounded actual minutes so the
   * caller can route to the post-task feedback screen, which records the
   * completion. Does not itself write to the DB.
   */
  complete: () => Promise<{ taskId: string; actualMinutes: number } | null>;
  /** Abandons the session with no completion record. */
  cancel: () => void;
}

const TaskSessionContext = createContext<TaskSessionController | null>(null);

function computeElapsed(
  session: TaskSession,
  runStartedAt: number | null,
  atMs: number,
): number {
  return session.elapsedMs + (runStartedAt != null ? atMs - runStartedAt : 0);
}

function buildContentState(
  session: TaskSession,
  runStartedAt: number | null,
  atMs: number,
): LiveActivityContentState {
  const elapsed = computeElapsed(session, runStartedAt, atMs);
  const startsAt = atMs - elapsed;
  return {
    title: session.title,
    subject: session.subject,
    difficulty: session.difficulty,
    startsAt,
    endsAt: startsAt + session.plannedMs,
    paused: session.status !== 'running',
    remainingMs: Math.max(0, session.plannedMs - elapsed),
    status: session.status,
  };
}

export function TaskSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TaskSession | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Absolute wall-clock ms at which the current running segment began; null
  // while paused/idle. Kept in a ref so callbacks read the latest value and so
  // render can derive live elapsed without an extra state tick.
  const runStartedAtRef = useRef<number | null>(null);
  const sessionRef = useRef<TaskSession | null>(null);
  const activityIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Hydrate a session persisted across reloads. The native activity isn't
  // recreated here — on iOS it survives natively, but its id is lost, so
  // reconciliation is a follow-up. In-app continuity is restored fully.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const parsed = JSON.parse(raw) as {
          session: TaskSession;
          runStartedAt: number | null;
        };
        if (parsed?.session) {
          runStartedAtRef.current = parsed.runStartedAt ?? null;
          setSession(parsed.session);
          setNow(Date.now());
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(
    (next: TaskSession | null, runStartedAt: number | null) => {
      if (!next) {
        void AsyncStorage.removeItem(STORAGE_KEY);
        return;
      }
      void AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ session: next, runStartedAt }),
      );
    },
    [],
  );

  // Tick once a second while running so derived values + the in-app widget
  // stay live. The native card animates itself and needs no per-second push.
  useEffect(() => {
    if (session?.status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session?.status]);

  const start = useCallback(
    async (task: Task) => {
      // Tear down any in-flight session first, using captured locals so a
      // concurrent action can't target the old (about-to-end) activity. Cleared
      // synchronously and ended fire-and-forget so the new session shows at once.
      const previousId = activityIdRef.current;
      const previousSession = sessionRef.current;
      activityIdRef.current = null;
      if (previousId && previousSession) {
        void endTaskActivity(previousId, {
          ...buildContentState(previousSession, runStartedAtRef.current, Date.now()),
          status: 'cancelled',
          paused: false,
        });
      }

      const startMs = Date.now();
      const plannedMs = Math.max(1, task.estimatedMinutes) * 60_000;
      const next: TaskSession = {
        taskId: task.id,
        userId: task.userId,
        title: task.title,
        subject: task.subject,
        difficulty: task.difficulty,
        startedAt: new Date(startMs).toISOString(),
        plannedMs,
        elapsedMs: 0,
        status: 'running',
      };
      runStartedAtRef.current = startMs;
      sessionRef.current = next;
      setSession(next);
      setNow(startMs);
      persist(next, startMs);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const id = await startTaskActivity(
        { taskId: task.id },
        buildContentState(next, startMs, startMs),
      );
      if (sessionRef.current?.taskId === task.id) {
        activityIdRef.current = id;
        // A pause/extend may have landed during the await — reconcile the card.
        if (sessionRef.current !== next) {
          void updateTaskActivity(
            id,
            buildContentState(sessionRef.current, runStartedAtRef.current, Date.now()),
          );
        }
      } else if (id) {
        // The session was completed/replaced mid-await; don't leak the activity.
        void endTaskActivity(id, {
          ...buildContentState(next, startMs, Date.now()),
          status: 'cancelled',
          paused: false,
        });
      }
    },
    [persist],
  );

  const pause = useCallback(() => {
    const prev = sessionRef.current;
    if (!prev || prev.status !== 'running') return;
    const pausedAt = Date.now();
    const accrued = computeElapsed(prev, runStartedAtRef.current, pausedAt);
    const next: TaskSession = { ...prev, elapsedMs: accrued, status: 'paused' };
    runStartedAtRef.current = null;
    sessionRef.current = next;
    setSession(next);
    persist(next, null);
    void updateTaskActivity(
      activityIdRef.current,
      buildContentState(next, null, pausedAt),
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [persist]);

  const resume = useCallback(() => {
    const prev = sessionRef.current;
    if (!prev || prev.status !== 'paused') return;
    const resumedAt = Date.now();
    runStartedAtRef.current = resumedAt;
    const next: TaskSession = { ...prev, status: 'running' };
    sessionRef.current = next;
    setSession(next);
    setNow(resumedAt);
    persist(next, resumedAt);
    void updateTaskActivity(
      activityIdRef.current,
      buildContentState(next, resumedAt, resumedAt),
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [persist]);

  const extend = useCallback(
    (minutes: number) => {
      const prev = sessionRef.current;
      if (!prev) return;
      const atMs = Date.now();
      const next: TaskSession = {
        ...prev,
        plannedMs: prev.plannedMs + minutes * 60_000,
      };
      sessionRef.current = next;
      setSession(next);
      persist(next, runStartedAtRef.current);
      void updateTaskActivity(
        activityIdRef.current,
        buildContentState(next, runStartedAtRef.current, atMs),
      );
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    [persist],
  );

  const clearSession = useCallback(
    async (finalStatus: 'completed' | 'cancelled') => {
      const prev = sessionRef.current;
      const id = activityIdRef.current;
      const runStartedAt = runStartedAtRef.current;
      const atMs = Date.now();
      // Clear local state + storage synchronously, BEFORE awaiting the native
      // end. This means a second tap immediately sees no session, and an app
      // kill mid-await can't rehydrate an already-finished session.
      sessionRef.current = null;
      activityIdRef.current = null;
      runStartedAtRef.current = null;
      setSession(null);
      persist(null, null);
      if (id && prev) {
        await endTaskActivity(id, {
          ...buildContentState(prev, runStartedAt, atMs),
          status: finalStatus,
          paused: false,
        });
      }
    },
    [persist],
  );

  const complete = useCallback(async () => {
    const prev = sessionRef.current;
    if (!prev) return null;
    const elapsed = computeElapsed(prev, runStartedAtRef.current, Date.now());
    const actualMinutes = Math.max(1, Math.round(elapsed / 60_000));
    await clearSession('completed');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    return { taskId: prev.taskId, actualMinutes };
  }, [clearSession]);

  const cancel = useCallback(() => {
    void clearSession('cancelled');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [clearSession]);

  // Drop the session when the user signs out, so the app-wide widget never
  // lingers over onboarding or another account. Demo mode keeps a stable user,
  // so this only fires on a real sign-out (userId → null).
  const { userId, loading: authLoading } = useAuth();
  useEffect(() => {
    if (authLoading) return;
    if (userId === null && sessionRef.current) {
      void clearSession('cancelled');
    }
  }, [userId, authLoading, clearSession]);

  const elapsedMs = session
    ? computeElapsed(session, runStartedAtRef.current, now)
    : 0;
  const remainingMs = session ? Math.max(0, session.plannedMs - elapsedMs) : 0;
  const progress =
    session && session.plannedMs > 0
      ? Math.min(1, elapsedMs / session.plannedMs)
      : 0;

  const value = useMemo<TaskSessionController>(
    () => ({
      session,
      elapsedMs,
      remainingMs,
      progress,
      isOvertime: session ? elapsedMs > session.plannedMs : false,
      isRunning: session?.status === 'running',
      start,
      pause,
      resume,
      extend,
      complete,
      cancel,
    }),
    [
      session,
      elapsedMs,
      remainingMs,
      progress,
      start,
      pause,
      resume,
      extend,
      complete,
      cancel,
    ],
  );

  return (
    <TaskSessionContext.Provider value={value}>
      {children}
    </TaskSessionContext.Provider>
  );
}

/** Access the live focus-session controller. Must be inside TaskSessionProvider. */
export function useTaskSession(): TaskSessionController {
  const ctx = useContext(TaskSessionContext);
  if (!ctx) {
    throw new Error('useTaskSession must be used within a TaskSessionProvider');
  }
  return ctx;
}

/** Convenience: is a given task the one currently in session? */
export function useIsTaskInSession(taskId: string | null): boolean {
  const { session } = useTaskSession();
  return !!taskId && session?.taskId === taskId;
}
