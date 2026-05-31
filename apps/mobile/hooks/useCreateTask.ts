import { useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { Difficulty, TaskSource, TaskType } from '@chronos/shared/types';

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

      if (insertError) {
        setError(insertError.message);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      setLoading(false);
    }
  }

  return { createTask, loading, error };
}
