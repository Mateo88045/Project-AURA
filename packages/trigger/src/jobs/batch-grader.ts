// /packages/trigger/src/jobs/batch-grader.ts
// STUB — Backend (Dev B) owns this file. DO NOT implement in Dev A sessions.
//
// TODO: Trigger.dev — Job: 'batch-grader'
// Trigger type: Invoked by daily-trigger after normalization step
// Steps:
//   1. Receive array of normalized tasks
//   2. For each task, call Gemini Flash with grader prompt + user profile
//   3. Parse structured JSON response: { difficulty, estimated_minutes, task_type }
//   4. Write graded results back to Supabase tasks table

import type { Task, GraderResult } from '@aura/shared/types';

export async function gradeTaskBatch(
  _tasks: Pick<Task, 'title' | 'subject' | 'description'>[],
  _userId: string,
): Promise<GraderResult[]> {
  // TODO: Trigger.dev — implement Gemini Flash batch grading
  console.log('[STUB] Would grade', _tasks.length, 'tasks for user:', _userId);
  return [];
}
