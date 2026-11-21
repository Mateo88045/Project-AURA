import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AuraSymbol } from './AuraSymbol';

// Same minimal props contract as GlassTabBar, so the two are interchangeable.
interface TabBarRoute { key: string; name: string }
interface TabBarProps {
  state: { index: number; routes: TabBarRoute[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target?: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

const TABS = [
  { name: 'index', label: 'Today', icon: 'calendar.day.timeline.left' },
  { name: 'week', label: 'Week', icon: 'calendar' },
  { name: 'ai', label: 'Ask', icon: 'bubble.left.and.bubble.right' },
  { name: 'settings', label: 'Settings', icon: 'gearshape' },
] as const;

/** Solid native tab bar: elevated fill, 1px hairline, mist active tint. */
export function PlainTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const activeName = state.routes[state.index]?.name;
  // Sub-routes (ai/chat) get the full screen.
  if (!TABS.some((t) => t.name === activeName)) return null;

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        if (!route) return null;
        const focused = activeName === tab.name;
        const tint = focused ? colors.accent.sky : colors.text.tertiary;
        return (
          <Pressable
            key={route.key}
            style={s.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
          >
            <AuraSymbol name={tab.icon} size={24} color={tint} />
            <Text style={[s.label, { color: tint }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      paddingHorizontal: 8,
      backgroundColor: c.background.elevated,
      borderTopWidth: 1,
      borderTopColor: c.border.glass,
    },
    tab: { flex: 1, minHeight: 49, alignItems: 'center', justifyContent: 'center', gap: 2 },
    label: { fontSize: 10, lineHeight: 12, fontWeight: '500' },
  });
}
