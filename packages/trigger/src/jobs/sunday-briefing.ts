// /packages/trigger/src/jobs/sunday-briefing.ts
// STUB — Backend (Dev B) owns this file. DO NOT implement in Dev A sessions.
//
// TODO: Trigger.dev — Job: 'sunday-briefing'
// Trigger type: Cron (every Sunday at user-configured time)
// Steps:
//   1. Query task_completions for the past 7 days
//   2. Calculate "Hours of Productive Work Achieved"
//   3. Calculate velocity trends (estimated vs actual minutes)
//   4. Generate difficulty grade distribution
//   5. Format as push notification + in-app briefing card

export async function generateSundayBriefing(userId: string): Promise<void> {
  // TODO: Trigger.dev — fire job 'sunday-briefing' with payload { userId }
  console.log('[STUB] Would generate Sunday briefing for user:', userId);
}
