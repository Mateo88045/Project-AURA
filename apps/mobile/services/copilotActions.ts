import { supabase } from '@chronos/shared/supabase';
import type { CopilotAction, Difficulty, GuardrailRuleType, TaskType } from '@chronos/shared/types';
import { assertSchedulingAllowed } from './subscriptionStatus';

const TASK_TYPES: TaskType[] = [
  'essay',
  'problem_set',
  'reading',
  'project',
  'study_guide',
  'quiz_prep',
  'other',
];

const GUARDRAIL_TYPES: GuardrailRuleType[] = [
  'no_work_after',
  'buffer_after_event',
  'max_hours_per_day',
];

/** A CopilotAction payload didn't match its documented shape (see prompts/copilot.ts). */
export class CopilotActionError extends Error {}

function requireString(payload: Record<string, unknown>, key: string): string {
  const v = payload[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new CopilotActionError(`Copilot action is missing "${key}"`);
  }
  return v;
}

function optionalNumber(payload: Record<string, unknown>, key: string): number | undefined {
  const v = payload[key];
  if (v === undefined) return undefined;
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new CopilotActionError(`Copilot action has an invalid "${key}"`);
  }
  return v;
}

/**
 * Executes a confirmed CopilotAction (Pipeline C, step "User confirm → Write
 * to DB"). Only called after the student taps Confirm in the chat UI — the
 * copilot's system prompt already instructs Claude never to imply a change
 * happened before that confirmation.
 *
 * Note: reschedule/add_task/spread_task write the concrete times Claude
 * proposed directly — they do not re-derive placement via the deterministic
 * scheduler (packages/shared/scheduler.ts). That keeps this executor simple,
 * but means a copilot-driven mutation isn't re-validated against guardrails
 * until the next shadow-replan run.
 */
export async function executeCopilotAction(
  userId: string,
  action: CopilotAction,
): Promise<void> {
  switch (action.type) {
    case 'reschedule':
      return rescheduleTask(userId, action.payload);
    case 'add_task':
      return addTask(userId, action.payload);
    case 'remove_task':
      return removeTask(action.payload);
    case 'clear_evening':
      return clearEvening(userId, action.payload);
    case 'spread_task':
      return spreadTask(userId, action.payload);
    case 'mark_complete':
      return markComplete(userId, action.payload);
    case 'adjust_guardrail':
      return adjustGuardrail(userId, action.payload);
    default:
      throw new CopilotActionError(`Unknown action type "${(action as CopilotAction).type}"`);
  }
}

/** Assumes a single scheduled block per task — multi-block tasks should use spread_task. */
async function rescheduleTask(userId: string, payload: Record<string, unknown>): Promise<void> {
  await assertSchedulingAllowed(userId);
  const taskId = requireString(payload, 'taskId');
  const newStartTime = requireString(payload, 'newStartTime');
  const newEndTime = requireString(payload, 'newEndTime');

  const { error } = await supabase
    .from('scheduled_blocks')
    .update({
      start_time: newStartTime,
      end_time: newEndTime,
      day: newStartTime.slice(0, 10),
    })
    .eq('user_id', userId)
    .eq('task_id', taskId);

  if (error) throw new CopilotActionError(error.message);
}

async function addTask(userId: string, payload: Record<string, unknown>): Promise<void> {
  await assertSchedulingAllowed(userId);
  const title = requireString(payload, 'title');
  const subject = requireString(payload, 'subject');
  const dueDate = requireString(payload, 'dueDate');
  const taskTypeRaw = payload.taskType;
  const taskType: TaskType = TASK_TYPES.includes(taskTypeRaw as TaskType)
    ? (taskTypeRaw as TaskType)
    : 'other';
  const estimatedMinutes = optionalNumber(payload, 'estimatedMinutes') ?? 30;
  const difficultyRaw = optionalNumber(payload, 'difficulty') ?? 3;
  const difficulty = Math.min(5, Math.max(1, Math.round(difficultyRaw))) as Difficulty;

  const { error } = await supabase.from('tasks').insert({
    user_id: userId,
    title,
    subject,
    due_date: dueDate,
    task_type: taskType,
    estimated_minutes: estimatedMinutes,
    difficulty,
    source: 'manual',
    status: 'pending',
  });

  if (error) throw new CopilotActionError(error.message);
}

/** Hard delete, matching the existing "Remove" flow in app/tasks/[id]/index.tsx. */
async function removeTask(payload: Record<string, unknown>): Promise<void> {
  const taskId = requireString(payload, 'taskId');
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw new CopilotActionError(error.message);
}

/** Cancels not-yet-completed blocks for the day; completed blocks are left alone. */
async function clearEvening(userId: string, payload: Record<string, unknown>): Promise<void> {
  const day = requireString(payload, 'day');
  const { error } = await supabase
    .from('scheduled_blocks')
    .delete()
    .eq('user_id', userId)
    .eq('day', day)
    .in('status', ['shadow', 'approved']);

  if (error) throw new CopilotActionError(error.message);
}

async function spreadTask(userId: string, payload: Record<string, unknown>): Promise<void> {
  await assertSchedulingAllowed(userId);
  const taskId = requireString(payload, 'taskId');
  const blocksRaw = payload.blocks;
  if (!Array.isArray(blocksRaw) || blocksRaw.length === 0) {
    throw new CopilotActionError('Copilot action is missing "blocks"');
  }

  const blocks = blocksRaw.map((b) => {
    if (!b || typeof b !== 'object') {
      throw new CopilotActionError('Copilot action has an invalid block entry');
    }
    const entry = b as Record<string, unknown>;
    return {
      startTime: requireString(entry, 'startTime'),
      endTime: requireString(entry, 'endTime'),
    };
  });

  // Replace this task's not-yet-completed blocks with the newly proposed spread.
  const { error: deleteError } = await supabase
    .from('scheduled_blocks')
    .delete()
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .in('status', ['shadow', 'approved']);
  if (deleteError) throw new CopilotActionError(deleteError.message);

  const { error: insertError } = await supabase.from('scheduled_blocks').insert(
    blocks.map((b) => ({
      user_id: userId,
      task_id: taskId,
      start_time: b.startTime,
      end_time: b.endTime,
      day: b.startTime.slice(0, 10),
      status: 'shadow' as const,
    })),
  );
  if (insertError) throw new CopilotActionError(insertError.message);
}

/**
 * Coarser than the dedicated Post-Task Feedback screen (/tasks/[id]/complete)
 * — the copilot doesn't collect a too_long/about_right/too_short rating, so
 * user_feedback is left null rather than guessed.
 */
async function markComplete(userId: string, payload: Record<string, unknown>): Promise<void> {
  const taskId = requireString(payload, 'taskId');
  const actualMinutes = optionalNumber(payload, 'actualMinutes');

  const { data: taskRow, error: taskError } = await supabase
    .from('tasks')
    .select('estimated_minutes')
    .eq('id', taskId)
    .single();
  if (taskError || !taskRow) {
    throw new CopilotActionError(taskError?.message ?? 'Task not found');
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('id', taskId);
  if (updateError) throw new CopilotActionError(updateError.message);

  const { error: completionError } = await supabase.from('task_completions').insert({
    task_id: taskId,
    user_id: userId,
    estimated_minutes: taskRow.estimated_minutes,
    actual_minutes: actualMinutes ?? taskRow.estimated_minutes,
  });
  if (completionError) throw new CopilotActionError(completionError.message);
}

async function adjustGuardrail(userId: string, payload: Record<string, unknown>): Promise<void> {
  const ruleTypeRaw = requireString(payload, 'ruleType');
  if (!GUARDRAIL_TYPES.includes(ruleTypeRaw as GuardrailRuleType)) {
    throw new CopilotActionError(`Unknown guardrail rule type "${ruleTypeRaw}"`);
  }
  const value = payload.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CopilotActionError('Copilot action is missing "value"');
  }

  const { error } = await supabase
    .from('guardrails')
    .upsert(
      { user_id: userId, rule_type: ruleTypeRaw, value: value as Record<string, unknown>, active: true },
      { onConflict: 'user_id,rule_type' },
    );
  if (error) throw new CopilotActionError(error.message);
}
