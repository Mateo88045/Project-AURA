import { task } from '@trigger.dev/sdk/v3';
import type { Task, GraderResult } from '@aura/shared/types';

/**
 * Grades normalized tasks with Gemini Flash (Pipeline A step 3).
 * TODO: Supabase — read/write tasks table.
 * TODO: Call Gemini with packages/shared/prompts/grader.ts
 */
export async function gradeTaskBatch(
  tasksInput: Pick<Task, 'title' | 'subject' | 'description'>[],
  userId: string,
): Promise<GraderResult[]> {
  console.log('[gradeTaskBatch] stub', { userId, count: tasksInput.length });
  return tasksInput.map(() => ({
    difficulty: 3 as const,
    estimatedMinutes: 45,
    taskType: 'other' as const,
  }));
}

export const batchGraderTask = task({
  id: 'batch-grader',
  run: async (payload: {
    userId: string;
    tasks: Pick<Task, 'title' | 'subject' | 'description'>[];
  }) => {
    const results = await gradeTaskBatch(payload.tasks, payload.userId);
    return { userId: payload.userId, results };
  },
});
