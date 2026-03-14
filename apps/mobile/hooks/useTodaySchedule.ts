import { useEffect, useState } from 'react';
import { FixedEvent, ScheduledBlock, Task } from '@aura/shared/types';

interface TodayScheduleResult {
  scheduledBlocks: ScheduledBlock[];
  fixedEvents: FixedEvent[];
  loading: boolean;
  error: string | null;
}

export function useTodaySchedule(userId: string, day: string): TodayScheduleResult {
  const [scheduledBlocks, setScheduledBlocks] = useState<ScheduledBlock[]>([]);
  const [fixedEvents, setFixedEvents] = useState<FixedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // TODO: Supabase — query scheduled_blocks and fixed_events for given user/day
        // scheduled_blocks where user_id = userId AND day = day
        // fixed_events where user_id = userId

        const mockTask: Task = {
          id: 'task-1',
          userId,
          title: 'English essay draft',
          subject: 'English',
          source: 'google_classroom',
          dueDate: `${day}T23:59:00Z`,
          difficulty: 3,
          estimatedMinutes: 60,
          taskType: 'essay',
          status: 'scheduled',
          createdAt: `${day}T00:00:00Z`,
          updatedAt: `${day}T00:00:00Z`,
        };

        const mockBlocks: ScheduledBlock[] = [
          {
            id: 'block-1',
            userId,
            taskId: mockTask.id,
            task: mockTask,
            startTime: `${day}T21:00:00Z`,
            endTime: `${day}T22:00:00Z`,
            status: 'approved',
            day,
            createdAt: `${day}T00:00:00Z`,
          },
        ];

        const mockFixedEvents: FixedEvent[] = [
          {
            id: 'fixed-1',
            userId,
            title: 'Soccer practice',
            startTime: '16:00',
            endTime: '18:00',
            daysOfWeek: [1, 3, 5],
            createdAt: `${day}T00:00:00Z`,
          },
        ];

        if (!isMounted) return;
        setScheduledBlocks(mockBlocks);
        setFixedEvents(mockFixedEvents);
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

  return { scheduledBlocks, fixedEvents, loading, error };
}

