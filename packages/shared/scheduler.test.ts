// Lightweight test harness — run with `tsx packages/shared/scheduler.test.ts`
// or any Node runner that understands TS (no test framework needed).

import { schedule, computeFreeSlots, hhmmToMinutes, minutesToIso } from './scheduler';
import type { Task, FixedEvent, Guardrail } from './types';

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}\n     ${(e as Error).message}`);
  }
}
function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function task(id: string, minutes: number): Task {
  return {
    id,
    userId: 'u',
    title: id,
    subject: 'Math',
    source: 'manual',
    dueDate: '2026-06-01T00:00:00Z',
    difficulty: 3,
    estimatedMinutes: minutes,
    taskType: 'problem_set',
    status: 'pending',
    createdAt: '',
    updatedAt: '',
  };
}

console.log('\nscheduler.ts');

test('hhmmToMinutes converts correctly', () => {
  assert(hhmmToMinutes('08:30') === 510, 'expected 510');
  assert(hhmmToMinutes('00:00') === 0, 'expected 0');
});

test('minutesToIso composes ISO timestamps', () => {
  assert(minutesToIso('2026-06-01', 480) === '2026-06-01T08:00:00', 'iso mismatch');
});

test('computeFreeSlots returns full window when no events', () => {
  const slots = computeFreeSlots([], 360, 1320, 0);
  assert(slots.length === 1, 'expected one slot');
  assert(slots[0].startMinute === 360 && slots[0].endMinute === 1320, 'wrong bounds');
});

test('computeFreeSlots splits around a fixed event with buffer', () => {
  const fe: FixedEvent[] = [
    {
      id: 'fe',
      userId: 'u',
      title: 'Class',
      startTime: '09:00',
      endTime: '10:00',
      daysOfWeek: [1],
      createdAt: '',
    },
  ];
  const slots = computeFreeSlots(fe, 480, 1080, 15);
  assert(slots.length === 2, 'expected split');
  assert(slots[0].endMinute === 540 - 15, 'buffer not applied before');
  assert(slots[1].startMinute === 600 + 15, 'buffer not applied after');
});

test('empty day schedules a single task fully', () => {
  const result = schedule({
    tasks: [task('t1', 60)],
    fixedEventsByDay: { '2026-06-01': [] },
    dayKeys: ['2026-06-01'],
    guardrails: [],
  });
  assert(result.overloadedTasks.length === 0, 'should not overload');
  const total = result.scheduledChunks.reduce((a, c) => a + c.chunkMinutes, 0);
  assert(total === 60, `expected 60 min scheduled, got ${total}`);
});

test('multi-day chunking splits work across days', () => {
  // 150-min task with a 75-min/day cap must split across exactly two days.
  const result = schedule({
    tasks: [task('t1', 150)],
    fixedEventsByDay: {
      '2026-06-01': [],
      '2026-06-02': [],
    },
    dayKeys: ['2026-06-01', '2026-06-02'],
    guardrails: [
      { id: 'g', userId: 'u', ruleType: 'max_hours_per_day', value: { hours: 1.25 }, active: true, createdAt: '' },
    ],
  });
  const day1 = result.scheduledChunks.filter((c) => c.day === '2026-06-01').reduce((a, c) => a + c.chunkMinutes, 0);
  const day2 = result.scheduledChunks.filter((c) => c.day === '2026-06-02').reduce((a, c) => a + c.chunkMinutes, 0);
  assert(day1 <= 75, `day1 over cap: ${day1}`);
  assert(day2 <= 75, `day2 over cap: ${day2}`);
  assert(day1 + day2 === 150, `total wrong: ${day1 + day2}`);
  assert(result.overloadedTasks.length === 0, 'should not overload');
});

test('no_work_after guardrail is respected', () => {
  const result = schedule({
    tasks: [task('t1', 300)],
    fixedEventsByDay: { '2026-06-01': [] },
    dayKeys: ['2026-06-01'],
    guardrails: [
      { id: 'g', userId: 'u', ruleType: 'no_work_after', value: { time: '12:00' }, active: true, createdAt: '' },
    ],
  });
  const lastChunkEnd = Math.max(
    ...result.scheduledChunks.map((c) => parseInt(c.endTime.slice(11, 13), 10) * 60 + parseInt(c.endTime.slice(14, 16), 10)),
  );
  assert(lastChunkEnd <= 12 * 60, `scheduled past 12:00: ${lastChunkEnd}`);
});

test('overloaded tasks are surfaced', () => {
  const result = schedule({
    tasks: [task('huge', 600)],
    fixedEventsByDay: { '2026-06-01': [] },
    dayKeys: ['2026-06-01'],
    guardrails: [
      { id: 'g', userId: 'u', ruleType: 'no_work_after', value: { time: '08:00' }, active: true, createdAt: '' },
    ],
  });
  assert(result.overloadedTasks.length === 1, 'expected overflow');
});

test('fully booked day yields zero placement', () => {
  const fe: FixedEvent[] = [
    { id: 'a', userId: 'u', title: 'X', startTime: '06:00', endTime: '23:00', daysOfWeek: [1], createdAt: '' },
  ];
  const result = schedule({
    tasks: [task('t1', 60)],
    fixedEventsByDay: { '2026-06-01': fe },
    dayKeys: ['2026-06-01'],
    guardrails: [],
  });
  assert(result.scheduledChunks.length === 0, 'should not schedule into a full day');
  assert(result.overloadedTasks.length === 1, 'should overload');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
