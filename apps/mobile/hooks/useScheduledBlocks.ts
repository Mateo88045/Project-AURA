import { useEffect, useState, useCallback } from 'react';
import type { ScheduledBlock, BlockStatus } from '@aura/shared/types';
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
  // TODO: Supabase — select scheduled_blocks.*, tasks.* from scheduled_blocks
  // left join tasks on scheduled_blocks.task_id = tasks.id
  // where user_id = userId and day = day and status = any(statuses)
  // order by start_time asc.
  const [data, setData] = useState<ScheduledBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setData(buildMockBlocks(userId ?? 'mock-user', day, statuses));
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [userId, day, statuses.join(',')]);

  useEffect(load, [load]);

  return { data, loading, error: null, refetch: load };
}

function buildMockBlocks(
  userId: string,
  day: string,
  statuses: BlockStatus[],
): ScheduledBlock[] {
  const at = (h: number, m: number) => `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
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
