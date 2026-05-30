import { useCallback, useEffect, useState } from 'react';
import type { FixedEvent } from '@chronos/shared/types';
import { getSupabaseOrNull } from '../lib/supabase';

interface Result {
  data: FixedEvent[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFixedEvents(userId: string | null): Result {
  const supabase = getSupabaseOrNull();
  const [data, setData] = useState<FixedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setData(MOCK_EVENTS);
      setLoading(false);
      return;
    }
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('fixed_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });
    if (err) {
      setError(new Error(err.message));
      setLoading(false);
      return;
    }
    type Row = {
      id: string;
      user_id: string;
      title: string;
      start_time: string;
      end_time: string;
      days_of_week: number[];
      recurrence_rule: string | null;
      color: string | null;
      created_at: string;
    };
    setData(
      (rows ?? []).map((r: Row) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        startTime: r.start_time.slice(0, 5),
        endTime: r.end_time.slice(0, 5),
        daysOfWeek: r.days_of_week,
        recurrenceRule: r.recurrence_rule ?? undefined,
        color: r.color ?? undefined,
        createdAt: r.created_at,
      })),
    );
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    let cancelled = false;
    void load().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { data, loading, error, refetch: load };
}

const MOCK_EVENTS: FixedEvent[] = [
  {
    id: 'fe1',
    userId: 'demo-user',
    title: 'Period 1 — English',
    startTime: '08:15',
    endTime: '09:10',
    daysOfWeek: [1, 2, 3, 4, 5],
    createdAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'fe2',
    userId: 'demo-user',
    title: 'Lunch',
    startTime: '11:50',
    endTime: '12:30',
    daysOfWeek: [1, 2, 3, 4, 5],
    createdAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'fe3',
    userId: 'demo-user',
    title: 'Soccer practice',
    startTime: '16:00',
    endTime: '17:30',
    daysOfWeek: [1, 3, 5],
    createdAt: '2025-09-01T00:00:00Z',
  },
];
