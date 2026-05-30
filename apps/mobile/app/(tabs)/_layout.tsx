import { Tabs } from 'expo-router';
import { GlassTabBar } from '../../components/ui/GlassTabBar';
import { haptic } from '../../lib/haptics';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      screenListeners={{
        tabPress: () => {
          haptic.selection();
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="week" options={{ title: 'Week' }} />
      <Tabs.Screen name="ai" options={{ title: 'Chronos' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* Hide the chat sub-route from the tab bar — still routable */}
      <Tabs.Screen name="ai/chat" options={{ href: null }} />
    </Tabs>
  );
}
