import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import type { FixedEvent, ScheduledBlock } from '@chronos/shared/types';
import { useTheme } from '../../lib/theme';

// The evening starts at 5 PM — after that, "free after" reads as "tonight".
const EVENING_START_MINUTES = 17 * 60;

interface DayPulseProps {
  blocks: ScheduledBlock[];
  fixedEvents: FixedEvent[];
}

interface DayPulseStats {
  statsLine: string;
  voiceLine: string;
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatClock(minutesOfDay: number): string {
  const hours24 = Math.floor(minutesOfDay / 60);
  const minutes = minutesOfDay % 60;
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')}`;
}

function minutesOfDayFromIso(iso: string): number {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
}

function minutesOfDayFromHHMM(hhmm: string): number {
  const [hourStr = '0', minuteStr = '0'] = hhmm.split(':');
  return parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10);
}

function buildStats(
  blocks: ScheduledBlock[],
  fixedEvents: FixedEvent[],
): DayPulseStats | null {
  const taskBlocks = blocks.filter((block) => block.task);
  if (taskBlocks.length === 0) return null;

  const draftBlocks = taskBlocks.filter((block) => block.status === 'shadow');
  const committedBlocks = taskBlocks.filter((block) => block.status !== 'shadow');

  const scheduledMinutes = taskBlocks.reduce((total, block) => {
    const spanMinutes =
      (new Date(block.endTime).getTime() - new Date(block.startTime).getTime()) / 60000;
    return total + Math.max(0, Math.round(spanMinutes));
  }, 0);

  const statsSegments = [
    `${formatDuration(scheduledMinutes)} scheduled`,
    `${committedBlocks.length} ${committedBlocks.length === 1 ? 'task' : 'tasks'}`,
  ];
  if (draftBlocks.length > 0) {
    statsSegments.push(
      `${draftBlocks.length} ${draftBlocks.length === 1 ? 'draft' : 'drafts'} pending`,
    );
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const blocksLeft = taskBlocks.filter(
    (block) => minutesOfDayFromIso(block.endTime) > nowMinutes,
  );

  // The student is "free after" the last busy minute — task blocks AND
  // fixed events (practice, dinner) both count as busy.
  const lastBusyMinute = Math.max(
    ...taskBlocks.map((block) => minutesOfDayFromIso(block.endTime)),
    ...fixedEvents.map((event) => minutesOfDayFromHHMM(event.endTime)),
  );

  let voiceLine: string;
  if (blocksLeft.length === 0) {
    voiceLine = 'All done for today — the evening is yours \u{1F389}';
  } else {
    const blockWord = blocksLeft.length === 1 ? 'block' : 'blocks';
    const freeAt = formatClock(lastBusyMinute);
    voiceLine =
      lastBusyMinute >= EVENING_START_MINUTES
        ? `${blocksLeft.length} ${blockWord} left · free after ${freeAt} tonight`
        : `${blocksLeft.length} ${blockWord} left · free after ${freeAt}`;
  }

  return { statsLine: statsSegments.join(' · '), voiceLine };
}

/**
 * DayPulse — the at-a-glance load readout under the Today title.
 * Line 1: instrument-style stats ("4h 10m scheduled · 2 tasks · 1 draft pending").
 * Line 2: the human read ("2 blocks left · free after 8:15 tonight").
 */
export function DayPulse({ blocks, fixedEvents }: DayPulseProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const stats = useMemo(() => buildStats(blocks, fixedEvents), [blocks, fixedEvents]);

  if (!stats) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.statsLine}>{stats.statsLine}</Text>
      <Text style={styles.voiceLine}>{stats.voiceLine}</Text>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.sm,
      gap: spacing.xs,
    },
    statsLine: {
      ...typography.caption,
      color: c.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
    voiceLine: {
      ...typography.bodyMedium,
      color: c.text.secondary,
    },
  });
}
