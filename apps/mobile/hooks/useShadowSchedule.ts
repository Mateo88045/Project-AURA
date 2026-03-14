import { useEffect, useState } from 'react';
import { ScheduledBlock, Task } from '@aura/shared/types';

interface ShadowScheduleResult {
  shadowBlocks: ScheduledBlock[];
  loading: boolean;
  error: string | null;
}

export function useShadowSchedule(
  userId: string,
  day: string,
): ShadowScheduleResult {
  const [shadowBlocks, setShadowBlocks] = useState<ScheduledBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // TODO: Supabase — query scheduled_blocks where user_id = userId AND day = day
        // AND status = 'shadow', joined with tasks

        const mockTask: Task = {
          id: 'task-shadow-1',
          userId,
          title: 'History reading',
          subject: 'History',
          source: 'google_classroom',
          dueDate: `${day}T23:59:00Z`,
          difficulty: 2,
          estimatedMinutes: 45,
          taskType: 'reading',
          status: 'scheduled',
          createdAt: `${day}T00:00:00Z`,
          updatedAt: `${day}T00:00:00Z`,
        };

        const mockShadowBlocks: ScheduledBlock[] = [
          {
            id: 'shadow-block-1',
            userId,
            taskId: mockTask.id,
            task: mockTask,
            startTime: `${day}T20:00:00Z`,
            endTime: `${day}T20:45:00Z`,
            status: 'shadow',
            day,
            createdAt: `${day}T00:00:00Z`,
          },
        ];

        if (!isMounted) return;
        setShadowBlocks(mockShadowBlocks);
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
  }, [userId, day]);

  return { shadowBlocks, loading, error };
}

