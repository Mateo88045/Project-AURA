import { View, StyleSheet } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';

type Orb = { top: number; left: number; size: number; color: string; opacity: number };

const DEFAULT_ORBS: Orb[] = [
  { top: -80, left: -60, size: 280, color: Colors.mist, opacity: 0.1 },
  { top: 220, left: 180, size: 220, color: Colors.steel, opacity: 0.08 },
  { top: 540, left: -40, size: 260, color: Colors.mist, opacity: 0.06 },
];

export function AmbientOrbs({ orbs = DEFAULT_ORBS }: { orbs?: Orb[] }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {orbs.map((o, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: o.top,
            left: o.left,
            width: o.size,
            height: o.size,
            borderRadius: o.size / 2,
            backgroundColor: o.color,
            opacity: o.opacity,
          }}
        />
      ))}
    </View>
  );
}
