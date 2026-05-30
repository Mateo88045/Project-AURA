import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { ScheduledBlock } from '@chronos/shared/types';
import { mapRowToTask } from './useTasksForDay';

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

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

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

  return { shadowBlocks, loading, error, refetch };
}
