// ============================================================================
// Aura — Shared TypeScript Interfaces
// All interfaces match the database schema in CLAUDE.md exactly.
// Never define types inline in components — always import from here.
// ============================================================================

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export interface User {
  id: string;
  email: string;
  displayName: string;
  gradeLevel: number;
  onboardingAnswers: OnboardingAnswers;
  dailyTriggerTime: string; // HH:MM (time)
  timezone: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface OnboardingAnswers {
  subjects: SubjectStrength[];
  extracurriculars: string[];
  averageHomeworkHours: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening';
}

export interface SubjectStrength {
  subject: string;
  confidence: 1 | 2 | 3 | 4 | 5;
}

// ---------------------------------------------------------------------------
// Connections (Google Classroom / Canvas)
// ---------------------------------------------------------------------------
export type Platform = 'google_classroom' | 'canvas';
export type ConnectionStatus = 'active' | 'expired' | 'error';

export interface Connection {
  id: string;
  userId: string;
  platform: Platform;
  oauthToken: string;
  refreshToken: string;
  canvasApiToken?: string;
  status: ConnectionStatus;
  lastSyncedAt: string; // ISO 8601
  createdAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Fixed Events (classes, sports, meals — recurring)
// ---------------------------------------------------------------------------
export interface FixedEvent {
  id: string;
  userId: string;
  title: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  daysOfWeek: number[]; // 0=Sun, 6=Sat
  recurrenceRule?: string;
  color?: string;
  createdAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export type TaskSource = 'google_classroom' | 'canvas' | 'manual' | 'photo';
export type TaskType =
  | 'essay'
  | 'problem_set'
  | 'reading'
  | 'project'
  | 'study_guide'
  | 'quiz_prep'
  | 'other';
export type TaskStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed';
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  userId: string;
  title: string;
  subject: string;
  source: TaskSource;
  externalId?: string;
  dueDate: string; // ISO 8601
  difficulty: Difficulty;
  estimatedMinutes: number;
  taskType: TaskType;
  status: TaskStatus;
  description?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Scheduled Blocks (AI-generated calendar entries)
// ---------------------------------------------------------------------------
export type BlockStatus = 'shadow' | 'approved' | 'completed';

export interface ScheduledBlock {
  id: string;
  userId: string;
  taskId?: string;
  task?: Task; // joined
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  status: BlockStatus;
  day: string; // YYYY-MM-DD
  createdAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Task Completions (post-task feedback for velocity tracking)
// ---------------------------------------------------------------------------
export type UserFeedback = 'too_long' | 'about_right' | 'too_short';

export interface TaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  estimatedMinutes: number;
  actualMinutes: number;
  completedAt: string; // ISO 8601
  userFeedback: UserFeedback;
}

// ---------------------------------------------------------------------------
// Guardrails (user-defined scheduling constraints)
// ---------------------------------------------------------------------------
export type GuardrailRuleType =
  | 'no_work_after'
  | 'buffer_after_event'
  | 'max_hours_per_day';

export interface Guardrail {
  id: string;
  userId: string;
  ruleType: GuardrailRuleType;
  value: Record<string, unknown>; // jsonb
  active: boolean;
  createdAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Conversations (copilot chat history)
// ---------------------------------------------------------------------------
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO 8601
}

export interface Conversation {
  id: string;
  userId: string;
  messages: ConversationMessage[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// AI Pipeline Types
// ---------------------------------------------------------------------------

/** Output from the Gemini Flash grader (Pipeline A, Step 3) */
export interface GraderResult {
  difficulty: Difficulty;
  estimatedMinutes: number;
  taskType: TaskType;
}

/** Structured output from Vision OCR (Pipeline B) */
export interface OcrExtraction {
  tasks: Array<{
    title: string;
    subject: string;
    dueDate?: string;
    description?: string;
  }>;
  rawText: string;
}

/** Action output from the Copilot (Pipeline C) */
export interface CopilotAction {
  type: 'reschedule' | 'add_task' | 'remove_task' | 'clear_evening' | 'spread_task';
  payload: Record<string, unknown>;
  confirmationMessage: string;
}

// ---------------------------------------------------------------------------
// Task Sessions (live "focus session" + iOS Live Activity)
// ---------------------------------------------------------------------------
export type TaskSessionStatus = 'running' | 'paused' | 'completed';

/**
 * Status shown on the native Live Activity's final frame. Adds `cancelled`
 * (used when a session is abandoned, replaced, or dropped on sign-out) so the
 * card never claims completion for a task that wasn't finished.
 */
export type LiveActivityStatus = TaskSessionStatus | 'cancelled';

/**
 * A live focus session for a single task — what powers the DoorDash-style
 * widget. The React layer (`useTaskSession`) is the single source of truth;
 * the native iOS Live Activity (ActivityKit) only mirrors this state.
 */
export interface TaskSession {
  taskId: string;
  userId: string;
  title: string;
  subject: string;
  difficulty: Difficulty;
  /** ISO 8601 — when the session was first started. */
  startedAt: string;
  /** Total planned focus time in ms (estimatedMinutes + any extensions). */
  plannedMs: number;
  /**
   * Focused time accrued in ms as of the last pause/resume transition. While
   * the session is running, live elapsed = elapsedMs + (now - runStartedAt).
   */
  elapsedMs: number;
  status: TaskSessionStatus;
}

/**
 * The dynamic payload pushed to the native Live Activity. Timestamps are epoch
 * milliseconds so they cross the JS↔Swift bridge without locale parsing.
 * `startsAt`/`endsAt` drive SwiftUI's self-animating `ProgressView(timerInterval:)`,
 * so the countdown bar advances natively with no per-second push updates.
 */
export interface LiveActivityContentState {
  title: string;
  subject: string;
  difficulty: Difficulty;
  /** Epoch ms marking the start of the visible countdown window. */
  startsAt: number;
  /** Epoch ms when the countdown reaches zero. */
  endsAt: number;
  paused: boolean;
  /** Remaining ms, frozen while paused so the card shows a static value. */
  remainingMs: number;
  status: LiveActivityStatus;
}

/** Static, immutable attributes for a Live Activity instance. */
export interface LiveActivityAttributes {
  taskId: string;
}

// ---------------------------------------------------------------------------
// Scheduling Engine Types
// ---------------------------------------------------------------------------

/** A free time slot identified by the scheduler */
export interface TimeSlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  durationMinutes: number;
}

/** A chunk of a multi-day task assigned to a specific slot */
export interface ScheduledChunk {
  taskId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  day: string; // YYYY-MM-DD
  chunkMinutes: number;
}

/** Result of the scheduling algorithm */
export interface ScheduleResult {
  scheduledChunks: ScheduledChunk[];
  overloadedTasks: Task[];
}
