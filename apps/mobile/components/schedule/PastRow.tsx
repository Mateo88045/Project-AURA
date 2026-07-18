import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AuraSymbol } from '../ui/AuraSymbol';
import {
  TIMELINE_TIME_WIDTH,
  TIMELINE_RAIL_WIDTH,
  TIMELINE_CARD_GAP,
} from './TimelineRow';

const DOT_SIZE = 8;

interface PastRowProps {
  timeValue: string;
  meridiem: string;
  title: string;
  variant: 'fixed' | 'scheduled';
  /** Shadow draft whose slot has passed — never shown as "done"; it was
      only ever proposed. Rendered hollow-sky with a DRAFT word instead. */
  isDraft?: boolean;
}

/**
 * A finished block on the Today river, collapsed to one quiet line so the
 * day's remaining work owns the screen. Completed work gets an emerald dot
 * and checkmark ("done"); past fixed events simply fade — they weren't tasks.
 */
export function PastRow({ timeValue, meridiem, title, variant, isDraft = false }: PastRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isScheduled = variant === 'scheduled';
  const isDone = isScheduled && !isDraft;

  return (
    <View style={styles.row}>
      <View style={styles.timeWrap}>
        <Text style={styles.time}>{timeValue}</Text>
        <Text style={styles.timeMer}>{meridiem}</Text>
      </View>
      <View style={styles.rail}>
        <View
          style={[styles.dot, isDraft ? styles.dotDraft : isDone ? styles.dotDone : styles.dotFixed]}
        />
      </View>
      <View style={styles.content}>
        {isDone && (
          <AuraSymbol name="checkmark" size={11} color={colors.accent.emerald} />
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {isDraft && <Text style={styles.draftWord}>draft</Text>}
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
    },
    timeWrap: {
      width: TIMELINE_TIME_WIDTH,
      alignItems: 'flex-end',
    },
    time: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: c.text.tertiary,
      fontVariant: ['tabular-nums'] as const,
      lineHeight: 14,
    },
    timeMer: {
      fontSize: 8,
      fontWeight: '600' as const,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
      color: c.text.tertiary,
    },
    rail: {
      width: TIMELINE_RAIL_WIDTH,
      alignItems: 'center',
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      // Opaque center so the river passes behind the dot, matching TimelineRow.
      backgroundColor: c.background.primary,
    },
    dotDone: {
      // Solid (not translucent) so the river stays hidden behind it.
      backgroundColor: c.accent.emerald,
    },
    dotFixed: {
      borderWidth: 1.5,
      borderColor: c.border.glass,
    },
    dotDraft: {
      borderWidth: 1.5,
      borderColor: c.accent.sky,
    },
    content: {
      flex: 1,
      marginLeft: TIMELINE_CARD_GAP,
      paddingLeft: 16, // aligns with TaskBlock's border + inner padding
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    // Secondary, not tertiary — de-emphasis comes from the collapsed layout,
    // not from dropping the text below readable contrast.
    title: {
      ...typography.callout,
      color: c.text.secondary,
      flexShrink: 1,
    },
    draftWord: {
      fontSize: 9,
      fontWeight: '600' as const,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
      color: c.accent.sky,
    },
  });
}
