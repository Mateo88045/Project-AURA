import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { GlassCard } from './GlassCard';
import { haptic } from '../../lib/haptics';

type ToastType = 'info' | 'success' | 'error';

interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useAuraToast() {
  return useContext(ToastContext);
}

function makeAccentMap(c: ThemeColors): Record<ToastType, string> {
  return {
    info: c.accent.blue,
    success: c.accent.emerald,
    error: c.accent.coral,
  };
}

export function AuraToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const accentMap = useMemo(() => makeAccentMap(colors), [colors]);
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();

  const show = useCallback((text: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}`;
    if (type === 'success') haptic.success();
    if (type === 'error') haptic.error();
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      <View style={styles.flex}>
        {children}
        <View
          style={[styles.stack, { top: insets.top + 8, pointerEvents: 'box-none' }]}
        >
          {messages.map((msg) => (
            <Animated.View
              key={msg.id}
              entering={FadeInUp.springify().damping(18).stiffness(180)}
              exiting={FadeOutUp.duration(200)}
              style={styles.item}
            >
              <GlassCard
                intensity="regular"
                borderAccent
                style={{ ...styles.content, borderLeftColor: accentMap[msg.type], borderLeftWidth: 2 }}
              >
                <Text style={[styles.text, { color: colors.text.primary }]}>{msg.text}</Text>
              </GlassCard>
            </Animated.View>
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stack: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  item: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  text: {
    ...typography.bodyMedium,
  },
});
