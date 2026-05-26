import { StyleSheet, View } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';

export default function AmbientOrbs() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />
      <View style={styles.orbMidRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  orbTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Colors.mist,
    opacity: 0.09,
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.steel,
    opacity: 0.11,
  },
  orbMidRight: {
    position: 'absolute',
    top: '42%',
    right: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Colors.mist,
    opacity: 0.06,
  },
});
