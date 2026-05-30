import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { Colors } from '@chronos/shared/constants/colors';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { ChronosSkeleton } from '../../components/ui/ChronosSkeleton';
import { useToast } from '../../components/ui/ChronosToast';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useConversation } from '../../hooks/useConversation';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { data: user } = useCurrentUser();
  const { messages, sending, error, send } = useConversation(user?.id ?? null);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const lastSurfacedErrorRef = useRef<Error | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length, sending]);

  // Surface copilot failures to the user via toast. Compared by reference so
  // the same error isn't shown repeatedly on re-render.
  useEffect(() => {
    if (error && error !== lastSurfacedErrorRef.current) {
      lastSurfacedErrorRef.current = error;
      toast.show(
        error.message || "Chronos couldn't reach the copilot. Try again in a moment.",
        'error',
      );
    }
  }, [error, toast]);

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    send(text);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: Colors.bgDark }}
    >
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <AmbientOrbs />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
            <ArrowLeft color={Colors.textSecondary} size={20} />
          </Pressable>
          <View>
            <Text style={styles.title}>Chronos</Text>
            <Text style={styles.subtitle}>Always-on copilot</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                m.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text style={m.role === 'user' ? styles.userText : styles.assistantText}>
                {m.content}
              </Text>
            </View>
          ))}
          {sending ? (
            <View style={[styles.bubble, styles.assistantBubble, { paddingVertical: 14 }]}>
              <ChronosSkeleton width={120} height={10} />
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Move my evening study to morning…"
            placeholderTextColor="rgba(142,175,194,0.5)"
            multiline
            onSubmitEditing={onSend}
            blurOnSubmit={false}
            returnKeyType="send"
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim() || sending}
            accessibilityLabel="Send"
            style={({ pressed }) => [
              styles.sendBtn,
              (!draft.trim() || sending) && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Send color={Colors.bgDark} size={18} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168,218,220,0.08)',
  },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { color: Colors.textSecondary, fontSize: 11, letterSpacing: 1.5, fontWeight: '500' },
  messages: { padding: 20, gap: 10, paddingBottom: 40 },
  bubble: {
    maxWidth: '84%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168,218,220,0.08)',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.steel,
    borderTopRightRadius: 4,
  },
  assistantText: { color: Colors.textPrimary, fontSize: 15, lineHeight: 21 },
  userText: { color: Colors.textPrimary, fontSize: 15, lineHeight: 21, fontWeight: '500' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(168,218,220,0.1)',
    backgroundColor: 'rgba(10,17,24,0.96)',
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    backgroundColor: 'rgba(168,218,220,0.05)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
