import type { CopilotAction } from '@aura/shared/types';
import { getSupabaseOrNull } from '../lib/supabase';
import { IS_DEMO_MODE } from '../lib/env';

function devLog(label: string, payload: unknown) {
  if (__DEV__ || IS_DEMO_MODE) {
    // eslint-disable-next-line no-console
    console.log(`[STUB] ${label}`, payload);
  }
}

/**
 * Kicks off Pipeline A: pull → normalize → grade → schedule → notify.
 * In real mode this fires a Supabase Edge Function. In demo mode it's a no-op
 * with a console log so the UI flow still works.
 */
export async function triggerDailySync(userId: string): Promise<void> {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    devLog('triggerDailySync', { userId });
    return;
  }
  const { error } = await supabase.functions.invoke('classroom-sync', {
    body: { user_id: userId },
  });
  if (error) throw new Error(error.message);
}

/**
 * Sends a captured photo to the OCR edge function (Pipeline B). The function
 * runs Gemini Flash Vision over the image and writes back structured tasks.
 */
export async function triggerPhotoIngest(
  userId: string,
  photoBase64: string,
): Promise<void> {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    devLog('triggerPhotoIngest', { userId, bytes: photoBase64.length });
    return;
  }
  const { error } = await supabase.functions.invoke('ocr', {
    body: { user_id: userId, image_base64: photoBase64 },
  });
  if (error) throw new Error(error.message);
}

/**
 * Pipeline C — sends a chat message to the copilot Edge Function and returns
 * the parsed action + confirmation. Caller must wait for user confirmation
 * before applying the action to the DB.
 */
export async function triggerCopilotAction(
  userId: string,
  message: string,
): Promise<CopilotAction> {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    devLog('triggerCopilotAction', { userId, message });
    return {
      type: 'reschedule',
      payload: {},
      confirmationMessage:
        'I can move your evening study block to tomorrow morning. Want me to do that?',
    };
  }
  const { data, error } = await supabase.functions.invoke<CopilotAction>('copilot', {
    body: { user_id: userId, message },
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Empty response from copilot');
  return data;
}

/**
 * Promotes all `shadow` blocks for a given day to `approved`. Runs directly
 * against Postgres — RLS limits it to the caller's own rows.
 */
export async function approveShadowSchedule(userId: string, day: string): Promise<void> {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    devLog('approveShadowSchedule', { userId, day });
    return;
  }
  const { error } = await supabase
    .from('scheduled_blocks')
    .update({ status: 'approved' })
    .eq('user_id', userId)
    .eq('day', day)
    .eq('status', 'shadow');
  if (error) throw new Error(error.message);
}

/**
 * Wraps up a task: records actual time + feedback, marks the task completed.
 */
export async function completeTask(
  taskId: string,
  userId: string,
  estimatedMinutes: number,
  actualMinutes: number,
  feedback: 'too_long' | 'about_right' | 'too_short',
): Promise<void> {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    devLog('completeTask', { taskId, actualMinutes, feedback });
    return;
  }
  const { error: insertErr } = await supabase.from('task_completions').insert({
    task_id: taskId,
    user_id: userId,
    estimated_minutes: estimatedMinutes,
    actual_minutes: actualMinutes,
    user_feedback: feedback,
  });
  if (insertErr) throw new Error(insertErr.message);
  const { error: updateErr } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('id', taskId);
  if (updateErr) throw new Error(updateErr.message);
}
