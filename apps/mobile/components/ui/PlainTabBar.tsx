import { useMemo } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AuraSymbol } from './AuraSymbol';

// Minimal structural slice of React Navigation's BottomTabBarProps.
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target?: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

const PRIMARY_TABS = ['index', 'week', 'ai', 'settings'] as const;
const TAB_ICONS: Record<string, string> = {
  index: 'calendar.day.timeline.left',
  ai: 'sparkles',
  settings: 'gearshape',
};
const TAB_LABELS: Record<string, string> = {
  index: 'Today',
  week: 'Week',
  ai: 'Chronos',
  settings: 'Settings',
};

function BarsIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={6} width={18} height={3} rx={1.5} fill={color} />
      <Rect x={3} y={11} width={12} height={3} rx={1.5} fill={color} />
      <Rect x={3} y={16} width={15} height={3} rx={1.5} fill={color} />
    </Svg>
  );
}

/** Solid, in-flow tab bar: elevated surface, hairline top, deep steel active tint. */
export function PlainTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const activeName = state.routes[state.index]?.name;
  if (!PRIMARY_TABS.includes(activeName as (typeof PRIMARY_TABS)[number])) return null;
  const routes = PRIMARY_TABS.map((n) => state.routes.find((r) => r.name === n)).filter(
    (r): r is { key: string; name: string } => !!r,
  );

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {routes.map((route) => {
        const focused = route.name === activeName;
        const tint = focused ? colors.accent.steelDeep : colors.text.tertiary;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={TAB_LABELS[route.name]}
          >
            {route.name === 'week' ? (
              <BarsIcon color={tint} />
            ) : (
              <AuraSymbol name={TAB_ICONS[route.name]} size={22} color={tint} weight={focused ? 'semibold' : 'medium'} />
            )}
            <Text style={[styles.label, { color: tint }, focused && styles.labelFocused]}>
              {TAB_LABELS[route.name]}
            </Text>
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
      backgroundColor: c.background.elevated,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border.glass,
      paddingTop: 6,
    },
    item: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 },
    label: { fontSize: 11, fontWeight: '500' },
    labelFocused: { fontWeight: '700' },
  });
}
