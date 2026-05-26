import { useEffect, useState, useCallback, useMemo } from 'react';
import type { ScheduledBlock, BlockStatus, Task } from '@aura/shared/types';
import { getSupabaseOrNull } from '../lib/supabase';
import { MOCK_TASKS } from './_mockData';

interface Result {
  data: ScheduledBlock[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useScheduledBlocks(
  userId: string | null,
  day: string,
  statuses: BlockStatus[] = ['approved', 'shadow'],
): Result {
  const supabase = getSupabaseOrNull();
  const [data, setData] = useState<ScheduledBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const statusKey = useMemo(() => statuses.join(','), [statuses]);

  const load = useCallback(async () => {
    if (!supabase) {
      setData(buildMockBlocks(userId ?? 'demo-user', day, statuses));
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
      .from('scheduled_blocks')
      .select('*, task:tasks(*)')
      .eq('user_id', userId)
      .eq('day', day)
      .in('status', statuses)
      .order('start_time', { ascending: true })
      .returns<BlockRow[]>();
    if (err) setError(new Error(err.message));
    setData((rows ?? []).map(rowToBlock));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId, day, statusKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase
      .channel(`scheduled_blocks:${userId}:${day}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_blocks',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, day, load]);

  return { data, loading, error, refetch: load };
}

interface BlockRow {
  id: string;
  user_id: string;
  task_id: string | null;
  start_time: string;
  end_time: string;
  status: string;
  day: string;
  created_at: string;
  task: TaskRow | null;
}

interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  source: string;
  external_id: string | null;
  due_date: string;
  difficulty: number;
  estimated_minutes: number;
  task_type: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

function rowToBlock(row: BlockRow): ScheduledBlock {
  return {
    id: row.id,
    userId: row.user_id,
    taskId: row.task_id ?? undefined,
    task: row.task ? rowToTask(row.task) : undefined,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status as BlockStatus,
    day: row.day,
    createdAt: row.created_at,
  };
}

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    subject: row.subject,
    source: row.source as Task['source'],
    externalId: row.external_id ?? undefined,
    dueDate: row.due_date,
    difficulty: row.difficulty as Task['difficulty'],
    estimatedMinutes: row.estimated_minutes,
    taskType: row.task_type as Task['taskType'],
    status: row.status as Task['status'],
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildMockBlocks(
  userId: string,
  day: string,
  statuses: BlockStatus[],
): ScheduledBlock[] {
  const at = (h: number, m: number) =>
    `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  const blocks: ScheduledBlock[] = [
    {
      id: 'b1',
      userId,
      startTime: at(7, 30),
      endTime: at(8, 0),
      status: 'approved',
      day,
      createdAt: at(0, 0),
    },
    {
      id: 'b2',
      userId,
      taskId: MOCK_TASKS[0].id,
      task: MOCK_TASKS[0],
      startTime: at(15, 30),
      endTime: at(16, 45),
      status: 'approved',
      day,
      createdAt: at(0, 0),
    },
    {
      id: 'b3',
      userId,
      startTime: at(17, 0),
      endTime: at(18, 0),
      status: 'approved',
      day,
      createdAt: at(0, 0),
    },
    {
      id: 'b4',
      userId,
      taskId: MOCK_TASKS[1].id,
      task: MOCK_TASKS[1],
      startTime: at(19, 30),
      endTime: at(20, 45),
      status: 'shadow',
      day,
      createdAt: at(0, 0),
    },
    {
      id: 'b5',
      userId,
      taskId: MOCK_TASKS[2].id,
      task: MOCK_TASKS[2],
      startTime: at(21, 0),
      endTime: at(21, 45),
      status: 'shadow',
      day,
      createdAt: at(0, 0),
    },
  ];
  return blocks.filter((b) => statuses.includes(b.status));
}
