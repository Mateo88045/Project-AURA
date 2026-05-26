import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { Difficulty } from '@aura/shared/types';
import { Colors, difficultyColor } from '@aura/shared/constants/colors';

interface SubjectCardProps {
  subject: string;
  selected: boolean;
  confidence: Difficulty;
  onToggle: () => void;
  onConfidenceChange: (level: Difficulty) => void;
}

const CONFIDENCE_LEVELS: Difficulty[] = [1, 2, 3, 4, 5];

export default function SubjectCard({
  subject,
  selected,
  confidence,
  onToggle,
  onConfidenceChange,
}: SubjectCardProps) {
  const rowHeight = useSharedValue(0);

  const rowStyle = useAnimatedStyle(() => ({
    height: rowHeight.value,
    overflow: 'hidden',
  }));

  function handleToggle() {
    rowHeight.value = selected
      ? withTiming(0, { duration: 150 })
      : withTiming(40, { duration: 200 });
    onToggle();
  }

  return (
    <Pressable
      onPress={handleToggle}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <View style={styles.topRow}>
        <View style={[styles.dot, selected && styles.dotSelected]} />
        <Text style={[styles.subjectName, selected && styles.subjectNameSelected]}>
          {subject}
        </Text>
      </View>

      <Animated.View style={rowStyle}>
        <View style={styles.confidenceRow}>
          {CONFIDENCE_LEVELS.map((level) => (
            <Pressable
              key={level}
              onPress={() => onConfidenceChange(level)}
              style={[
                styles.bar,
                {
                  backgroundColor:
                    level <= confidence
                      ? difficultyColor(level)
                      : `${Colors.steel}33`,
                },
              ]}
              accessibilityLabel={`Difficulty ${level}`}
            />
          ))}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${Colors.steel}40`,
    backgroundColor: `${Colors.steel}0A`,
    padding: 12,
    margin: 4,
    minHeight: 52,
  },
  cardSelected: {
    borderColor: Colors.steel,
    backgroundColor: `${Colors.steel}1A`,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
  },
  dotSelected: {
    backgroundColor: Colors.mist,
    borderColor: Colors.mist,
  },
  subjectName: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  subjectNameSelected: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  confidenceRow: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: 10,
    paddingBottom: 2,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
