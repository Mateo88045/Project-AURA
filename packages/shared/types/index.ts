// ============================================================================
// Chronos — Shared TypeScript Interfaces
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
  firstScheduleRenderedAt?: string; // ISO 8601; anchor for the soft paywall trigger
  // Server-side entitlement source of truth (written by RevenueCat webhook).
  // Trigger.dev jobs read this before doing paid-tier work. See
  // docs/entitlement-design.md.
  entitlementStatus: EntitlementStatus;
  entitlementUpdatedAt?: string; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Entitlement (RevenueCat-shaped)
// ---------------------------------------------------------------------------
// free_preview: pre-paywall. Everything works; trigger sits dormant until the
//               user takes the first interactive action against a rendered
//               schedule.
// trialing:     14-day RevenueCat intro offer active.
// pro:          Paid sub.
// lapsed:       Trial expired without conversion. App is read-only — existing
//               schedule visible, no new ingest/manual create/scheduling/copilot.
export type EntitlementStatus = 'free_preview' | 'trialing' | 'pro' | 'lapsed';

// Derived from EntitlementStatus + first_schedule_rendered_at. The single
// thing screens should branch on. See lib/entitlement.ts.
export type AccessLevel = 'preview' | 'full' | 'gate' | 'readonly';

export interface Entitlement {
  status: EntitlementStatus;
  /** Derived access level — what screens should actually check. */
  access: AccessLevel;
  /** ISO 8601; populated when status === 'trialing'. */
  trialEndsAt?: string;
  /** True iff status === 'trialing' || status === 'pro'. */
  isPro: boolean;
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
export type BlockStatus = 'shadow' | 'approved' | 'rejected' | 'completed';

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

// ---------------------------------------------------------------------------
// Live Activity Types (iOS focus-session widget)
// ---------------------------------------------------------------------------

/** Lifecycle of a focus session as mirrored by the native Live Activity. */
export type LiveActivityStatus = 'running' | 'paused' | 'completed' | 'cancelled';

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
