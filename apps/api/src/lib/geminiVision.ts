import { GoogleGenerativeAI } from '@google/generative-ai';
import { GRADER_PROMPT_VERSION } from '@chronos/shared/prompts/grader';
import { env } from '../env.js';

/** Structured assignment extracted from a photo (Blueprint §6.2, Pipeline B). */
export type ScannedAssignment = {
  title: string;
  subject: string;
  taskType:
    | 'essay'
    | 'problem_set'
    | 'reading'
    | 'project'
    | 'study_guide'
    | 'quiz_prep'
    | 'other';
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
  dueDate?: string;
  graderPromptVersion: string;
};

const VISION_SYSTEM_PROMPT = `You are Chronos's assignment scanner. You receive a photo of a
homework assignment, worksheet, syllabus, or whiteboard. Extract a single
schedulable task and respond with ONLY a JSON object — no prose, no code fences.

Schema:
{
  "title": string,            // short, specific (e.g. "Ch. 7 problem set 1-20")
  "subject": string,          // best guess (e.g. "AP Chemistry"); "" if unknown
  "taskType": "essay" | "problem_set" | "reading" | "project" | "study_guide" | "quiz_prep" | "other",
  "difficulty": 1-5,          // 1 trivial, 5 very hard, judged for a US high-schooler
  "estimatedMinutes": number, // realistic focused minutes, 15-300
  "dueDate": string | null    // ISO 8601 if a due date is visible, else null
}`;

const TASK_TYPES = [
  'essay',
  'problem_set',
  'reading',
  'project',
  'study_guide',
  'quiz_prep',
  'other',
] as const;

function clampDifficulty(n: unknown): 1 | 2 | 3 | 4 | 5 {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 3;
  return Math.min(5, Math.max(1, v)) as 1 | 2 | 3 | 4 | 5;
}

/**
 * Runs Gemini Flash Vision on a base64 image and returns a structured task.
 * `base64Image` must be raw base64 (no data: URI prefix).
 */
export async function scanAssignmentPhoto(
  base64Image: string,
): Promise<ScannedAssignment> {
  if (!env.googleAiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(env.googleAiKey);
  const model = genAI.getGenerativeModel({
    model: env.geminiVisionModel,
    systemInstruction: VISION_SYSTEM_PROMPT,
  });

  const res = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Extract the assignment from this photo.' },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        ],
      },
    ],
  });

  const text = res.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Vision model returned no JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<ScannedAssignment> & {
    dueDate?: string | null;
  };

  const taskType = TASK_TYPES.includes(parsed.taskType as never)
    ? (parsed.taskType as ScannedAssignment['taskType'])
    : 'other';

  const minutes = Number(parsed.estimatedMinutes);

  return {
    title: typeof parsed.title === 'string' ? parsed.title : '',
    subject: typeof parsed.subject === 'string' ? parsed.subject : '',
    taskType,
    difficulty: clampDifficulty(parsed.difficulty),
    estimatedMinutes: Number.isFinite(minutes)
      ? Math.min(300, Math.max(15, Math.round(minutes)))
      : 30,
    dueDate:
      typeof parsed.dueDate === 'string' && parsed.dueDate.length > 0
        ? parsed.dueDate
        : undefined,
    graderPromptVersion: GRADER_PROMPT_VERSION,
  };
}
