import type { Difficulty, TaskType } from '@chronos/shared/types';
import { getAuraApiBaseUrl, getAuraApiHeaders } from './auraClient';

/** Structured assignment fields returned by the vision OCR pipeline (Gemini). */
export interface ScannedTask {
  title: string;
  subject: string;
  taskType: TaskType;
  difficulty: Difficulty;
  estimatedMinutes: number;
  dueDate?: string; // ISO 8601, if a due date was detected
}

const TASK_TYPES: TaskType[] = [
  'essay',
  'problem_set',
  'reading',
  'project',
  'study_guide',
  'quiz_prep',
  'other',
];

function clampDifficulty(n: unknown): Difficulty {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 3;
  return Math.min(5, Math.max(1, v)) as Difficulty;
}

function normalizeType(t: unknown): TaskType {
  return TASK_TYPES.includes(t as TaskType) ? (t as TaskType) : 'other';
}

/**
 * Sends a base64 photo to the Aura API vision endpoint, which runs Gemini Flash
 * Vision and returns structured task fields (Blueprint §6.2, Pipeline B).
 *
 * Throws on any network/parse failure so the caller can fall back to manual
 * entry — the scan screen always stays usable even when the backend is down.
 */
export async function gradeAssignmentPhoto(
  userId: string,
  base64Image: string,
): Promise<ScannedTask> {
  const base = getAuraApiBaseUrl().replace(/\/$/, '');
  const res = await fetch(`${base}/v1/ocr`, {
    method: 'POST',
    headers: getAuraApiHeaders(userId),
    body: JSON.stringify({ image: base64Image }),
  });

  const json = (await res.json().catch(() => null)) as
    | Partial<ScannedTask>
    | { error?: string }
    | null;

  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && 'error' in json && json.error
        ? String(json.error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (!json || typeof json !== 'object' || typeof (json as ScannedTask).title !== 'string') {
    throw new Error('Invalid OCR response');
  }

  const parsed = json as Partial<ScannedTask>;
  return {
    title: parsed.title ?? '',
    subject: parsed.subject ?? '',
    taskType: normalizeType(parsed.taskType),
    difficulty: clampDifficulty(parsed.difficulty),
    estimatedMinutes:
      typeof parsed.estimatedMinutes === 'number' && parsed.estimatedMinutes > 0
        ? Math.min(300, Math.max(15, Math.round(parsed.estimatedMinutes)))
        : 30,
    dueDate: typeof parsed.dueDate === 'string' ? parsed.dueDate : undefined,
  };
}
