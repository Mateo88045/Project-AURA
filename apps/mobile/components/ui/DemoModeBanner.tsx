import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@aura/shared/constants/colors';
import { IS_DEMO_MODE } from '../../lib/env';

/**
 * A persistent strip at the top of every screen while the app is running on
 * mock data. Removes any ambiguity for testers, reviewers, and yourself about
 * whether the schedule on screen is real.
 */
export function DemoModeBanner() {
  const insets = useSafeAreaInsets();
  if (!IS_DEMO_MODE) return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.banner, { paddingTop: insets.top + 2 }]}
      accessibilityRole="alert"
      accessibilityLabel="Demo mode: data on this screen is mock data, not your real assignments."
    >
      <View style={styles.dot} />
      <Text style={styles.text}>
        Demo mode · the schedule below is mock data
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 6,
    backgroundColor: 'rgba(244,162,97,0.18)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(244,162,97,0.4)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber,
  },
  text: {
    color: Colors.amber,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
