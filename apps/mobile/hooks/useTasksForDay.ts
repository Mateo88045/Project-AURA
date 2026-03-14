import { useEffect, useState } from 'react';
import { Task } from '@aura/shared/types';

interface TasksForDayResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export function useTasksForDay(userId: string, day: string): TasksForDayResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // TODO: Supabase — query tasks where user_id = userId AND due_date >= day
        // AND status IN ('pending', 'scheduled', 'in_progress')

        const mockTasks: Task[] = [
          {
            id: 'task-1',
            userId,
            title: 'Chemistry problem set',
            subject: 'Chemistry',
            source: 'google_classroom',
            dueDate: `${day}T23:59:00Z`,
            difficulty: 4,
            estimatedMinutes: 90,
            taskType: 'problem_set',
            status: 'pending',
            createdAt: `${day}T00:00:00Z`,
            updatedAt: `${day}T00:00:00Z`,
          },
        ];

        if (!isMounted) return;
        setTasks(mockTasks);
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

  return { tasks, loading, error };
}

