import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';

/**
 * Tab icon placeholder — will be replaced with proper icons
 * when screens are built.
 */
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      <Text
        style={[
          styles.iconText,
          { color: focused ? Colors.mist : Colors.textSecondary },
        ]}
      >
        {label.charAt(0)}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgDark,
          borderTopColor: 'rgba(168, 218, 220, 0.1)',
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarActiveTintColor: Colors.mist,
        tabBarInactiveTintColor: Colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Today" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: 'Week',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Week" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="AI" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
