import { useEffect, useState, useCallback } from 'react';
import type { Task, TaskStatus } from '@aura/shared/types';
import { getSupabaseOrNull } from '../lib/supabase';
import { rowToTask } from './useScheduledBlocks';
import { MOCK_TASKS } from './_mockData';

interface Result {
  data: Task[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTasks(userId: string | null, status?: TaskStatus): Result {
  const supabase = getSupabaseOrNull();
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setData(status ? MOCK_TASKS.filter((x) => x.status === status) : MOCK_TASKS);
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
    let q = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('due_date', { ascending: true });
    if (status) q = q.eq('status', status);
    const { data: rows, error: err } = await q;
    if (err) setError(new Error(err.message));
    setData((rows ?? []).map(rowToTask));
    setLoading(false);
  }, [supabase, userId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refetch: load };
}

export function useTask(taskId: string | null) {
  const supabase = getSupabaseOrNull();
  const [data, setData] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!supabase) {
        setData(MOCK_TASKS.find((x) => x.id === taskId) ?? null);
        setLoading(false);
        return;
      }
      if (!taskId) {
        setData(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: row, error: err } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();
      if (cancelled) return;
      if (err) setError(new Error(err.message));
      setData(row ? rowToTask(row) : null);
      setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase, taskId]);

  return { data, loading, error };
}
