import { ReactNode, useState } from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';

interface AuraToastMessage {
  id: string;
  text: string;
}

interface AuraToastProviderProps {
  children: ReactNode;
}

export function useAuraToast() {
  // TODO: Replace with a proper context-based toast system if needed.
  // For now this is just a stub hook for future wiring.
  return {
    show: (message: string) => {
      // eslint-disable-next-line no-console
      console.log('[AuraToast] show:', message);
    },
  };
}

export function AuraToastProvider({ children }: AuraToastProviderProps) {
  const [messages] = useState<AuraToastMessage[]>([]);

  return (
    <View className="flex-1">
      {children}
      <View className="absolute bottom-6 left-0 right-0 items-center px-[28px]">
        {messages.map((message) => (
          <View
            key={message.id}
            className="w-full rounded-[14px] bg-[#111827] px-4 py-3"
            style={{
              borderWidth: 1,
              borderColor: Colors.mist,
            }}
          >
            <Text className="text-[#F1FAEE] text-sm">{message.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

