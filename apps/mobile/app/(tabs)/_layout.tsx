import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Home, Calendar, Sparkles, Settings as SettingsIcon } from 'lucide-react-native';
import { Colors } from '@aura/shared/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(10,17,24,0.92)',
          borderTopColor: 'rgba(168,218,220,0.1)',
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 84,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.mist,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: 'Week',
          tabBarIcon: ({ color, size }) => (
            <Calendar color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, size }) => (
            <Sparkles color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
