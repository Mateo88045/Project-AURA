import { useMemo, useState, useEffect, type ReactNode } from 'react';
import {
  View,
  Pressable,
  Text,
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import type { ResolvedMode } from '../../lib/theme';
import { AuraSymbol } from './AuraSymbol';
import { haptic } from '../../lib/haptics';
import { Springs } from '@chronos/shared/constants/motion';

// ---------------------------------------------------------------------------
// Minimal structural types for React Navigation's BottomTabBarProps.
// Inlined so we don't have to list @react-navigation/bottom-tabs as a direct
// dep — expo-router already pulls it in transitively.
// ---------------------------------------------------------------------------

interface TabBarRoute {
  key: string;
  name: string;
}
interface TabBarState {
  index: number;
  routes: TabBarRoute[];
}
interface TabBarNavigation {
  emit: (event: {
    type: 'tabPress';
    target?: string;
    canPreventDefault: true;
  }) => { defaultPrevented: boolean };
  navigate: (name: string) => void;
}
interface TabBarProps {
  state: TabBarState;
  navigation: TabBarNavigation;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_WIDTH = SCREEN_WIDTH - 40;
const EXPANDED_HEIGHT = 64;

// Primary tabs shown in the bar, in display order. Any other routes in the
// (tabs) group (e.g. nested sub-routes like 'ai/chat') are filtered out.
const PRIMARY_TABS = ['index', 'week', 'ai', 'settings'] as const;

const TAB_ICONS: Record<string, string> = {
  index: 'calendar.day.timeline.left',
  week: 'calendar',
  ai: 'sparkles',
  settings: 'gearshape',
};

const TAB_LABELS: Record<string, string> = {
  index: 'Today',
  week: 'Week',
  ai: 'Chronos',
  settings: 'Settings',
};

// ---------------------------------------------------------------------------
// Glass availability — synchronous, cached
// ---------------------------------------------------------------------------

let _glassAvailable: boolean | null = null;

function isGlassAvailable(): boolean {
  if (_glassAvailable !== null) return _glassAvailable;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-glass-effect') as typeof import('expo-glass-effect');
    _glassAvailable = mod.isLiquidGlassAvailable?.() ?? false;
  } catch {
    _glassAvailable = false;
  }
  return _glassAvailable;
}

interface GlassBackgroundProps {
  children: ReactNode;
  styles: ReturnType<typeof makeStyles>;
  resolvedMode: ResolvedMode;
}

function GlassBackground({ children, styles, resolvedMode }: GlassBackgroundProps) {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    // isReduceTransparencyEnabled + 'reduceTransparencyChanged' are iOS-only.
    // Skip entirely on web/Android so we don't crash with "is not a function".
    if (Platform.OS !== 'ios') return;

    let cancelled = false;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then((enabled) => {
      if (!cancelled) setReduceTransparency(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  if (reduceTransparency) {
    return <View style={[styles.pill, styles.solidBg]}>{children}</View>;
  }

  if (isGlassAvailable()) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GlassView } = require('expo-glass-effect') as typeof import('expo-glass-effect');
    return (
      <GlassView glassEffectStyle="regular" style={styles.pill}>
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={70}
      tint={resolvedMode === 'light' ? 'light' : 'dark'}
      style={[styles.pill, styles.fallbackBg]}
    >
      {children}
    </BlurView>
  );
}

const TAB_COUNT = PRIMARY_TABS.length;
const TAB_PADDING = 8;
const TAB_WIDTH = (BAR_WIDTH - TAB_PADDING * 2) / TAB_COUNT;
const INDICATOR_WIDTH = 20;

// ---------------------------------------------------------------------------
// Individual tab — extracted so each tab owns its bounce animation via hooks
// ---------------------------------------------------------------------------

interface TabItemProps {
  route: TabBarRoute;
  isFocused: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}

function TabItem({ route, isFocused, onPress, colors, styles }: TabItemProps) {
  const iconName = TAB_ICONS[route.name] ?? 'circle';
  const label = TAB_LABELS[route.name] ?? route.name;
  const iconScale = useSharedValue(1);

  // Bounce the icon when this tab becomes active
  useEffect(() => {
    if (isFocused) {
      iconScale.value = withSpring(1.18, Springs.bouncy);
      // Settle back after the overshoot
      const t = setTimeout(() => {
        iconScale.value = withSpring(1, Springs.gentle);
      }, 180);
      return () => clearTimeout(t);
    }
    iconScale.value = withSpring(1, Springs.gentle);
  }, [isFocused, iconScale]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Pressable
      key={route.key}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.tab}
    >
      <Animated.View style={iconAnimatedStyle}>
        <AuraSymbol
          name={iconName}
          size={22}
          weight={isFocused ? 'semibold' : 'regular'}
          color={isFocused ? colors.accent.blue : colors.text.tertiary}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? colors.accent.blue : colors.text.tertiary,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function GlassTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors, resolvedMode), [colors, resolvedMode]);

  // Filter + reorder: only the four primary tabs are shown, in declared order.
  // Hidden/nested routes (e.g. 'ai/chat') never reach the bar.
  const visibleTabs = PRIMARY_TABS.map((name) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return null;
    const originalIndex = state.routes.indexOf(route);
    return { route, originalIndex };
  }).filter((t): t is { route: TabBarRoute; originalIndex: number } => t !== null);

  // Resolve which visual index (0-3) is active
  const activeVisualIndex = visibleTabs.findIndex(
    ({ originalIndex }) => originalIndex === state.index,
  );

  // Animated sliding indicator — hooks MUST run before any early return
  const indicatorX = useSharedValue(
    TAB_PADDING + Math.max(activeVisualIndex, 0) * TAB_WIDTH + TAB_WIDTH / 2 - INDICATOR_WIDTH / 2,
  );

  useEffect(() => {
    if (activeVisualIndex < 0) return; // sub-route, bar hidden anyway
    const target =
      TAB_PADDING + activeVisualIndex * TAB_WIDTH + TAB_WIDTH / 2 - INDICATOR_WIDTH / 2;
    indicatorX.value = withSpring(target, Springs.bouncy);
  }, [activeVisualIndex, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  // Hide the tab bar on sub-routes (e.g. ai/chat) — only primary tabs show it.
  // This MUST come after all hooks to satisfy React's rules of hooks.
  const activeRouteName = state.routes[state.index]?.name;
  if (activeRouteName && !PRIMARY_TABS.includes(activeRouteName as typeof PRIMARY_TABS[number])) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + 8, height: EXPANDED_HEIGHT },
      ]}
    >
      <GlassBackground styles={styles} resolvedMode={resolvedMode}>
        <View style={styles.tabRow}>
          {visibleTabs.map(({ route, originalIndex }) => {
            const isFocused = state.index === originalIndex;
            return (
              <TabItem
                key={route.key}
                route={route}
                isFocused={isFocused}
                colors={colors}
                styles={styles}
                onPress={() => {
                  haptic.selection();
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
              />
            );
          })}
        </View>
        {/* Sliding indicator pill */}
        <Animated.View
          style={[styles.indicator, { backgroundColor: colors.accent.blue }, indicatorStyle]}
        />
      </GlassBackground>
    </Animated.View>
  );
}

function makeStyles(c: ThemeColors, mode: ResolvedMode) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 20,
      width: BAR_WIDTH,
      alignSelf: 'center',
    },
    pill: {
      flex: 1,
      borderRadius: radius.full,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border.glass,
    },
    fallbackBg: {
      backgroundColor:
        mode === 'light' ? 'rgba(253, 251, 247, 0.82)' : 'rgba(13, 17, 23, 0.8)',
    },
    solidBg: {
      backgroundColor: c.background.elevated,
    },
    tabRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 8,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      minHeight: 44,
    },
    tabLabel: {
      ...typography.micro,
      fontSize: 10,
    },
    indicator: {
      position: 'absolute',
      bottom: 6,
      left: 0,
      width: INDICATOR_WIDTH,
      height: 3,
      borderRadius: 1.5,
    },
  });
}
