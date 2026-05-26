import type { CopilotAction } from '@aura/shared/types';
import { IS_DEMO_MODE } from '../lib/env';

function devLog(label: string, payload: unknown) {
  if (__DEV__ || IS_DEMO_MODE) {
    // eslint-disable-next-line no-console
    console.log(`[STUB] ${label}`, payload);
  }
}

export async function triggerDailySync(userId: string): Promise<void> {
  // TODO: Trigger.dev — fire job 'daily-assignment-trigger' with payload { userId }
  // Steps: fetch Google Classroom + Canvas → normalize → grade (Gemini Flash) →
  // run scheduler → write shadow blocks → push notify user to review.
  devLog('triggerDailySync', { userId });
}

export async function triggerPhotoIngest(
  userId: string,
  photoBase64: string,
): Promise<void> {
  // TODO: Trigger.dev / Supabase Edge Function — invoke 'photo-ingest' with
  // { userId, photoBase64 }. Pipeline B: Gemini Flash Vision → OcrExtraction →
  // user confirm → enter Pipeline A at grading step.
  devLog('triggerPhotoIngest', { userId, bytes: photoBase64.length });
}

export async function triggerCopilotAction(
  userId: string,
  message: string,
): Promise<CopilotAction> {
  // TODO: Supabase Edge Function — invoke 'copilot' with { userId, message }.
  // Pipeline C: assemble context payload → Claude Sonnet → parse JSON action +
  // NL confirmation. Caller must confirm before action is applied to DB.
  devLog('triggerCopilotAction', { userId, message });
  return {
    type: 'reschedule',
    payload: {},
    confirmationMessage:
      'I can move your evening study block to tomorrow morning. Want me to do that?',
  };
}

export async function approveShadowSchedule(userId: string, day: string): Promise<void> {
  // TODO: Supabase — update scheduled_blocks set status='approved'
  // where user_id = userId and day = day and status = 'shadow'.
  devLog('approveShadowSchedule', { userId, day });
}

export async function completeTask(
  taskId: string,
  actualMinutes: number,
  feedback: 'too_long' | 'about_right' | 'too_short',
): Promise<void> {
  // TODO: Supabase — insert into task_completions { task_id, actual_minutes,
  // user_feedback }; update tasks set status='completed'.
  devLog('completeTask', { taskId, actualMinutes, feedback });
}
