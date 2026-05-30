import { ReactNode, useEffect } from 'react';
import { Modal, Pressable, View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Colors } from '@chronos/shared/constants/colors';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function ChronosSheet({ open, onClose, title, children }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(60);

  useEffect(() => {
    if (open) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 220 });
    } else {
      opacity.value = withTiming(0, { duration: 160 });
      translateY.value = withTiming(60, { duration: 160 });
    }
  }, [open, opacity, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close sheet" />
      </Animated.View>
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.grabber} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bgDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.15)',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: -8 },
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(168,218,220,0.3)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
});
