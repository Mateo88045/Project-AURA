import type { FixedEvent, ScheduledBlock, Task } from '@chronos/shared/types';
import { GUEST_USER_ID } from './guest';

/**
 * Guest-mode demo dataset.
 *
 * Guest mode (see guest.ts) never creates a real Supabase user row, so its
 * synthetic id ('guest-user') can never be sent to a query against a uuid
 * column — Postgres rejects it outright. Every hook that reads/writes
 * Supabase must check `isGuestId` first and serve this fixed, in-memory
 * dataset instead. Task ids here are stable so detail/active screens can
 * look a task up by id without ever touching the network.
 */

const now = new Date();

function isoOffsetHours(hours: number): string {
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function todayIso(): string {
  return now.toISOString().slice(0, 10);
}

export const DEMO_TASKS: Task[] = [
  {
    id: 'demo-task-1',
    userId: GUEST_USER_ID,
    title: 'AP Chemistry Problem Set',
    subject: 'Chemistry',
    source: 'manual',
    dueDate: isoOffsetHours(7),
    difficulty: 4,
    estimatedMinutes: 90,
    taskType: 'problem_set',
    status: 'scheduled',
    description: 'Finish problems 12–30 from the unit packet. Show all work for free-response items.',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'demo-task-2',
    userId: GUEST_USER_ID,
    title: 'History Essay Outline',
    subject: 'History',
    source: 'google_classroom',
    dueDate: isoOffsetHours(31),
    difficulty: 3,
    estimatedMinutes: 60,
    taskType: 'essay',
    status: 'scheduled',
    description: 'Outline the Industrial Revolution essay — thesis, three body points, sources.',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'demo-task-3',
    userId: GUEST_USER_ID,
    title: 'Calculus Reading Ch. 7',
    subject: 'Math',
    source: 'canvas',
    dueDate: isoOffsetHours(55),
    difficulty: 2,
    estimatedMinutes: 45,
    taskType: 'reading',
    status: 'pending',
    description: 'Read sections 7.1–7.3 on integration by parts.',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
];

export function getDemoTaskById(taskId: string): Task | undefined {
  return DEMO_TASKS.find((t) => t.id === taskId);
}

export function isDemoTaskId(taskId: string): boolean {
  return taskId.startsWith('demo-task-');
}

export function getDemoScheduledBlocksForDay(day: string): ScheduledBlock[] {
  if (day !== todayIso()) return [];

  const statuses: ScheduledBlock['status'][] = ['approved', 'approved', 'shadow'];
  const startHours = [2, 5, 8];
  const durations = [90, 60, 45];

  return DEMO_TASKS.map((task, i) => ({
    id: `demo-block-${i + 1}`,
    userId: GUEST_USER_ID,
    taskId: task.id,
    task,
    startTime: isoOffsetHours(startHours[i]),
    endTime: isoOffsetHours(startHours[i] + durations[i] / 60),
    status: statuses[i],
    day,
    createdAt: now.toISOString(),
  }));
}

export function getDemoFixedEventsForDay(day: string): FixedEvent[] {
  const dayOfWeek = new Date(`${day}T12:00:00Z`).getUTCDay();
  const events: FixedEvent[] = [
    {
      id: 'demo-event-1',
      userId: GUEST_USER_ID,
      title: 'AP Chemistry',
      startTime: '08:00',
      endTime: '09:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      createdAt: now.toISOString(),
    },
    {
      id: 'demo-event-2',
      userId: GUEST_USER_ID,
      title: 'Lunch',
      startTime: '12:00',
      endTime: '13:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      createdAt: now.toISOString(),
    },
    {
      id: 'demo-event-3',
      userId: GUEST_USER_ID,
      title: 'Soccer Practice',
      startTime: '16:30',
      endTime: '18:00',
      daysOfWeek: [1, 3, 5],
      createdAt: now.toISOString(),
    },
  ];
  return events.filter((e) => e.daysOfWeek.includes(dayOfWeek));
}

export function getDemoTaskCounts(days: string[]): Record<string, number> {
  const today = todayIso();
  if (!days.includes(today)) return {};
  return { [today]: DEMO_TASKS.length };
}

export function getDemoTasksForDay(day: string): Task[] {
  // Demo tasks are anchored to "now", not a specific calendar day — show the
  // same fixed set on any day the user inspects so the Week tab has content.
  void day;
  return DEMO_TASKS;
}
