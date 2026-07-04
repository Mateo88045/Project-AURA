// Lightweight test harness — run with `tsx packages/shared/scheduler.test.ts`
// or any Node runner that understands TS (no test framework needed).

import {
  schedule,
  computeFreeSlots,
  hhmmToMinutes,
  minutesToIso,
  validateProposedPlacement,
  suggestValidPlacement,
  isValidGuardrailValue,
  isoToDayMinutes,
} from './scheduler';
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

// ---------------------------------------------------------------------------
// Copilot proposed-placement validation (guardrail gate for Pipeline C)
// ---------------------------------------------------------------------------

const DAY = '2026-06-01';
function noWorkAfter(time: string): Guardrail {
  return { id: 'g', userId: 'u', ruleType: 'no_work_after', value: { time }, active: true, createdAt: '' };
}

console.log('\nscheduler.ts — copilot placement validation');

test('isoToDayMinutes parses local ISO into day + minute', () => {
  const r = isoToDayMinutes('2026-06-01T21:30:00');
  assert(r !== null && r.day === '2026-06-01' && r.minute === 21 * 60 + 30, 'parse failed');
  assert(isoToDayMinutes('not-a-date') === null, 'should reject garbage');
});

test('proposed time inside a no_work_after window is REJECTED', () => {
  // Student has "no work after 9pm"; copilot proposes 9:30–10:30pm.
  const result = validateProposedPlacement({
    proposed: [{ startTime: `${DAY}T21:30:00`, endTime: `${DAY}T22:30:00` }],
    fixedEventsByDay: { [DAY]: [] },
    guardrails: [noWorkAfter('21:00')],
  });
  assert(!result.valid, 'should be invalid');
  assert(result.violations[0].code === 'no_work_after', `wrong code: ${result.violations[0]?.code}`);
});

test('a rejected after-9pm proposal is REPLACED with a valid earlier alternative', () => {
  const input = {
    proposed: [{ startTime: `${DAY}T21:30:00`, endTime: `${DAY}T22:30:00` }],
    fixedEventsByDay: { [DAY]: [] },
    guardrails: [noWorkAfter('21:00')],
  };
  const suggestion = suggestValidPlacement(input);
  assert(suggestion !== null && suggestion.length > 0, 'expected an alternative slot');
  // Every suggested block must end at or before 9pm and start at/after 6am.
  for (const b of suggestion!) {
    const e = isoToDayMinutes(b.endTime)!;
    const s = isoToDayMinutes(b.startTime)!;
    assert(e.minute <= 21 * 60, `suggestion runs past 9pm: ${b.endTime}`);
    assert(s.minute >= 6 * 60, `suggestion starts before 6am: ${b.startTime}`);
  }
  // And the suggestion itself must pass validation (round-trip proof).
  const recheck = validateProposedPlacement({ ...input, proposed: suggestion! });
  assert(recheck.valid, `suggested slot failed re-validation: ${JSON.stringify(recheck.violations)}`);
});

test('a valid proposed time PASSES and would execute normally', () => {
  const result = validateProposedPlacement({
    proposed: [{ startTime: `${DAY}T16:00:00`, endTime: `${DAY}T17:00:00` }],
    fixedEventsByDay: { [DAY]: [] },
    guardrails: [noWorkAfter('21:00')],
  });
  assert(result.valid, `should be valid: ${JSON.stringify(result.violations)}`);
  assert(result.violations.length === 0, 'no violations expected');
});

test('proposed time overlapping a fixed event is REJECTED', () => {
  const fe: FixedEvent[] = [
    { id: 'fe', userId: 'u', title: 'Practice', startTime: '16:00', endTime: '18:00', daysOfWeek: [1], createdAt: '' },
  ];
  const result = validateProposedPlacement({
    proposed: [{ startTime: `${DAY}T16:30:00`, endTime: `${DAY}T17:30:00` }],
    fixedEventsByDay: { [DAY]: fe },
    guardrails: [],
  });
  assert(!result.valid, 'should be invalid');
  assert(result.violations[0].code === 'fixed_event_conflict', `wrong code: ${result.violations[0]?.code}`);
});

test('proposed time overlapping another task block is REJECTED', () => {
  const result = validateProposedPlacement({
    proposed: [{ startTime: `${DAY}T16:00:00`, endTime: `${DAY}T17:00:00` }],
    fixedEventsByDay: { [DAY]: [] },
    guardrails: [],
    otherBlocksByDay: { [DAY]: [{ startMinute: 16 * 60, endMinute: 17 * 60 }] },
  });
  assert(!result.valid, 'should collide with the existing block');
  assert(result.violations[0].code === 'fixed_event_conflict', `wrong code: ${result.violations[0]?.code}`);
});

test('proposed placement exceeding max_hours_per_day (with other load) is REJECTED', () => {
  const result = validateProposedPlacement({
    proposed: [{ startTime: `${DAY}T09:00:00`, endTime: `${DAY}T10:00:00` }],
    fixedEventsByDay: { [DAY]: [] },
    guardrails: [
      { id: 'g', userId: 'u', ruleType: 'max_hours_per_day', value: { hours: 1.5 }, active: true, createdAt: '' },
    ],
    // 60 already scheduled + 60 proposed = 120 min > 90 min cap.
    otherBlocksByDay: { [DAY]: [{ startMinute: 12 * 60, endMinute: 13 * 60 }] },
  });
  assert(!result.valid, 'should exceed the daily cap');
  assert(result.violations.some((v) => v.code === 'max_hours_per_day'), 'expected max_hours_per_day');
});

test('a task moving within its own slot does not conflict with itself', () => {
  // otherBlocksByDay excludes the moved task, so an empty list = no self-conflict.
  const result = validateProposedPlacement({
    proposed: [{ startTime: `${DAY}T15:00:00`, endTime: `${DAY}T16:00:00` }],
    fixedEventsByDay: { [DAY]: [] },
    guardrails: [],
    otherBlocksByDay: { [DAY]: [] },
  });
  assert(result.valid, 'moving a task within a free day should be fine');
});

test('malformed ISO in a proposal yields invalid_range, not a silent pass', () => {
  const result = validateProposedPlacement({
    proposed: [{ startTime: 'yesterday', endTime: 'later' }],
    fixedEventsByDay: {},
    guardrails: [],
  });
  assert(!result.valid && result.violations[0].code === 'invalid_range', 'should reject garbage times');
});

test('isValidGuardrailValue enforces per-rule-type shapes', () => {
  assert(isValidGuardrailValue('no_work_after', { time: '21:00' }), 'valid time rejected');
  assert(!isValidGuardrailValue('no_work_after', { time: 'banana' }), 'garbage time accepted');
  assert(!isValidGuardrailValue('no_work_after', {}), 'missing time accepted');
  assert(isValidGuardrailValue('max_hours_per_day', { hours: 3 }), 'valid hours rejected');
  assert(!isValidGuardrailValue('max_hours_per_day', { hours: 0 }), 'zero hours accepted');
  assert(isValidGuardrailValue('buffer_after_event', { minutes: 15 }), 'valid buffer rejected');
  assert(!isValidGuardrailValue('buffer_after_event', { minutes: -5 }), 'negative buffer accepted');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
