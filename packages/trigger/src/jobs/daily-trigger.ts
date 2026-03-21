import { task, tasks } from '@trigger.dev/sdk/v3';
import type { GraderResult, Task } from '@aura/shared/types';

/**
 * Pipeline A — daily assignment trigger (Trigger.dev).
 * TODO: Supabase — fetch connections, persist tasks/scheduled_blocks.
 * TODO: Integrations — Google Classroom / Canvas fetch + normalize.
 * Grading uses Gemini inside batch-grader task or inline stub until wired.
 */
export const dailyAssignmentTrigger = task({
  id: 'daily-assignment-trigger',
  run: async (payload: { userId: string }) => {
    const { userId } = payload;
    // Stub normalized tasks for future grader wiring
    const stubTasks: Pick<Task, 'title' | 'subject' | 'description'>[] = [];
    console.log('[daily-assignment-trigger] start', { userId });

    // TODO: Trigger.dev — trigger.batch-grader as child task or inline gradeTaskBatch
    const graded: GraderResult[] = [];

    return {
      ok: true as const,
      userId,
      gradedCount: graded.length,
      message:
        'Daily sync stub completed. Wire Classroom/Canvas + Supabase + batch-grader next.',
    };
  },
});

/** Prefer API + tasks.trigger from server; kept for Node scripts. */
export async function triggerDailySync(userId: string): Promise<void> {
  await tasks.trigger('daily-assignment-trigger', { userId });
}
