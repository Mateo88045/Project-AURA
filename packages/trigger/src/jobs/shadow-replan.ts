import { task } from '@trigger.dev/sdk/v3';
import type {
  FixedEvent,
  Guardrail,
  ScheduledBlock,
  Task,
} from '@aura/shared/types';
import { buildSchedule } from '@aura/shared/scheduler';

/**
 * Re-plan shadow schedule for a single day (Pipeline A scheduling only — no LLM).
 *
 * The scheduler itself is implemented in @aura/shared/scheduler. This task is
 * the I/O wrapper: it loads inputs from Supabase, runs buildSchedule, and
 * writes the resulting chunks back as shadow blocks.
 */
export const shadowReplanTask = task({
  id: 'shadow-replan',
  run: async (payload: { userId: string; day: string }) => {
    const { userId, day } = payload;
    console.log('[shadow-replan]', { userId, day });

    // TODO: Supabase — load these from DB:
    //   tasks         FROM tasks WHERE user_id = userId AND status IN ('pending', 'scheduled')
    //   fixedEvents   FROM fixed_events WHERE user_id = userId
    //   guardrails    FROM guardrails WHERE user_id = userId AND active = true
    //   existingBlocks FROM scheduled_blocks WHERE user_id = userId AND day = day
    const tasks: Task[] = [];
    const fixedEvents: FixedEvent[] = [];
    const guardrails: Guardrail[] = [];
    const existingBlocks: ScheduledBlock[] = [];

    const { scheduledChunks, overloadedTasks } = buildSchedule({
      tasks,
      fixedEvents,
      guardrails,
      existingBlocks,
      targetDay: day,
    });

    // TODO: Supabase — for each chunk, INSERT into scheduled_blocks with
    //   status='shadow', user_id=userId, task_id=chunk.taskId,
    //   start_time=chunk.startTime, end_time=chunk.endTime, day=chunk.day.
    // First DELETE existing shadow blocks for (userId, day) to replace cleanly.

    return {
      ok: true as const,
      userId,
      day,
      scheduledChunkCount: scheduledChunks.length,
      overloadedTaskCount: overloadedTasks.length,
    };
  },
});
