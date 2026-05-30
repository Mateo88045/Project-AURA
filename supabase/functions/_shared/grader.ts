// Gemini Flash batch grader — Deno-compatible stub.
// Pipeline A, step 4 (Blueprint Section 6.2): rate each task's difficulty,
// estimate minutes, and classify type.

export interface RawTask {
  title: string;
  subject: string;
  description?: string;
}

export interface GraderResult {
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
  taskType:
    | 'essay'
    | 'problem_set'
    | 'reading'
    | 'project'
    | 'study_guide'
    | 'quiz_prep'
    | 'other';
}

/**
 * Calls Gemini Flash 2.0 with the grader prompt + user profile context.
 * Returns one GraderResult per input task in the same order.
 *
 * NOTE: Gemini call is stubbed. Returns safe defaults so daily-trigger can run
 * end-to-end during integration testing. Replace with the real call below.
 */
export async function gradeTaskBatch(
  tasks: RawTask[],
  _userId: string,
): Promise<GraderResult[]> {
  if (tasks.length === 0) return [];

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set — returning safe defaults');
    return tasks.map(() => ({ difficulty: 3, estimatedMinutes: 60, taskType: 'other' }));
  }

  // TODO: real Gemini Flash call.
  //   1. Load user profile (grade_level, onboarding_answers.subjects) from public.users
  //   2. Build messages with GRADER_SYSTEM_PROMPT + user payload
  //   3. POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
  //      with response_mime_type: 'application/json' so we get a parseable response
  //   4. Validate each result: difficulty ∈ [1,5], estimated_minutes > 0, task_type ∈ enum
  //   5. On parse error, return safe default (3, 60, 'other') for that one task — never throw
  console.warn(`[grader] stubbed for ${tasks.length} tasks`);
  return tasks.map(() => ({ difficulty: 3, estimatedMinutes: 60, taskType: 'other' }));
}
