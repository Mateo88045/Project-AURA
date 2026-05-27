import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Colors } from '@aura/shared/constants/colors';

type Variant = 'info' | 'success' | 'error';
interface ToastItem { id: number; message: string; variant: Variant }

interface ToastContextValue {
  show: (message: string, variant?: Variant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, variant: Variant = 'info') => {
    const id = Date.now() + Math.random();
    setItems((curr) => [...curr, { id, message, variant }]);
    setTimeout(() => setItems((curr) => curr.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastViewport items={items} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ items }: { items: ToastItem[] }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={[styles.viewport, { top: insets.top + 12 }]}
    >
      {items.map((t) => (
        <Toast key={t.id} item={t} />
      ))}
    </View>
  );
}

function Toast({ item }: { item: ToastItem }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-12);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 180 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    return () => {
      opacity.value = withTiming(0, { duration: 160 });
    };
  }, [opacity, translateY]);

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const accent =
    item.variant === 'success' ? Colors.green : item.variant === 'error' ? Colors.red : Colors.mist;

  return (
    <Animated.View style={[styles.toast, animated, { borderColor: accent }]}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text style={styles.message} numberOfLines={3}>
        {item.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: 'rgba(10,17,24,0.95)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  message: { color: Colors.textPrimary, fontSize: 14, flex: 1, fontWeight: '500' },
});
