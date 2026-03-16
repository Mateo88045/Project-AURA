// /packages/trigger/src/jobs/daily-trigger.ts
// STUB — Backend (Dev B) owns this file. DO NOT implement in Dev A sessions.
//
// TODO: Trigger.dev — Job: 'daily-assignment-trigger'
// Trigger type: Cron (user-configurable time, default 3:00 PM local)
// Pipeline A steps:
//   1. Fetch — Call Google Classroom API / Canvas API using stored OAuth token
//   2. Extract & Normalize — Raw assignment data → Aura Task schema
//   3. Grade (Gemini Flash) — Send each task + user profile to grader prompt
//   4. Schedule (deterministic) — Run greedy slot-filling algorithm
//   5. Draft Shadow Schedule — Write to Supabase as status: 'shadow'
//   6. Notify — Send push notification: "Aura found N new assignments"

export async function triggerDailySync(userId: string): Promise<void> {
  // TODO: Trigger.dev — fire job 'daily-assignment-trigger' with payload { userId }
  console.log('[STUB] Would trigger daily sync for user:', userId);
}
