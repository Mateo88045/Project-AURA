import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { formatClock } from '../../lib/time';
import { DifficultyBadge } from '../ui/DifficultyBadge';
import type { Difficulty } from '@aura/shared/types';

type Kind = 'fixed' | 'ai' | 'shadow';

interface Props {
  kind: Kind;
  title: string;
  startTime: string;
  endTime: string;
  subject?: string;
  difficulty?: Difficulty;
  onPress?: () => void;
}

export function TimelineBlock({
  kind,
  title,
  startTime,
  endTime,
  subject,
  difficulty,
  onPress,
}: Props) {
  const isAi = kind === 'ai' || kind === 'shadow';
  const isShadow = kind === 'shadow';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={`${title}, ${formatClock(startTime)} to ${formatClock(endTime)}`}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <View style={styles.dotColumn}>
        {isAi ? (
          <View style={styles.dotWrap}>
            <View style={[styles.glow, isShadow && styles.glowShadow]} />
            <View style={[styles.dotAi, isShadow && styles.dotShadow]} />
          </View>
        ) : (
          <View style={styles.dotFixed} />
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.time}>
          {formatClock(startTime)} → {formatClock(endTime)}
        </Text>
        <Text
          style={[
            styles.title,
            isAi ? styles.titleAi : styles.titleFixed,
            isShadow && styles.titleShadow,
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subject || difficulty ? (
          <View style={styles.meta}>
            {subject ? <Text style={styles.subject}>{subject.toUpperCase()}</Text> : null}
            {difficulty ? <DifficultyBadge difficulty={difficulty} showLabel={false} /> : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const RAIL_X = -16;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 0 },
  pressed: { opacity: 0.7 },
  dotColumn: {
    width: 0,
    position: 'absolute',
    left: RAIL_X - 4,
    top: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.mist,
    opacity: 0.4,
  },
  glowShadow: { opacity: 0.18 },
  dotAi: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.mist,
  },
  dotShadow: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.mist },
  dotFixed: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
    backgroundColor: 'transparent',
  },
  body: { flex: 1, gap: 4, paddingLeft: 4 },
  time: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
  },
  title: { fontSize: 16, letterSpacing: -0.3, lineHeight: 21 },
  titleAi: { color: Colors.textPrimary, fontWeight: '600' },
  titleFixed: { color: Colors.textSecondary, fontWeight: '400' },
  titleShadow: { color: Colors.mist },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  subject: { color: Colors.textSecondary, fontSize: 10, fontWeight: '500', letterSpacing: 2 },
});
