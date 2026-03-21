import { task } from '@trigger.dev/sdk/v3';

/**
 * Re-plan shadow schedule for a single day (Pipeline A scheduling only — no LLM).
 */
export const shadowReplanTask = task({
  id: 'shadow-replan',
  run: async (payload: { userId: string; day: string }) => {
    console.log('[shadow-replan]', payload);
    // TODO: Supabase — load tasks/guardrails/fixed_events; run deterministic scheduler; write shadow blocks
    return {
      ok: true as const,
      userId: payload.userId,
      day: payload.day,
      message: 'Shadow replan stub — wire scheduler + Supabase next.',
    };
  },
});
