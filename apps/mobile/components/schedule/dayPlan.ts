import type { ScheduledBlock, FixedEvent } from '@chronos/shared/types';
import type { TimelineItem } from './TimelineBlock';
import { minutesFromHHMM, minutesFromIso, clockLabel, meridiem, durationLabel } from './blockTime';

/** The block running now, else the next upcoming one. Drafts can't be started. */
export function pickFocusBlock(blocks: ScheduledBlock[], nowMs: number): ScheduledBlock | null {
  const sorted = blocks
    .filter((b) => b.task && b.status !== 'shadow' && b.status !== 'rejected' && b.status !== 'completed')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const live = sorted.find(
    (b) => new Date(b.startTime).getTime() <= nowMs && nowMs < new Date(b.endTime).getTime(),
  );
  return live ?? sorted.find((b) => new Date(b.startTime).getTime() > nowMs) ?? null;
}

export function buildItems(
  blocks: ScheduledBlock[],
  events: FixedEvent[],
  focusId: string | null,
): TimelineItem[] {
  const items: TimelineItem[] = events.map((e) => ({
    key: `fixed-${e.id}`,
    kind: 'fixed',
    title: e.title,
    startMin: minutesFromHHMM(e.startTime),
    endMin: minutesFromHHMM(e.endTime),
  }));
  for (const b of blocks) {
    if (!b.task || b.status === 'rejected') continue;
    items.push({
      key: `block-${b.id}`,
      kind: b.status === 'shadow' ? 'draft' : b.id === focusId ? 'live' : 'homework',
      title: b.task.title,
      subject: b.task.subject,
      taskId: b.task.id,
      startMin: minutesFromIso(b.startTime),
      endMin: Math.max(minutesFromIso(b.endTime), minutesFromIso(b.startTime) + 5),
    });
  }
  return items;
}

/** "Free at 8:30 PM" headline plus the "N blocks · X of homework" subline. */
export function daySummary(blocks: ScheduledBlock[], nowMs: number) {
  const work = blocks.filter((b) => b.task && b.status !== 'rejected');
  if (work.length === 0) {
    return { headline: 'A clear day', subline: 'No homework blocks yet' };
  }
  const totalMin = work.reduce(
    (sum, b) => sum + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000,
    0,
  );
  const lastEnd = Math.max(...work.map((b) => new Date(b.endTime).getTime()));
  const subline = `${work.length} ${work.length === 1 ? 'block' : 'blocks'} · ${durationLabel(totalMin)} of homework`;
  if (nowMs >= lastEnd) return { headline: 'Done for today', subline };
  const endMin = minutesFromIso(new Date(lastEnd).toISOString());
  return { headline: `Free at ${clockLabel(endMin)}`, meridiem: meridiem(endMin), subline };
}
