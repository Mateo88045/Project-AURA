import { useEffect, useState } from 'react';
import type { Guardrail } from '@aura/shared/types';

interface Result {
  data: Guardrail[];
  loading: boolean;
  error: Error | null;
}

export function useGuardrails(userId: string | null): Result {
  // TODO: Supabase — select * from guardrails where user_id = userId and active = true.
  const [data, setData] = useState<Guardrail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setData(MOCK_GUARDRAILS);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [userId]);

  return { data, loading, error: null };
}

const MOCK_GUARDRAILS: Guardrail[] = [
  {
    id: 'g1',
    userId: 'mock-user',
    ruleType: 'no_work_after',
    value: { time: '22:00' },
    active: true,
    createdAt: '2025-09-15T00:00:00Z',
  },
  {
    id: 'g2',
    userId: 'mock-user',
    ruleType: 'buffer_after_event',
    value: { minutes: 15 },
    active: true,
    createdAt: '2025-09-15T00:00:00Z',
  },
  {
    id: 'g3',
    userId: 'mock-user',
    ruleType: 'max_hours_per_day',
    value: { hours: 4 },
    active: true,
    createdAt: '2025-09-15T00:00:00Z',
  },
];
