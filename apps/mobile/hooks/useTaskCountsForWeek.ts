import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';

interface TaskCountsResult {
  counts: Record<string, number>; // dayIso (YYYY-MM-DD) -> task count
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTaskCountsForWeek(
  userId: string,
  days: string[],
): TaskCountsResult {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  const daysKey = days.join(',');

  useEffect(() => {
    if (days.length === 0) {
      setCounts({});
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const startDay = days[0];
        const endDay = days[days.length - 1];

        const { data, error: queryError } = await supabase
          .from('tasks')
          .select('due_date')
          .eq('user_id', userId)
          .gte('due_date', `${startDay}T00:00:00Z`)
          .lte('due_date', `${endDay}T23:59:59Z`)
          .in('status', ['pending', 'scheduled', 'in_progress']);

        if (!isMounted) return;

        if (queryError) {
          setError(queryError.message);
          setLoading(false);
          return;
        }

        // Aggregate counts by day
        const aggregated: Record<string, number> = {};
        for (const row of data ?? []) {
          const dayIso = (row.due_date as string).slice(0, 10);
          aggregated[dayIso] = (aggregated[dayIso] ?? 0) + 1;
        }

        setCounts(aggregated);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, daysKey, trigger]);

  return { counts, loading, error, refetch };
}
