import type { Task } from '@chronos/shared/types';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const inTwoDays = new Date(today);
inTwoDays.setDate(today.getDate() + 2);

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    userId: 'mock-user',
    title: 'Read chapter 14 of The Great Gatsby',
    subject: 'English',
    source: 'google_classroom',
    externalId: 'gc-101',
    dueDate: tomorrow.toISOString(),
    difficulty: 2,
    estimatedMinutes: 75,
    taskType: 'reading',
    status: 'scheduled',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: 't2',
    userId: 'mock-user',
    title: 'Calc problem set §4.3 — derivatives review',
    subject: 'Math',
    source: 'canvas',
    externalId: 'cv-203',
    dueDate: tomorrow.toISOString(),
    difficulty: 4,
    estimatedMinutes: 75,
    taskType: 'problem_set',
    status: 'scheduled',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: 't3',
    userId: 'mock-user',
    title: 'Outline argumentative essay on industrial policy',
    subject: 'History',
    source: 'google_classroom',
    externalId: 'gc-301',
    dueDate: inTwoDays.toISOString(),
    difficulty: 3,
    estimatedMinutes: 45,
    taskType: 'essay',
    status: 'scheduled',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: 't4',
    userId: 'mock-user',
    title: 'Stoichiometry quiz prep',
    subject: 'Chemistry',
    source: 'manual',
    dueDate: inTwoDays.toISOString(),
    difficulty: 5,
    estimatedMinutes: 90,
    taskType: 'quiz_prep',
    status: 'pending',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
];
