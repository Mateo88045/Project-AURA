import { StyleSheet, View } from 'react-native';
import { Colors } from '@chronos/shared/constants/colors';

interface StepProgressProps {
  total: number;
  current: number;
}

export default function StepProgress({ total, current }: StepProgressProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            i <= current ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
  },
  segment: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  active: {
    backgroundColor: Colors.mist,
  },
  inactive: {
    backgroundColor: `${Colors.steel}33`,
  },
});
