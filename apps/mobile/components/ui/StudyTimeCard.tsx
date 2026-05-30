import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@chronos/shared/constants/colors';

interface StudyTimeCardProps {
  value: 'morning' | 'afternoon' | 'evening';
  label: string;
  subLabel: string;
  selected: boolean;
  onPress: () => void;
}

export default function StudyTimeCard({
  label,
  subLabel,
  selected,
  onPress,
}: StudyTimeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={styles.textBlock}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        <Text style={styles.subLabel}>{subLabel}</Text>
      </View>
      <View style={[styles.checkDot, selected && styles.checkDotSelected]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${Colors.steel}40`,
    backgroundColor: `${Colors.steel}0A`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  cardSelected: {
    borderColor: Colors.mist,
    backgroundColor: `${Colors.mist}14`,
  },
  textBlock: {
    gap: 3,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  labelSelected: {
    color: Colors.textPrimary,
  },
  subLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: `${Colors.steel}66`,
    backgroundColor: Colors.transparent,
  },
  checkDotSelected: {
    backgroundColor: Colors.mist,
    borderColor: Colors.mist,
  },
});
