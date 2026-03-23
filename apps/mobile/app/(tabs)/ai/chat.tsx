import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { AuraButton } from '../../../components/ui/AuraButton';
import {
  sendCopilotMessage,
  type ChatMessagePayload,
} from '../../../services/chatApi';

const MOCK_USER_ID = 'user-1';

type Row = ChatMessagePayload & { id: string };

export default function AIChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [rows, setRows] = useState<Row[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hey — I'm Aura. Ask about your schedule or tell me what you want to move.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userRow: Row = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };
    setInput('');
    setError(null);
    setRows((prev) => [...prev, userRow]);
    setLoading(true);

    const nextMessages: ChatMessagePayload[] = [...rows, userRow].map(
      ({ role, content }) => ({ role, content }),
    );

    try {
      const res = await sendCopilotMessage(MOCK_USER_ID, nextMessages);
      const assistantRow: Row = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.message,
      };
      setRows((prev) => [...prev, assistantRow]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [input, loading, rows]);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: Colors.bgDark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 8}
    >
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: Layout.screenPadding,
        }}
        className="flex-row items-center justify-between pb-3"
      >
        <AuraButton
          label="Back"
          size="sm"
          variant="ghost"
          onPress={() => router.back()}
        />
        <Text
          className="text-base font-semibold flex-1 text-center mr-16"
          style={{ color: Colors.textPrimary }}
        >
          Chat
        </Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View
            className={`mb-3 max-w-[90%] rounded-[14px] px-3 py-2 ${
              item.role === 'user' ? 'self-end' : 'self-start'
            }`}
            style={{
              alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor:
                item.role === 'user' ? Colors.steel : Colors.surface1,
            }}
          >
            <Text className="text-sm" style={{ color: Colors.textPrimary }}>
              {item.content}
            </Text>
          </View>
        )}
        ListFooterComponent={
          error ? (
            <View className="mb-3">
              <Text className="text-sm" style={{ color: Colors.red }}>
                {error}
              </Text>
              <View className="mt-2">
                <AuraButton
                  label="Retry"
                  size="sm"
                  variant="outline"
                  onPress={() => setError(null)}
                />
              </View>
            </View>
          ) : null
        }
      />

      <View
        style={{
          paddingBottom: Math.max(insets.bottom, 12),
          paddingHorizontal: Layout.screenPadding,
          paddingTop: 8,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(69, 123, 157, 0.25)',
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Message Aura…"
          placeholderTextColor={Colors.textSecondary}
          editable={!loading}
          multiline
          className="rounded-[14px] px-4 py-3 text-sm mb-2"
          style={{
            color: Colors.textPrimary,
            backgroundColor: Colors.surface1,
            maxHeight: 120,
          }}
        />
        <AuraButton
          label={loading ? 'Sending…' : 'Send'}
          onPress={() => {
            void send();
          }}
          loading={loading}
          disabled={!input.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 16,
  },
});
