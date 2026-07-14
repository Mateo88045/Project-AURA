import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { TaskBlock } from '../ui/TaskBlock';

// Timeline column geometry, shared by TimelineRow / PastRow / NowDivider and
// the Today screen's RiverLine. The rail is a real column: the river runs
// through its center and every dot sits on that same x — never inside a card.
export const TIMELINE_TIME_WIDTH = 48;
export const TIMELINE_RAIL_WIDTH = 28;
export const TIMELINE_CARD_GAP = 4;
export const TIMELINE_RAIL_X = TIMELINE_TIME_WIDTH + TIMELINE_RAIL_WIDTH / 2;

const DOT_SIZE = 8;

interface TimelineRowProps {
  timeValue: string;
  meridiem: string;
  title: string;
  subject: string;
  estimatedMinutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  variant: 'fixed' | 'scheduled';
}

/**
 * One upcoming row on the Today river: time column, rail dot, task card.
 * Scheduled work gets a filled glowing dot (alive); fixed events get a hollow
 * ghost dot. Both are opaque over the canvas so the river reads as connecting
 * the dots rather than crossing them.
 */
export function TimelineRow({
  timeValue,
  meridiem,
  title,
  subject,
  estimatedMinutes,
  difficulty,
  variant,
}: TimelineRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isScheduled = variant === 'scheduled';

  return (
    <View style={styles.row}>
      <View style={styles.timeWrap}>
        <Text style={styles.timeValue}>{timeValue}</Text>
        <Text style={styles.timeMer}>{meridiem}</Text>
      </View>
      <View style={styles.rail}>
        <View style={[styles.dot, isScheduled ? styles.dotScheduled : styles.dotFixed]} />
      </View>
      <View style={styles.card}>
        <TaskBlock
          title={title}
          subject={subject}
          estimatedMinutes={estimatedMinutes}
          difficulty={difficulty}
          variant={variant}
          showDot={false}
        />
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeWrap: {
      width: TIMELINE_TIME_WIDTH,
      alignItems: 'flex-end',
    },
    timeValue: {
      fontSize: 15,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
      color: c.text.secondary,
      fontVariant: ['tabular-nums'] as const,
      lineHeight: 18,
    },
    timeMer: {
      ...typography.micro,
      color: c.text.secondary,
      marginTop: -1,
    },
    rail: {
      width: TIMELINE_RAIL_WIDTH,
      alignItems: 'center',
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      // Opaque center so the river passes behind, not through, the dot.
      backgroundColor: c.background.primary,
    },
    dotScheduled: {
      backgroundColor: c.accent.sky,
      shadowColor: c.accent.sky,
      shadowOpacity: 0.6,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 },
    },
    dotFixed: {
      borderWidth: 1.5,
      borderColor: c.text.secondary,
    },
    card: {
      flex: 1,
      marginLeft: TIMELINE_CARD_GAP,
    },
  });
}
