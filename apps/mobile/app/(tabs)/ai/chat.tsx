import { View, Text } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';

/**
 * AI Chat — /(tabs)/ai/chat
 * Status: Shell — layout only, data & copilot wiring TBD.
 */
export default function AIChatScreen() {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: Colors.bgDark, paddingHorizontal: Layout.screenPadding }}
    >
      <Text className="text-lg font-semibold" style={{ color: Colors.textPrimary }}>
        Chat with Aura
      </Text>
      <Text className="text-sm mt-2" style={{ color: Colors.textSecondary }}>
        Conversational copilot coming soon. This screen will show your chat
        history and let you ask Aura about your schedule.
      </Text>
    </View>
  );
}

