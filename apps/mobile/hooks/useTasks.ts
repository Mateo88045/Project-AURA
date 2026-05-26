import { useEffect, useState, useCallback } from 'react';
import type { Task, TaskStatus } from '@aura/shared/types';
import { MOCK_TASKS } from './_mockData';

interface Result {
  data: Task[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTasks(userId: string | null, status?: TaskStatus): Result {
  // TODO: Supabase — select * from tasks where user_id = userId
  // and (status = $status or $status is null) order by due_date asc.
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const filtered = status ? MOCK_TASKS.filter((x) => x.status === status) : MOCK_TASKS;
      setData(filtered);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [userId, status]);

  useEffect(load, [load]);

  return { data, loading, error: null, refetch: load };
}

export function useTask(taskId: string | null) {
  // TODO: Supabase — select * from tasks where id = taskId limit 1.
  const [data, setData] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setData(MOCK_TASKS.find((x) => x.id === taskId) ?? null);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [taskId]);

  return { data, loading, error: null as Error | null };
}
