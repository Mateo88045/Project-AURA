import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { hourLabel } from './blockTime';
import { TimelineBlock, type TimelineItem } from './TimelineBlock';

const PX_PER_MIN = 1.8;
const MIN_BLOCK_PX = 30;
const LABEL_W = 48;
const LANE_GAP = 6;

interface Props {
  items: TimelineItem[];
  nowMin: number;
  onStart: (item: TimelineItem) => void;
}

interface Placed {
  item: TimelineItem;
  lane: number;
  lanes: number;
}

/** Side-by-side lanes for overlapping items (e.g. homework during practice). */
function placeInLanes(items: TimelineItem[]): Placed[] {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const placed: Placed[] = [];
  let cluster: Placed[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = laneEnds.length;
    cluster.forEach((p) => { p.lanes = lanes; });
    placed.push(...cluster);
    cluster = [];
    laneEnds = [];
  };
  for (const item of sorted) {
    if (item.startMin >= clusterEnd && cluster.length) flush();
    let lane = laneEnds.findIndex((end) => end <= item.startMin);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(item.endMin); }
    else laneEnds[lane] = item.endMin;
    cluster.push({ item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  if (cluster.length) flush();
  return placed;
}

export function BlocksTimeline({ items, nowMin, onStart }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const firstHour = Math.floor(Math.min(...items.map((i) => i.startMin)) / 60);
  const lastHour = Math.ceil(Math.max(...items.map((i) => i.endMin)) / 60);
  const spanStart = firstHour * 60;
  const height = (lastHour - firstHour) * 60 * PX_PER_MIN;
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i);
  const placed = useMemo(() => placeInLanes(items), [items]);
  const showNow = nowMin >= spanStart && nowMin <= lastHour * 60;

  return (
    <View style={[styles.root, { height: height + 12 }]}>
      {hours.map((h) => {
        const top = (h * 60 - spanStart) * PX_PER_MIN;
        return (
          <View key={h} style={[styles.hourRow, { top }]} pointerEvents="none">
            <Text style={styles.hourText}>{hourLabel(h)}</Text>
            <View style={styles.hairline} />
          </View>
        );
      })}

      <View style={styles.track}>
        {placed.map(({ item, lane, lanes }) => {
          const top = (item.startMin - spanStart) * PX_PER_MIN;
          const h = Math.max((item.endMin - item.startMin) * PX_PER_MIN - 2, MIN_BLOCK_PX);
          const widthPct = 100 / lanes;
          return (
            <View
              key={item.key}
              style={{
                position: 'absolute',
                top,
                left: `${widthPct * lane}%`,
                width: `${widthPct}%`,
                paddingRight: lane < lanes - 1 ? LANE_GAP : 0,
              }}
            >
              <TimelineBlock item={item} height={h} onStart={() => onStart(item)} />
            </View>
          );
        })}
      </View>

      {showNow && (
        <View style={[styles.nowRow, { top: (nowMin - spanStart) * PX_PER_MIN }]} pointerEvents="none">
          <View style={styles.nowDot} />
          <View style={styles.nowLine} />
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { position: 'relative', marginTop: 8 },
    hourRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: -7,
    },
    hourText: {
      width: LABEL_W,
      fontSize: 11,
      fontWeight: '500',
      color: colors.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
    hairline: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.timeline.hairline },
    track: { position: 'absolute', top: 0, bottom: 0, left: LABEL_W, right: 0 },
    nowRow: {
      position: 'absolute',
      left: LABEL_W - 5,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: -5,
    },
    nowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.timeline.nowLine },
    nowLine: { flex: 1, height: 2, backgroundColor: colors.timeline.nowLine },
  });
}
