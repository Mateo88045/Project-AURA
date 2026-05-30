import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { FixedEvent, ScheduledBlock } from '@chronos/shared/types';
import { mapRowToTask } from './useTasksForDay';

// ---------------------------------------------------------------------------
// Mock data — used when Supabase tables aren't seeded yet
// TODO: remove once real data is flowing
// ---------------------------------------------------------------------------
function getMockData(day: string): { blocks: ScheduledBlock[]; events: FixedEvent[] } {
  const userId = 'user-1';
  const blocks: ScheduledBlock[] = [
    {
      id: 'mock-block-1',
      userId,
      taskId: 'mock-task-1',
      task: {
        id: 'mock-task-1', userId, title: 'AP Chemistry Problem Set',
        subject: 'Chemistry', source: 'manual', dueDate: `${day}T23:59:00.000Z`,
        difficulty: 4, estimatedMinutes: 90, taskType: 'problem_set',
        status: 'scheduled', createdAt: `${day}T00:00:00.000Z`, updatedAt: `${day}T00:00:00.000Z`,
      },
      startTime: `${day}T15:00:00.000Z`,
      endTime: `${day}T16:30:00.000Z`,
      status: 'approved', day,
      createdAt: `${day}T00:00:00.000Z`,
    },
    {
      id: 'mock-block-2',
      userId,
      taskId: 'mock-task-2',
      task: {
        id: 'mock-task-2', userId, title: 'History Essay Outline',
        subject: 'History', source: 'google_classroom', dueDate: `${day}T23:59:00.000Z`,
        difficulty: 3, estimatedMinutes: 60, taskType: 'essay',
        status: 'scheduled', createdAt: `${day}T00:00:00.000Z`, updatedAt: `${day}T00:00:00.000Z`,
      },
      startTime: `${day}T17:00:00.000Z`,
      endTime: `${day}T18:00:00.000Z`,
      status: 'approved', day,
      createdAt: `${day}T00:00:00.000Z`,
    },
    {
      id: 'mock-block-3',
      userId,
      taskId: 'mock-task-3',
      task: {
        id: 'mock-task-3', userId, title: 'Calculus Reading Ch. 7',
        subject: 'Math', source: 'canvas', dueDate: `${day}T23:59:00.000Z`,
        difficulty: 2, estimatedMinutes: 45, taskType: 'reading',
        status: 'scheduled', createdAt: `${day}T00:00:00.000Z`, updatedAt: `${day}T00:00:00.000Z`,
      },
      startTime: `${day}T19:00:00.000Z`,
      endTime: `${day}T19:45:00.000Z`,
      status: 'shadow', day,
      createdAt: `${day}T00:00:00.000Z`,
    },
  ];
  const dowIndex = new Date(`${day}T12:00:00Z`).getUTCDay();
  const events: FixedEvent[] = [
    {
      id: 'mock-event-1', userId, title: 'AP Chemistry',
      startTime: '08:00', endTime: '09:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      createdAt: `${day}T00:00:00.000Z`,
    },
    {
      id: 'mock-event-2', userId, title: 'Lunch',
      startTime: '12:00', endTime: '13:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      createdAt: `${day}T00:00:00.000Z`,
    },
    {
      id: 'mock-event-3', userId, title: 'Soccer Practice',
      startTime: '16:30', endTime: '18:00',
      daysOfWeek: [1, 3, 5],
      createdAt: `${day}T00:00:00.000Z`,
    },
  ].filter(e => e.daysOfWeek.includes(dowIndex));
  return { blocks, events };
}

interface TodayScheduleResult {
  scheduledBlocks: ScheduledBlock[];
  fixedEvents: FixedEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTodaySchedule(userId: string, day: string): TodayScheduleResult {
  const [scheduledBlocks, setScheduledBlocks] = useState<ScheduledBlock[]>([]);
  const [fixedEvents, setFixedEvents] = useState<FixedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Fetch scheduled blocks with joined task data, plus fixed events in parallel
        const [blocksResult, eventsResult] = await Promise.all([
          supabase
            .from('scheduled_blocks')
            .select('*, tasks(*)')
            .eq('user_id', userId)
            .eq('day', day)
            .in('status', ['approved', 'shadow'])
            .order('start_time', { ascending: true }),
          supabase
            .from('fixed_events')
            .select('*')
            .eq('user_id', userId),
        ]);

        if (!isMounted) return;

        if (blocksResult.error || eventsResult.error) {
          // DB not seeded yet — fall back to mock data so the UI is usable
          const mock = getMockData(day);
          if (isMounted) {
            setScheduledBlocks(mock.blocks);
            setFixedEvents(mock.events);
            setLoading(false);
          }
          return;
        }

        const mappedBlocks: ScheduledBlock[] = (blocksResult.data ?? []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          taskId: row.task_id ?? undefined,
          task: row.tasks ? mapRowToTask(row.tasks) : undefined,
          startTime: row.start_time,
          endTime: row.end_time,
          status: row.status,
          day: row.day,
          createdAt: row.created_at,
        }));

        // Filter fixed events to those active on this day of week
        const dayOfWeek = new Date(day).getDay();
        const mappedEvents: FixedEvent[] = (eventsResult.data ?? [])
          .filter((row) => (row.days_of_week ?? []).includes(dayOfWeek))
          .map((row) => ({
            id: row.id,
            userId: row.user_id,
            title: row.title,
            startTime: row.start_time,
            endTime: row.end_time,
            daysOfWeek: row.days_of_week ?? [],
            recurrenceRule: row.recurrence_rule ?? undefined,
            color: row.color ?? undefined,
            createdAt: row.created_at,
          }));

        setScheduledBlocks(mappedBlocks);
        setFixedEvents(mappedEvents);
        setLoading(false);
      } catch {
        if (!isMounted) return;
        const mock = getMockData(day);
        setScheduledBlocks(mock.blocks);
        setFixedEvents(mock.events);
        setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [userId, day, trigger]);

  return { scheduledBlocks, fixedEvents, loading, error, refetch };
}
