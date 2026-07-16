import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { ScheduledBlock } from '@chronos/shared/types';
import { mapRowToTask } from './useTasksForDay';
import { isGuestId } from '../lib/guest';
import { getDemoScheduledBlocksForDay } from '../lib/demoData';
import { useEntitlement } from '../lib/entitlement';

interface ShadowScheduleResult {
  shadowBlocks: ScheduledBlock[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useShadowSchedule(
  userId: string,
  day: string,
): ShadowScheduleResult {
  const [shadowBlocks, setShadowBlocks] = useState<ScheduledBlock[]>([]);
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

      // Auth not resolved yet (userId still ''). Hold in the loading state
      // rather than querying a uuid column with an empty string (Postgres
      // 22P02); the effect re-runs once a real id arrives.
      if (!userId) return;

      if (isGuestId(userId)) {
        if (isMounted) {
          setShadowBlocks(getDemoScheduledBlocksForDay(day).filter((b) => b.status === 'shadow'));
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from('scheduled_blocks')
          .select('*, tasks(*)')
          .eq('user_id', userId)
          .eq('day', day)
          .eq('status', 'shadow')
          .order('start_time', { ascending: true });

        if (!isMounted) return;

        if (queryError) {
          setError(queryError.message);
          setLoading(false);
          return;
        }

        const mapped: ScheduledBlock[] = (data ?? []).map((row) => ({
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

        setShadowBlocks(mapped);
        setLoading(false);

        // Soft paywall anchor — review-sheet renders count as "seeing a schedule."
        if (mapped.length > 0) {
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

  return { shadowBlocks, loading, error, refetch };
}
