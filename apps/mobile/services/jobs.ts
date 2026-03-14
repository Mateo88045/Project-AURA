import { triggerDailySync } from '@aura/trigger/src/jobs/daily-trigger';
import { generateSundayBriefing } from '@aura/trigger/src/jobs/sunday-briefing';

export async function triggerDailySyncJob(userId: string): Promise<void> {
  // TODO: Trigger.dev — fire job 'daily-assignment-trigger' with payload { userId }
  await triggerDailySync(userId);
}

export async function requestShadowSchedule(
  userId: string,
  day: string,
): Promise<void> {
  // TODO: Trigger.dev — fire job 'daily-assignment-trigger' focused on scheduling for a single day
  // Payload should include { userId, day } so backend can scope the schedule.
  // For now we just log so the UI can be wired.
  // eslint-disable-next-line no-console
  console.log('[STUB] requestShadowSchedule', { userId, day });
}

export async function requestSundayBriefing(userId: string): Promise<void> {
  // TODO: Trigger.dev — fire job 'sunday-briefing' with payload { userId }
  await generateSundayBriefing(userId);
}

