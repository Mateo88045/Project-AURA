import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import {
  TIMELINE_TIME_WIDTH,
  TIMELINE_RAIL_WIDTH,
  TIMELINE_CARD_GAP,
} from './TimelineRow';

const DOT_SIZE = 10;

/**
 * The current-time marker on the Today river: a glowing dot on the rail with
 * a hairline sweeping right. Rendered between the last finished row and the
 * next upcoming one, it makes "you are here" legible at a glance.
 */
export function NowDivider() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={styles.timeWrap}>
        <Text style={styles.label}>Now</Text>
      </View>
      <View style={styles.rail}>
        <View style={styles.dot} />
      </View>
      <View style={styles.line} />
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 2,
    },
    timeWrap: {
      width: TIMELINE_TIME_WIDTH,
      alignItems: 'flex-end',
    },
    label: {
      ...typography.micro,
      color: c.accent.sky,
    },
    rail: {
      width: TIMELINE_RAIL_WIDTH,
      alignItems: 'center',
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: c.accent.sky,
      shadowColor: c.accent.sky,
      shadowOpacity: 0.8,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
    },
    line: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      marginLeft: TIMELINE_CARD_GAP,
      backgroundColor: c.accent.sky,
      opacity: 0.35,
    },
  });
}
