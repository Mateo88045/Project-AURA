import type { FixedEvent, ScheduledBlock, Task } from '@chronos/shared/types';
import { GUEST_USER_ID } from './guest';
import { localWeekday, toLocalDayIso } from './localDate';

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

// Demo blocks sit in a fixed after-school window (local time) so guest mode
// always reads as "homework scheduled around your life" — never a block at
// 3 AM. Slot count matches DEMO_TASKS; the last slot ends 20:30.
const DEMO_BLOCK_SLOTS = [
  { hour: 15, minute: 30, durationMinutes: 90 },
  { hour: 17, minute: 30, durationMinutes: 60 },
  { hour: 19, minute: 45, durationMinutes: 45 },
] as const;

// Once the local evening is past the last slot's start, the demo schedule
// rolls to tomorrow afternoon — Today shows a calm finished river, and the
// Week tab carries tomorrow's plan.
const DEMO_ROLLOVER_HOUR = 20;

function demoScheduleDayIso(): string {
  const demoDay = new Date(now);
  if (demoDay.getHours() >= DEMO_ROLLOVER_HOUR) {
    demoDay.setDate(demoDay.getDate() + 1);
  }
  return toLocalDayIso(demoDay);
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
  if (day !== demoScheduleDayIso()) return [];

  const statuses: ScheduledBlock['status'][] = ['approved', 'approved', 'shadow'];

  return DEMO_TASKS.map((task, i) => {
    const slot = DEMO_BLOCK_SLOTS[i];
    // `${day}T00:00:00` (no Z) parses in the device's local zone, so the
    // slots land at local wall-clock times and `day` stays consistent.
    const start = new Date(`${day}T00:00:00`);
    start.setHours(slot.hour, slot.minute, 0, 0);
    const end = new Date(start.getTime() + slot.durationMinutes * 60 * 1000);

    return {
      id: `demo-block-${i + 1}`,
      userId: GUEST_USER_ID,
      taskId: task.id,
      task,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: statuses[i],
      day,
      createdAt: now.toISOString(),
    };
  });
}

export function getDemoFixedEventsForDay(day: string): FixedEvent[] {
  const dayOfWeek = localWeekday(day);
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

// Deterministic per-weekday load so the Week tab shows a believable spread of
// busy vs. clear days instead of an identical column everywhere. Indices point
// into DEMO_TASKS, so the returned tasks keep their stable ids and detail/active
// look-ups by id keep working.
const WEEKDAY_TASK_INDICES: Record<number, number[]> = {
  0: [], // Sun — rest
  1: [0, 1, 2], // Mon — full load
  2: [2], // Tue — light
  3: [0, 2], // Wed
  4: [0, 1, 2], // Thu — full load
  5: [1], // Fri — light
  6: [], // Sat — rest
};

function demoTasksForWeekday(dayIso: string): Task[] {
  return (WEEKDAY_TASK_INDICES[localWeekday(dayIso)] ?? []).map((i) => DEMO_TASKS[i]);
}

export function getDemoTaskCounts(days: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const day of days) {
    const count = demoTasksForWeekday(day).length;
    if (count > 0) counts[day] = count;
  }
  return counts;
}

export function getDemoTasksForDay(day: string): Task[] {
  return demoTasksForWeekday(day);
}
