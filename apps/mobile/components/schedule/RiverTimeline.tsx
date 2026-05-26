import { ReactNode, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { nowPercentOfDay } from '../../lib/time';

interface Props {
  children: ReactNode;
  /** When true, render the glowing "now" indicator. */
  showNow?: boolean;
}

/**
 * The river — a single 1px vertical thread that the day flows along.
 * Children are TimelineBlock items stacked vertically. The "now" indicator
 * sits at the calendar position closest to the current local time.
 */
export function RiverTimeline({ children, showNow = true }: Props) {
  const nowPercent = useMemo(() => nowPercentOfDay(), []);
  return (
    <View style={styles.container}>
      <View style={styles.line} pointerEvents="none" />
      {showNow ? (
        <View
          pointerEvents="none"
          style={[
            styles.nowWrap,
            { top: `${Math.min(95, Math.max(2, nowPercent * 100))}%` },
          ]}
        >
          <View style={styles.nowGlow} />
          <View style={styles.nowDot} />
        </View>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const RAIL_X = 12;

const styles = StyleSheet.create({
  container: { position: 'relative', paddingLeft: RAIL_X + 16 },
  line: {
    position: 'absolute',
    left: RAIL_X,
    top: 0,
    bottom: 0,
    width: Layout.riverLineWidth,
    backgroundColor: Colors.mist,
    opacity: 0.35,
  },
  content: { gap: 18 },
  nowWrap: {
    position: 'absolute',
    left: RAIL_X - 5,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowGlow: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.mist,
    opacity: 0.25,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mist,
    shadowColor: Colors.mist,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
