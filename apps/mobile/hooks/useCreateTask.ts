import { useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { Difficulty, Task, TaskSource, TaskType } from '@chronos/shared/types';
import { GUEST_USER_ID, addGuestTask, isGuestId } from '../lib/guest';

export interface CreateTaskInput {
  title: string;
  subject: string;
  dueDate: string; // ISO 8601
  taskType: TaskType;
  estimatedMinutes: number;
  difficulty: Difficulty;
  /** Where the task came from. Defaults to 'manual'. */
  source?: TaskSource;
}

interface CreateTaskResult {
  createTask: (input: CreateTaskInput) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useCreateTask(userId: string): CreateTaskResult {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function createTask(input: CreateTaskInput): Promise<void> {
    setLoading(true);
    setError(null);

    if (isGuestId(userId)) {
      // Guest mode has no real user row — persist the task locally instead of
      // hitting Supabase (the sentinel id would 400 on the uuid column). The
      // task hooks merge these into their guest/demo datasets.
      const now = new Date().toISOString();
      const guestTask: Task = {
        id: `guest-task-${Date.now()}`,
        userId: GUEST_USER_ID,
        title: input.title,
        subject: input.subject,
        source: input.source ?? 'manual',
        dueDate: input.dueDate,
        difficulty: input.difficulty,
        estimatedMinutes: input.estimatedMinutes,
        taskType: input.taskType,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      try {
        await addGuestTask(guestTask);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        const message = 'Could not save the task on this device.';
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      }
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: input.title,
          subject: input.subject,
          due_date: input.dueDate,
          task_type: input.taskType,
          estimated_minutes: input.estimatedMinutes,
          difficulty: input.difficulty,
          source: input.source ?? 'manual',
          status: 'pending',
        });

      setLoading(false);

      if (insertError) {
        setError(insertError.message);
        throw new Error(insertError.message);
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    }
  }

  return { createTask, loading, error };
}
