import { View, Text } from 'react-native';

/**
 * AI Chat — /(tabs)/ai/chat
 * Status: Shell — layout only, data & copilot wiring TBD.
 */
export default function AIChatScreen() {
  return (
    <View className="flex-1 bg-[#0A1118] items-center justify-center px-[28px]">
      <Text className="text-[#F1FAEE] text-lg font-semibold">Chat with Aura</Text>
      <Text className="text-[#8EAFC2] text-sm mt-2">
        Conversational copilot coming soon. This screen will show your chat
        history and let you ask Aura about your schedule.
      </Text>
    </View>
  );
}

