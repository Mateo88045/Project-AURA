import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ScheduledBlock, BlockStatus } from '@chronos/shared/types';
import { getSupabaseOrNull } from '../lib/supabase';
import { MOCK_TASKS } from './_mockData';

interface Result {
  /** Map of YYYY-MM-DD → blocks for that day. */
  byDay: Record<string, ScheduledBlock[]>;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Loads all scheduled blocks for a window of days in one round-trip.
 * Used by the Week screen so each day's density bar reflects real data, not
 * just today's. Demo mode produces a deterministic distribution so the bars
 * look meaningful before a real backend is wired up.
 */
export function useWeekScheduledBlocks(
  userId: string | null,
  days: string[],
  statuses: BlockStatus[] = ['approved', 'shadow'],
): Result {
  const supabase = getSupabaseOrNull();
  const [byDay, setByDay] = useState<Record<string, ScheduledBlock[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const daysKey = useMemo(() => days.join(','), [days]);
  const statusKey = useMemo(() => statuses.join(','), [statuses]);

  const load = useCallback(async () => {
    if (!supabase) {
      setByDay(buildMockWeek(userId ?? 'demo-user', days, statuses));
      setLoading(false);
      return;
    }
    if (!userId || days.length === 0) {
      setByDay({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('scheduled_blocks')
      .select('id, user_id, task_id, start_time, end_time, status, day, created_at')
      .eq('user_id', userId)
      .in('day', days)
      .in('status', statuses)
      .order('start_time', { ascending: true });
    if (err) {
      setError(new Error(err.message));
      setLoading(false);
      return;
    }
    const grouped: Record<string, ScheduledBlock[]> = {};
    for (const day of days) grouped[day] = [];
    type Row = {
      id: string;
      user_id: string;
      task_id: string | null;
      start_time: string;
      end_time: string;
      status: string;
      day: string;
      created_at: string;
    };
    for (const r of (rows ?? []) as Row[]) {
      const block: ScheduledBlock = {
        id: r.id,
        userId: r.user_id,
        taskId: r.task_id ?? undefined,
        startTime: r.start_time,
        endTime: r.end_time,
        status: r.status as BlockStatus,
        day: r.day,
        createdAt: r.created_at,
      };
      if (grouped[r.day]) grouped[r.day].push(block);
    }
    setByDay(grouped);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId, daysKey, statusKey]);

  useEffect(() => {
    let cancelled = false;
    void load().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { byDay, loading, error, refetch: load };
}

function buildMockWeek(
  userId: string,
  days: string[],
  statuses: BlockStatus[],
): Record<string, ScheduledBlock[]> {
  const out: Record<string, ScheduledBlock[]> = {};
  const at = (day: string, h: number, m: number) =>
    `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  // Mock distribution: ramps up midweek, lighter on weekends. Realistic-ish.
  const pattern = [0, 2, 3, 4, 2, 1, 0]; // Sun..Sat
  days.forEach((day, idx) => {
    const weekday = new Date(`${day}T12:00:00`).getDay();
    const count = pattern[weekday] ?? 1;
    const blocks: ScheduledBlock[] = [];
    for (let i = 0; i < count; i++) {
      const hour = 15 + i * 2; // 3pm, 5pm, 7pm, ...
      blocks.push({
        id: `mock-${idx}-${i}`,
        userId,
        taskId: MOCK_TASKS[i % MOCK_TASKS.length]?.id,
        task: MOCK_TASKS[i % MOCK_TASKS.length],
        startTime: at(day, hour, 0),
        endTime: at(day, hour + 1, 0),
        status: 'approved',
        day,
        createdAt: at(day, 0, 0),
      });
    }
    out[day] = blocks.filter((b) => statuses.includes(b.status));
  });
  return out;
}
