import { task } from '@trigger.dev/sdk/v3';
import type { FixedEvent, Guardrail, Task } from '@chronos/shared/types';
import { schedule } from '@chronos/shared/scheduler';

/**
 * Re-plan shadow schedule for a single day (Pipeline A scheduling only — no LLM).
 *
 * NOTE: Trigger.dev is not part of the launch deployment. The production
 * replan lives in supabase/functions/_shared/scheduleRunner.ts and runs inside
 * the daily-trigger Edge Function. This job remains a typed stub for a future
 * Trigger.dev migration.
 */
export const shadowReplanTask = task({
  id: 'shadow-replan',
  run: async (payload: { userId: string; day: string }) => {
    const { userId, day } = payload;
    console.log('[shadow-replan]', { userId, day });

    // Entitlement gate — docs/entitlement-design.md (Option A "frozen").
    // TODO: Supabase — SELECT entitlement_status FROM users WHERE id = userId;
    //   if 'lapsed', return early with skipped: 'lapsed'.

    // TODO: Supabase — load these from DB:
    //   tasks       FROM tasks WHERE user_id = userId AND status IN ('pending', 'scheduled')
    //   fixedEvents FROM fixed_events WHERE user_id = userId (expanded per weekday)
    //   guardrails  FROM guardrails WHERE user_id = userId AND active = true
    const tasks: Task[] = [];
    const fixedEventsByDay: Record<string, FixedEvent[]> = { [day]: [] };
    const guardrails: Guardrail[] = [];

    const { scheduledChunks, overloadedTasks } = schedule({
      tasks,
      fixedEventsByDay,
      dayKeys: [day],
      guardrails,
    });

    // TODO: Supabase — DELETE existing shadow blocks for (userId, day), then
    //   INSERT each chunk as status='shadow'.

    return {
      ok: true as const,
      userId,
      day,
      scheduledChunkCount: scheduledChunks.length,
      overloadedTaskCount: overloadedTasks.length,
    };
  },
});
