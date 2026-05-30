import { useCallback, useEffect, useState } from 'react';
import type { Guardrail } from '@chronos/shared/types';
import { getSupabaseOrNull } from '../lib/supabase';

interface Result {
  data: Guardrail[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useGuardrails(userId: string | null): Result {
  const supabase = getSupabaseOrNull();
  const [data, setData] = useState<Guardrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setData(MOCK_GUARDRAILS);
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
      .from('guardrails')
      .select('*')
      .eq('user_id', userId);
    if (err) {
      setError(new Error(err.message));
      setLoading(false);
      return;
    }
    type Row = {
      id: string;
      user_id: string;
      rule_type: string;
      value: unknown;
      active: boolean;
      created_at: string;
    };
    setData(
      (rows ?? []).map((r: Row) => ({
        id: r.id,
        userId: r.user_id,
        ruleType: r.rule_type as Guardrail['ruleType'],
        value: (r.value as Record<string, unknown>) ?? {},
        active: r.active,
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

const MOCK_GUARDRAILS: Guardrail[] = [
  {
    id: 'g1',
    userId: 'demo-user',
    ruleType: 'no_work_after',
    value: { time: '22:00' },
    active: true,
    createdAt: '2025-09-15T00:00:00Z',
  },
  {
    id: 'g2',
    userId: 'demo-user',
    ruleType: 'buffer_after_event',
    value: { minutes: 15 },
    active: true,
    createdAt: '2025-09-15T00:00:00Z',
  },
  {
    id: 'g3',
    userId: 'demo-user',
    ruleType: 'max_hours_per_day',
    value: { hours: 4 },
    active: true,
    createdAt: '2025-09-15T00:00:00Z',
  },
];
