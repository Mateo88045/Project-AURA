import { useEffect, useState } from 'react';
import type { FixedEvent } from '@aura/shared/types';

interface Result {
  data: FixedEvent[];
  loading: boolean;
  error: Error | null;
}

export function useFixedEvents(userId: string | null): Result {
  // TODO: Supabase — select * from fixed_events where user_id = userId
  // order by start_time asc.
  const [data, setData] = useState<FixedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setData(MOCK_EVENTS);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [userId]);

  return { data, loading, error: null };
}

const MOCK_EVENTS: FixedEvent[] = [
  {
    id: 'fe1',
    userId: 'mock-user',
    title: 'Period 1 — English',
    startTime: '08:15',
    endTime: '09:10',
    daysOfWeek: [1, 2, 3, 4, 5],
    createdAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'fe2',
    userId: 'mock-user',
    title: 'Lunch',
    startTime: '11:50',
    endTime: '12:30',
    daysOfWeek: [1, 2, 3, 4, 5],
    createdAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'fe3',
    userId: 'mock-user',
    title: 'Soccer practice',
    startTime: '16:00',
    endTime: '17:30',
    daysOfWeek: [1, 3, 5],
    createdAt: '2025-09-01T00:00:00Z',
  },
];
