import { Tabs } from 'expo-router';
import { PlainTabBar } from '../../components/ui/PlainTabBar';
import { haptic } from '../../lib/haptics';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <PlainTabBar {...props} />}
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
      <Tabs.Screen name="ai" options={{ title: 'Ask' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* Hide the chat sub-route from the tab bar — still routable */}
      <Tabs.Screen name="ai/chat" options={{ href: null }} />
    </Tabs>
  );
}
