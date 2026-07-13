import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { FixedEvent, ScheduledBlock } from '@chronos/shared/types';
import { mapRowToTask } from './useTasksForDay';
import { isGuestId } from '../lib/guest';
import { localWeekday } from '../lib/localDate';
import { getDemoFixedEventsForDay, getDemoScheduledBlocksForDay } from '../lib/demoData';
import { useEntitlement } from '../lib/entitlement';

interface TodayScheduleResult {
  scheduledBlocks: ScheduledBlock[];
  fixedEvents: FixedEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTodaySchedule(userId: string, day: string): TodayScheduleResult {
  const [scheduledBlocks, setScheduledBlocks] = useState<ScheduledBlock[]>([]);
  const [fixedEvents, setFixedEvents] = useState<FixedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const refetch = useCallback(() => setTrigger((t) => t + 1), []);
  const { markScheduleRendered } = useEntitlement();

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      // Guest mode has no real Supabase user row — never query a uuid column
      // with the guest sentinel id. Serve the fixed demo dataset instead.
      if (isGuestId(userId)) {
        if (isMounted) {
          setScheduledBlocks(getDemoScheduledBlocksForDay(day));
          setFixedEvents(getDemoFixedEventsForDay(day));
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch scheduled blocks with joined task data, plus fixed events in parallel
        const [blocksResult, eventsResult] = await Promise.all([
          supabase
            .from('scheduled_blocks')
            .select('*, tasks(*)')
            .eq('user_id', userId)
            .eq('day', day)
            .in('status', ['approved', 'shadow'])
            .order('start_time', { ascending: true }),
          supabase
            .from('fixed_events')
            .select('*')
            .eq('user_id', userId),
        ]);

        if (!isMounted) return;

        if (blocksResult.error || eventsResult.error) {
          setError(blocksResult.error?.message ?? eventsResult.error?.message ?? 'Unknown error');
          setLoading(false);
          return;
        }

        const mappedBlocks: ScheduledBlock[] = (blocksResult.data ?? []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          taskId: row.task_id ?? undefined,
          task: row.tasks ? mapRowToTask(row.tasks) : undefined,
          startTime: row.start_time,
          endTime: row.end_time,
          status: row.status,
          day: row.day,
          createdAt: row.created_at,
        }));

        // Filter fixed events to those active on this day of week. The day
        // key is a local calendar date — parse it as one (bare YYYY-MM-DD
        // parses as UTC midnight, which shifts the weekday west of UTC).
        const dayOfWeek = localWeekday(day);
        const mappedEvents: FixedEvent[] = (eventsResult.data ?? [])
          .filter((row) => (row.days_of_week ?? []).includes(dayOfWeek))
          .map((row) => ({
            id: row.id,
            userId: row.user_id,
            title: row.title,
            startTime: row.start_time,
            endTime: row.end_time,
            daysOfWeek: row.days_of_week ?? [],
            recurrenceRule: row.recurrence_rule ?? undefined,
            color: row.color ?? undefined,
            createdAt: row.created_at,
          }));

        setScheduledBlocks(mappedBlocks);
        setFixedEvents(mappedEvents);
        setLoading(false);

        // Anchor the soft paywall trigger — fires only the first time a
        // non-empty schedule is observed; subsequent renders are no-ops.
        if (mappedBlocks.length > 0) {
          void markScheduleRendered();
        }
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
  }, [userId, day, trigger, markScheduleRendered]);

  return { scheduledBlocks, fixedEvents, loading, error, refetch };
}
