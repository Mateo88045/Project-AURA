import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Springs } from '@chronos/shared/constants/motion';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../../lib/theme';
import { AmbientOrbs } from '../../../components/ui/AmbientOrbs';
import { GlassCard } from '../../../components/ui/GlassCard';
import { AuraSymbol } from '../../../components/ui/AuraSymbol';
import { haptic } from '../../../lib/haptics';
import {
  sendCopilotMessage,
  type ChatMessagePayload,
} from '../../../services/chatApi';
import { useAuth } from '../../../hooks/useAuth';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Row = ChatMessagePayload & { id: string };

// ---------------------------------------------------------------------------
// Typing indicator — three 6px violet dots, pulsing opacity with stagger
// ---------------------------------------------------------------------------

function TypingDot({
  index,
  typingStyles,
}: {
  index: number;
  typingStyles: ReturnType<typeof makeTypingStyles>;
}) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      index * 180,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, [index, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[typingStyles.dot, animatedStyle]} />;
}

function TypingIndicator({
  typingStyles,
}: {
  typingStyles: ReturnType<typeof makeTypingStyles>;
}) {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={typingStyles.bubble}>
      <View style={typingStyles.avatar}>
        <Text style={typingStyles.avatarLetter}>A</Text>
      </View>
      <GlassCard intensity="light" style={typingStyles.card}>
        <View style={typingStyles.dotsRow}>
          <TypingDot index={0} typingStyles={typingStyles} />
          <TypingDot index={1} typingStyles={typingStyles} />
          <TypingDot index={2} typingStyles={typingStyles} />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function makeTypingStyles(c: ThemeColors) {
  return StyleSheet.create({
    bubble: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: spacing.md,
      alignSelf: 'flex-start',
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      // Chronos's avatar is Steel — never violet.
      backgroundColor: c.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLetter: {
      ...typography.callout,
      color: c.text.inverse,
      fontWeight: '700',
    },
    card: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    dotsRow: {
      flexDirection: 'row',
      gap: 5,
      alignItems: 'center',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      // Mist — the same glow used on the river. The pulsing copilot dots
      // share Chronos's signature secondary hue.
      backgroundColor: c.accent.sky,
    },
  });
}

// ---------------------------------------------------------------------------
// Message bubble — user or assistant, with grouping metadata
// ---------------------------------------------------------------------------

interface BubbleProps {
  row: Row;
  showAvatar: boolean;
  index: number;
  bubbleStyles: ReturnType<typeof makeBubbleStyles>;
}

function Bubble({ row, showAvatar, index, bubbleStyles }: BubbleProps) {
  const isUser = row.role === 'user';

  // User messages slide up from below; assistant messages slide down with spring
  const entering = isUser
    ? FadeInUp.delay(Math.min(index, 6) * 25)
        .duration(220)
        .springify()
        .damping(18)
        .stiffness(200)
    : FadeInDown.delay(Math.min(index, 6) * 30)
        .duration(280)
        .springify()
        .damping(20)
        .stiffness(160);

  return (
    <Animated.View
      entering={entering}
      style={[
        bubbleStyles.wrap,
        isUser ? bubbleStyles.wrapUser : bubbleStyles.wrapChronos,
      ]}
    >
      {!isUser && (
        <View style={bubbleStyles.avatarSlot}>
          {showAvatar ? (
            <View style={bubbleStyles.avatar}>
              <Text style={bubbleStyles.avatarLetter}>A</Text>
            </View>
          ) : null}
        </View>
      )}

      {isUser ? (
        <View style={bubbleStyles.userBubble}>
          <Text style={bubbleStyles.userText}>{row.content}</Text>
        </View>
      ) : (
        <GlassCard intensity="light" style={bubbleStyles.auraBubble}>
          <Text style={bubbleStyles.auraText}>{row.content}</Text>
        </GlassCard>
      )}
    </Animated.View>
  );
}

function makeBubbleStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: 8,
      maxWidth: '86%',
    },
    wrapUser: {
      alignSelf: 'flex-end',
    },
    wrapChronos: {
      alignSelf: 'flex-start',
    },
    avatarSlot: {
      width: 28,
      height: 28,
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      // Chronos's avatar is Steel — never violet.
      backgroundColor: c.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLetter: {
      ...typography.callout,
      color: c.text.inverse,
      fontWeight: '700',
    },
    userBubble: {
      backgroundColor: c.accent.blue,
      borderRadius: radius.xl,
      borderBottomRightRadius: 6,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    userText: {
      ...typography.body,
      color: c.text.inverse,
    },
    auraBubble: {
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderBottomLeftRadius: 6,
    },
    auraText: {
      ...typography.body,
      color: c.text.primary,
    },
  });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AIChatScreen() {
  const router = useRouter();
  const { prompt, context, conversationId } = useLocalSearchParams<{
    prompt?: string;
    context?: string;
    conversationId?: string;
  }>();
  const insets = useSafeAreaInsets();
  const sessionContext = context ?? 'Homework help';
  // conversationId used for future history loading
  void conversationId;
  const listRef = useRef<FlatList<Row>>(null);
  const hasAutoSent = useRef(false);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const typingStyles = useMemo(() => makeTypingStyles(colors), [colors]);
  const bubbleStyles = useMemo(() => makeBubbleStyles(colors), [colors]);
  const { user: authUser } = useAuth();

  const [input, setInput] = useState('');
  const [rows, setRows] = useState<Row[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hey — I'm Chronos. Ask about your schedule or tell me what to move.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const lastFailedInput = useRef<string | null>(null);

  const sendScale = useSharedValue(1);
  const sendAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const scrollDownScale = useSharedValue(1);
  const scrollDownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scrollDownScale.value }],
  }));

  useEffect(() => {
    // Scroll to end when rows or loading state changes
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [rows, loading]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      setShowScrollDown(distanceFromBottom > 120);
    },
    [],
  );

  const scrollToBottom = useCallback(() => {
    haptic.selection();
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text || loading) return;

      haptic.primaryCTA();
      const userRow: Row = { id: `u-${Date.now()}`, role: 'user', content: text };
      setInput('');
      setError(null);
      lastFailedInput.current = null;
      setRows((prev) => [...prev, userRow]);
      setLoading(true);

      const msgs: ChatMessagePayload[] = [...rows, userRow].map(
        ({ role, content }) => ({ role, content }),
      );

      try {
        const res = await sendCopilotMessage(authUser?.id ?? '', msgs);
        setRows((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'assistant', content: res.message },
        ]);
        haptic.success();
      } catch (e) {
        lastFailedInput.current = text;
        setError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [loading, rows],
  );

  const send = useCallback(() => {
    void sendMessage(input.trim());
  }, [input, sendMessage]);

  // Auto-send a quick-prompt from the AI Hub
  useEffect(() => {
    if (prompt && !hasAutoSent.current) {
      hasAutoSent.current = true;
      void sendMessage(prompt);
    }
  }, [prompt, sendMessage]);

  const retry = useCallback(() => {
    if (!lastFailedInput.current) return;
    // Remove the last user message (the failed one) — sendMessage will re-add it
    setRows((prev) => prev.slice(0, -1));
    setError(null);
    void sendMessage(lastFailedInput.current);
  }, [sendMessage]);

  const canSend = input.trim().length > 0 && !loading;

  return (
    <View style={styles.root}>
      <AmbientOrbs />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 52}
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <Pressable
            onPress={() => {
              haptic.secondary();
              router.back();
            }}
            hitSlop={12}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <AuraSymbol name="chevron.left" size={22} color={colors.text.primary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarLetter}>A</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Chronos</Text>
              <Text style={styles.headerStatus}>{sessionContext}</Text>
            </View>
          </View>
          <Pressable
            hitSlop={12}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="More"
            onPress={() => haptic.selection()}
          >
            <AuraSymbol name="ellipsis" size={20} color={colors.text.secondary} />
          </Pressable>
        </Animated.View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={
            <Animated.View entering={FadeIn.delay(80).duration(280)} style={styles.contextPill}>
              <GlassCard intensity="light" style={styles.contextPillCard}>
                <AuraSymbol name="waveform" size={13} color={colors.text.tertiary} />
                <Text style={styles.contextPillText}>{sessionContext}</Text>
              </GlassCard>
            </Animated.View>
          }
          ListEmptyComponent={
            rows.length === 0 ? (
              <Animated.View entering={FadeInDown.delay(120).duration(300)} style={styles.emptyPrompts}>
                <Text style={styles.emptyPromptsLabel}>Try asking…</Text>
                {[
                  "What's on my schedule today?",
                  "Move my essay to Thursday",
                  "Give me a free evening",
                  "What's due this week?",
                ].map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    onPress={() => { haptic.selection(); void sendMessage(suggestion); }}
                    style={styles.suggestionChip}
                  >
                    <Text style={styles.suggestionChipText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </Animated.View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const prev = rows[index - 1];
            const isFirstOfGroup = !prev || prev.role !== item.role;
            return (
              <Bubble
                row={item}
                showAvatar={isFirstOfGroup}
                index={index}
                bubbleStyles={bubbleStyles}
              />
            );
          }}
          ListFooterComponent={
            <>
              {loading ? <TypingIndicator typingStyles={typingStyles} /> : null}
              {error ? (
                <Animated.View
                  entering={FadeIn.duration(250)}
                  style={styles.errorBlock}
                >
                  <AuraSymbol
                    name="exclamationmark.triangle"
                    size={14}
                    color={colors.accent.coral}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                  {lastFailedInput.current ? (
                    <Pressable
                      onPress={() => {
                        haptic.primaryCTA();
                        retry();
                      }}
                      hitSlop={10}
                    >
                      <Text style={styles.errorRetry}>Retry</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => {
                      haptic.secondary();
                      setError(null);
                      lastFailedInput.current = null;
                    }}
                    hitSlop={10}
                  >
                    <Text style={styles.errorDismiss}>Dismiss</Text>
                  </Pressable>
                </Animated.View>
              ) : null}
            </>
          }
        />

        {/* Scroll-to-bottom FAB */}
        {showScrollDown && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.scrollDownWrap}
          >
            <AnimatedPressable
              onPressIn={() => {
                scrollDownScale.value = withSpring(0.88, Springs.gentle);
              }}
              onPressOut={() => {
                scrollDownScale.value = withSpring(1, Springs.gentle);
              }}
              onPress={scrollToBottom}
              style={[styles.scrollDownBtn, scrollDownAnimatedStyle]}
              accessibilityRole="button"
              accessibilityLabel="Scroll to bottom"
            >
              <AuraSymbol
                name="chevron.down"
                size={14}
                color={colors.text.inverse}
                weight="bold"
              />
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputWrap,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <GlassCard intensity="thick" borderAccent style={styles.inputBar}>
            <Pressable
              hitSlop={10}
              onPress={() => haptic.secondary()}
              accessibilityRole="button"
              accessibilityLabel="Attach photo"
              style={styles.inputIconBtn}
            >
              <AuraSymbol name="plus.circle.fill" size={22} color={colors.text.secondary} />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message Chronos…"
              placeholderTextColor={colors.text.tertiary}
              editable={!loading}
              multiline
              style={styles.input}
              accessibilityLabel="Message Chronos"
            />
            {canSend ? (
              <AnimatedPressable
                onPressIn={() => {
                  sendScale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                  sendScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                }}
                onPress={send}
                style={[styles.sendBtn, sendAnimatedStyle]}
                accessibilityRole="button"
                accessibilityLabel="Send"
              >
                <AuraSymbol
                  name="arrow.up"
                  size={16}
                  color={colors.text.inverse}
                  weight="bold"
                />
              </AnimatedPressable>
            ) : (
              <Pressable
                hitSlop={10}
                style={styles.inputIconBtn}
                accessibilityRole="button"
                accessibilityLabel="Voice"
                onPress={() => haptic.secondary()}
              >
                <AuraSymbol name="mic.fill" size={18} color={colors.text.secondary} />
              </Pressable>
            )}
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    flex: { flex: 1 },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: spacing.screenPadding,
      paddingBottom: spacing.md,
    },
    headerBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      // Chronos's avatar is Steel — never violet.
      backgroundColor: c.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerAvatarLetter: {
      ...typography.headline,
      color: c.text.inverse,
      fontWeight: '700',
    },
    headerTitle: {
      ...typography.headline,
      color: c.text.primary,
    },
    headerStatus: {
      ...typography.caption,
      color: c.text.tertiary,
      textTransform: 'none',
      letterSpacing: 0,
    },

    // Messages list
    list: {
      paddingHorizontal: spacing.screenPadding,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      flexGrow: 1,
    },

    // Error
    errorBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.md,
      // Hard tint surface — derived from Chronos's coral token, not a hardcoded
      // Tailwind red. Resolves through the live theme so light mode gets the
      // deeper vermillion.
      backgroundColor: c.accent.coral + '14',
      borderWidth: 1,
      borderColor: c.accent.coral + '33',
      marginTop: 4,
    },
    errorText: {
      ...typography.callout,
      color: c.accent.coral,
      flex: 1,
    },
    errorRetry: {
      ...typography.callout,
      color: c.accent.coral,
      fontWeight: '600',
    },
    errorDismiss: {
      ...typography.callout,
      color: c.text.tertiary,
      fontWeight: '500',
    },

    // Scroll-to-bottom
    scrollDownWrap: {
      position: 'absolute',
      right: spacing.screenPadding,
      bottom: 80,
      zIndex: 10,
    },
    scrollDownBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.accent.blue,
      shadowOpacity: 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },

    // Input
    inputWrap: {
      paddingHorizontal: spacing.screenPadding,
      paddingTop: spacing.sm,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      minHeight: 52,
    },
    inputIconBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      ...typography.body,
      color: c.text.primary,
      maxHeight: 120,
      minHeight: 36,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Context pill (list header)
    contextPill: {
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    contextPillCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 20,
    },
    contextPillText: {
      ...typography.caption,
      color: c.text.tertiary,
    },

    // Empty state — suggested prompts
    emptyPrompts: {
      paddingTop: spacing.xl,
      gap: spacing.sm,
    },
    emptyPromptsLabel: {
      ...typography.callout,
      color: c.text.tertiary,
      marginBottom: spacing.xs,
    },
    suggestionChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
      alignSelf: 'flex-start',
    },
    suggestionChipText: {
      ...typography.callout,
      color: c.text.secondary,
    },
  });
}
