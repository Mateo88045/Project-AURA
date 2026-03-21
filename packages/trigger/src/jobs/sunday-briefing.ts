import { task, tasks } from '@trigger.dev/sdk/v3';

/**
 * Sunday briefing — cron-friendly task (schedule in Trigger.dev dashboard).
 * TODO: Supabase — task_completions aggregates + push notification.
 */
export const sundayBriefingTask = task({
  id: 'sunday-briefing',
  run: async (payload: { userId: string }) => {
    console.log('[sunday-briefing]', payload.userId);
    return {
      ok: true as const,
      userId: payload.userId,
      message: 'Sunday briefing stub — wire task_completions + notify next.',
    };
  },
});

export async function generateSundayBriefing(userId: string): Promise<void> {
  await tasks.trigger('sunday-briefing', { userId });
}
