import { supabase } from '@chronos/shared/supabase';
import type { CopilotAction, Difficulty, GuardrailRuleType, TaskType } from '@chronos/shared/types';
import {
  validateProposedPlacement,
  suggestValidPlacement,
  isValidGuardrailValue,
  isoToDayMinutes,
  type ProposedBlock,
  type SlotViolation,
} from '@chronos/shared/scheduler';
import { assertSchedulingAllowed } from './subscriptionStatus';
import { loadSchedulingContext } from './schedulingContext';

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

/**
 * The copilot proposed a time that violates the student's guardrails, a fixed
 * event, or another scheduled block. Nothing was written. Carries a
 * student-safe reason plus a valid alternative from the deterministic
 * scheduler so the chat UI can offer a one-tap fix.
 */
export class GuardrailViolationError extends Error {
  violations: SlotViolation[];
  suggestion: ProposedBlock[] | null;
  constructor(violations: SlotViolation[], suggestion: ProposedBlock[] | null) {
    super(GuardrailViolationError.buildMessage(violations, suggestion));
    this.name = 'GuardrailViolationError';
    this.violations = violations;
    this.suggestion = suggestion;
  }

  private static buildMessage(
    violations: SlotViolation[],
    suggestion: ProposedBlock[] | null,
  ): string {
    const reason = violations[0]?.message ?? "That time won't work.";
    if (!suggestion || suggestion.length === 0) {
      return `${reason} I couldn't find a free slot that fits — try freeing up some time or adjusting the guardrail.`;
    }
    const label = describeBlocks(suggestion);
    return `${reason} The next slot that fits your rules is ${label}.`;
  }
}

function describeBlocks(blocks: ProposedBlock[]): string {
  return blocks
    .map((b) => {
      const s = isoToDayMinutes(b.startTime);
      const e = isoToDayMinutes(b.endTime);
      if (!s || !e) return '';
      return `${s.day} ${fmt(s.minute)}–${fmt(e.minute)}`;
    })
    .filter(Boolean)
    .join(', ');
}

function fmt(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function requireString(payload: Record<string, unknown>, key: string): string {
  const v = payload[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new CopilotActionError(`Copilot action is missing "${key}"`);
  }
  return v;
}

function requireIso(payload: Record<string, unknown>, key: string): string {
  const v = requireString(payload, key);
  if (!isoToDayMinutes(v)) {
    throw new CopilotActionError(`Copilot action has an invalid timestamp for "${key}"`);
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
 * Runs the copilot's proposed blocks through the SAME rules the deterministic
 * scheduler enforces (packages/shared/scheduler.ts) — guardrails, fixed
 * events, other tasks' blocks, the per-day cap. On violation, throws a
 * GuardrailViolationError carrying a valid alternative; nothing is written.
 */
async function assertPlacementValid(
  userId: string,
  taskId: string,
  proposed: ProposedBlock[],
): Promise<void> {
  const days = proposed.map((b) => b.startTime.slice(0, 10));
  const ctx = await loadSchedulingContext(userId, days, { excludeTaskId: taskId });

  const validationInput = {
    proposed,
    fixedEventsByDay: ctx.fixedEventsByDay,
    guardrails: ctx.guardrails,
    otherBlocksByDay: ctx.otherBlocksByDay,
  };

  const validation = validateProposedPlacement(validationInput);
  if (!validation.valid) {
    const suggestion = suggestValidPlacement(validationInput);
    throw new GuardrailViolationError(validation.violations, suggestion);
  }
}

/**
 * Executes a confirmed CopilotAction (Pipeline C, step "User confirm → Write
 * to DB"). Only called after the student taps Confirm in the chat UI.
 *
 * Time-changing actions (reschedule, spread_task) are gated by
 * assertPlacementValid so a copilot suggestion can't silently violate a
 * guardrail or land on a fixed event — matching how the deterministic
 * scheduler validates its own placements.
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
      return removeTask(userId, action.payload);
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
  const newStartTime = requireIso(payload, 'newStartTime');
  const newEndTime = requireIso(payload, 'newEndTime');

  await assertPlacementValid(userId, taskId, [
    { startTime: newStartTime, endTime: newEndTime },
  ]);

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
  // add_task creates the task but doesn't place a time slot — the next replan
  // schedules it, so there's no proposed block to guardrail-check here. The
  // due date is still validated so we don't persist an unparseable date.
  const dueDate = requireIso(payload, 'dueDate');
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
    estimated_minutes: Math.min(600, Math.max(5, Math.round(estimatedMinutes))),
    difficulty,
    source: 'manual',
    status: 'pending',
  });

  if (error) throw new CopilotActionError(error.message);
}

/** Hard delete, matching the existing "Remove" flow in app/tasks/[id]/index.tsx. */
async function removeTask(userId: string, payload: Record<string, unknown>): Promise<void> {
  const taskId = requireString(payload, 'taskId');
  // Scope by user_id as defense-in-depth even though RLS already enforces it.
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);
  if (error) throw new CopilotActionError(error.message);
}

/** Cancels not-yet-completed blocks for the day; completed blocks are left alone. */
async function clearEvening(userId: string, payload: Record<string, unknown>): Promise<void> {
  const day = requireString(payload, 'day');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new CopilotActionError('Copilot action has an invalid "day"');
  }
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

  const blocks: ProposedBlock[] = blocksRaw.map((b) => {
    if (!b || typeof b !== 'object') {
      throw new CopilotActionError('Copilot action has an invalid block entry');
    }
    const entry = b as Record<string, unknown>;
    return {
      startTime: requireIso(entry, 'startTime'),
      endTime: requireIso(entry, 'endTime'),
    };
  });

  await assertPlacementValid(userId, taskId, blocks);

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
  if (actualMinutes !== undefined && actualMinutes < 0) {
    throw new CopilotActionError('actualMinutes cannot be negative');
  }

  // Scope by user_id so the copilot can only complete the caller's own task.
  const { data: taskRow, error: taskError } = await supabase
    .from('tasks')
    .select('estimated_minutes, status')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();
  if (taskError || !taskRow) {
    throw new CopilotActionError(taskError?.message ?? 'Task not found');
  }
  if (taskRow.status === 'completed') {
    throw new CopilotActionError('That task is already marked complete.');
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('id', taskId)
    .eq('user_id', userId);
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
  const ruleType = ruleTypeRaw as GuardrailRuleType;
  const value = payload.value;
  // Reject a value that doesn't match the rule type's shape — otherwise the
  // scheduler's parsers silently ignore the malformed guardrail and the
  // student thinks a rule is active when it isn't.
  if (!isValidGuardrailValue(ruleType, value)) {
    throw new CopilotActionError(
      `That doesn't look like a valid ${ruleType.replace(/_/g, ' ')} value.`,
    );
  }

  const { error } = await supabase
    .from('guardrails')
    .upsert(
      { user_id: userId, rule_type: ruleType, value: value as Record<string, unknown>, active: true },
      { onConflict: 'user_id,rule_type' },
    );
  if (error) throw new CopilotActionError(error.message);
}
