import { useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { AuraButton } from '../../components/ui/AuraButton';
import { AuraText } from '../../components/ui/AuraText';
import { haptic } from '../../lib/haptics';
import { useConversations } from '../../hooks/useConversations';
import { useAuth } from '../../hooks/useAuth';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Hero orb — breathes in and out; two concentric gradients + outer glow
// ---------------------------------------------------------------------------

function HeroOrb({ colors }: { colors: ThemeColors }) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.55, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [scale, glow]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + (glow.value - 0.55) * 0.3 }],
  }));

  return (
    <View style={[heroStyles.wrap, { pointerEvents: 'none' }]}>
      {/* Outer halo — two stacked low-opacity discs fake a radial falloff.
          (A linear gradient clipped to a circle leaves a hard half-disc edge.) */}
      <Animated.View style={[heroStyles.haloOuter, { backgroundColor: colors.accent.blue + '0D' }, glowStyle]} />
      <Animated.View style={[heroStyles.haloInner, { backgroundColor: colors.accent.blue + '14' }, glowStyle]} />

      {/* Core orb — Mist → Steel only. No third hue. The spec bans
          multi-saturated gradients; this is two hues from the same family. */}
      <Animated.View style={[heroStyles.core, { shadowColor: colors.accent.blue }, orbStyle]}>
        <View style={heroStyles.coreClip}>
          <LinearGradient
            colors={[colors.accent.sky, colors.accent.blue]}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Specular highlight */}
          <View style={heroStyles.highlight} />
        </View>
      </Animated.View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 168,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  haloOuter: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
  },
  haloInner: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
  },
  core: {
    width: 96,
    height: 96,
    borderRadius: 48,
    // The glow lives on the core itself so it fades out radially.
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  coreClip: {
    flex: 1,
    borderRadius: 48,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 14,
    left: 20,
    width: 32,
    height: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    transform: [{ rotate: '-20deg' }],
  },
});

// ---------------------------------------------------------------------------
// Action card — tinted accent, icon, title, subtitle, trailing arrow
// ---------------------------------------------------------------------------

type Tint = 'steel' | 'mist' | 'amber';

// Tints derive from the live theme — never hardcoded. The two atmospheric
// tints (steel/mist) come from the Chronos palette; amber stays warm for the
// "plan my week" shortcut so it reads as a different surface.
function makeTints(c: ThemeColors): Record<Tint, { from: string; to: string; fg: string; glow: string }> {
  return {
    steel: {
      from: c.accent.blue + '38',   // ~22% alpha
      to:   c.accent.blue + '0A',   // ~4% alpha
      fg:   c.accent.blue,
      glow: c.accent.blue,
    },
    mist: {
      from: c.accent.sky + '38',
      to:   c.accent.sky + '0A',
      fg:   c.accent.sky,
      glow: c.accent.sky,
    },
    amber: {
      from: c.accent.amber + '33',  // ~20% alpha
      to:   c.accent.amber + '0A',
      fg:   c.accent.amber,
      glow: c.accent.amber,
    },
  };
}

interface ActionCardProps {
  icon: string;
  title: string;
  subtitle: string;
  tint: Tint;
  onPress: () => void;
  colors: ThemeColors;
  tints: Record<Tint, { from: string; to: string; fg: string; glow: string }>;
  cardStyles: ReturnType<typeof makeCardStyles>;
}

function ActionCard({ icon, title, subtitle, tint, onPress, colors, tints, cardStyles }: ActionCardProps) {
  const scale = useSharedValue(1);
  const t = tints[tint];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 300 });
      }}
      onPress={() => {
        haptic.secondary();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={animatedStyle}
    >
      <GlassCard intensity="light" borderAccent style={cardStyles.card}>
        <LinearGradient
          colors={[t.from, t.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={cardStyles.content}>
          <View style={[cardStyles.iconBox, { backgroundColor: t.from }]}>
            <AuraSymbol name={icon} size={20} color={t.fg} weight="semibold" />
          </View>
          <View style={cardStyles.textCol}>
            <Text style={cardStyles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={cardStyles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
          <AuraSymbol name="arrow.up.right" size={14} color={colors.text.tertiary} />
        </View>
      </GlassCard>
    </AnimatedPressable>
  );
}

function makeCardStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      padding: 0,
      overflow: 'hidden',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: spacing.cardPadding,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textCol: {
      flex: 1,
    },
    title: {
      ...typography.headline,
      color: c.text.primary,
    },
    subtitle: {
      ...typography.callout,
      color: c.text.secondary,
      marginTop: 2,
    },
  });
}

// ---------------------------------------------------------------------------
// Quick prompt chip
// ---------------------------------------------------------------------------

function PromptChip({
  label,
  onPress,
  chipStyles,
}: {
  label: string;
  onPress: () => void;
  chipStyles: ReturnType<typeof makeChipStyles>;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 18, stiffness: 380 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 380 });
      }}
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[chipStyles.chip, animatedStyle]}
    >
      <Text style={chipStyles.label} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function makeChipStyles(c: ThemeColors) {
  return StyleSheet.create({
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      // Anti-slop: pills (radius.full / 9999) are reserved for the navigation
      // layer. Chips use the standard badge radius (8).
      borderRadius: radius.sm,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    } as ViewStyle,
    label: {
      ...typography.callout,
      color: c.text.primary,
    },
  });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AIHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tints = useMemo(() => makeTints(colors), [colors]);
  const cardStyles = useMemo(() => makeCardStyles(colors), [colors]);
  const chipStyles = useMemo(() => makeChipStyles(colors), [colors]);
  const { user: authUser } = useAuth();
  const { conversations, loading: convoLoading, error: convoError, refetch: refetchConvos } = useConversations(authUser?.id ?? '');

  const openChat = useCallback((preset?: string) => {
    const params = preset ? `?prompt=${encodeURIComponent(preset)}` : '';
    router.push(`/(tabs)/ai/chat${params}` as Href);
  }, [router]);

  // Ask bar focus morph — border glows and chips fade when bar is pressed
  const askFocused = useSharedValue(0);

  const askBarWrapStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(askFocused.value, [0, 1], [0, 0.45], Extrapolation.CLAMP),
    shadowRadius: interpolate(askFocused.value, [0, 1], [0, 18], Extrapolation.CLAMP),
    transform: [{
      scale: interpolate(askFocused.value, [0, 1], [1, 1.015], Extrapolation.CLAMP),
    }],
  }));

  const chipsRowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(askFocused.value, [0, 1], [1, 0.4], Extrapolation.CLAMP),
    transform: [{
      scale: interpolate(askFocused.value, [0, 1], [1, 0.97], Extrapolation.CLAMP),
    }],
  }));

  return (
    <View style={styles.root}>
      <AmbientOrbs />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.eyebrow}>CHRONOS</Text>
          <Text style={styles.title}>How can I help?</Text>
          <Text style={styles.subtitle}>
            Ask me to explain, simplify, or adjust your plan.
          </Text>
        </Animated.View>

        {/* Hero orb */}
        <Animated.View entering={FadeIn.delay(100).duration(600)}>
          <HeroOrb colors={colors} />
        </Animated.View>

        {/* Ask anything — tap target that opens chat */}
        <Animated.View entering={FadeInUp.delay(160).duration(500)}>
          <Animated.View
            style={[styles.askBarGlow, { shadowColor: colors.accent.sky }, askBarWrapStyle]}
          >
            <Pressable
              onPressIn={() => {
                askFocused.value = withTiming(1, { duration: 180 });
              }}
              onPressOut={() => {
                askFocused.value = withTiming(0, { duration: 220 });
              }}
              onPress={() => {
                haptic.primaryCTA();
                openChat();
              }}
              accessibilityRole="button"
              accessibilityLabel="Ask Chronos anything"
            >
              <GlassCard intensity="regular" borderAccent style={styles.askBar}>
                <AuraSymbol name="waveform" size={18} color={colors.accent.sky} />
                <Text style={styles.askPlaceholder}>Ask anything…</Text>
                <View style={styles.askSend}>
                  <AuraSymbol name="arrow.up" size={16} color={colors.text.inverse} weight="bold" />
                </View>
              </GlassCard>
            </Pressable>
          </Animated.View>
        </Animated.View>

        {/* Quick prompts — bleed to the screen edge so the row scrolls under it */}
        <Animated.View entering={FadeInUp.delay(220).duration(500)} style={[chipsRowStyle, styles.chipsBleed]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <PromptChip label="Explain my workload" onPress={() => openChat('Explain my workload for this week')} chipStyles={chipStyles} />
            <PromptChip label="Lighter evening" onPress={() => openChat('Make my evening lighter tonight')} chipStyles={chipStyles} />
            <PromptChip label="Spread a task" onPress={() => openChat('Spread my longest task across multiple sessions')} chipStyles={chipStyles} />
            <PromptChip label="Hardest first?" onPress={() => openChat('Should I do the hardest task first?')} chipStyles={chipStyles} />
          </ScrollView>
        </Animated.View>

        {/* Action cards */}
        <Text style={styles.sectionLabel}>SHORTCUTS</Text>
        <Animated.View entering={FadeInUp.delay(280).duration(500)}>
          <View style={styles.cardStack}>
            <ActionCard
              icon="bubble.left.and.bubble.right"
              title="Talk to Chronos"
              subtitle="Chat through your schedule and unstick yourself"
              tint="steel"
              onPress={() => openChat()}
              colors={colors}
              tints={tints}
              cardStyles={cardStyles}
            />
            <ActionCard
              icon="camera.fill"
              title="Snap a homework page"
              subtitle="Photograph any assignment — I'll grade and schedule it"
              tint="mist"
              onPress={() => router.push('/tasks/scan' as Href)}
              colors={colors}
              tints={tints}
              cardStyles={cardStyles}
            />
            <ActionCard
              icon="calendar.badge.clock"
              title="Plan my week"
              subtitle="Review Sunday's briefing and line up the next seven days"
              tint="amber"
              onPress={() => router.push('/briefing' as Href)}
              colors={colors}
              tints={tints}
              cardStyles={cardStyles}
            />
          </View>
        </Animated.View>

        {/* Recent conversations */}
        <Text style={styles.sectionLabel}>RECENT</Text>
        <Animated.View entering={FadeInUp.delay(360).duration(500)}>
          {convoLoading && (
            <View style={{ gap: 10 }}>
              <AuraSkeleton height={56} />
              <AuraSkeleton height={56} />
              <AuraSkeleton height={56} />
            </View>
          )}
          {!convoLoading && convoError && (
            <View style={styles.recentsError}>
              <AuraText variant="callout" color="secondary">Couldn't load conversations.</AuraText>
              <AuraButton label="Retry" variant="ghost" onPress={refetchConvos} />
            </View>
          )}
          {!convoLoading && !convoError && conversations.length === 0 && (
            <View style={styles.recentsEmpty}>
              <AuraText variant="body" color="secondary">No conversations yet. Ask Chronos anything above.</AuraText>
            </View>
          )}
          {!convoLoading && !convoError && conversations.length > 0 && (
            <GlassCard intensity="light" style={styles.recentsCard}>
              {conversations.slice(0, 5).map((c, i) => {
                const lastMsg = c.messages[c.messages.length - 1];
                const snippet = typeof lastMsg?.content === 'string' ? lastMsg.content : '';
                return (
                  <View key={c.id}>
                    <Pressable
                      onPress={() => {
                        haptic.selection();
                        router.push(`/(tabs)/ai/chat?conversationId=${c.id}` as Href);
                      }}
                      style={styles.recentRow}
                      accessibilityRole="button"
                      accessibilityLabel={`Conversation from ${relativeTime(c.updatedAt)}`}
                    >
                      <View style={styles.recentBullet} />
                      <View style={styles.recentTextCol}>
                        <Text style={styles.recentTitle} numberOfLines={1}>
                          {snippet.slice(0, 60) || 'Conversation'}
                        </Text>
                      </View>
                      <Text style={styles.recentWhen}>{relativeTime(c.updatedAt)}</Text>
                    </Pressable>
                    {i < conversations.slice(0, 5).length - 1 ? <View style={styles.recentDivider} /> : null}
                  </View>
                );
              })}
            </GlassCard>
          )}
        </Animated.View>
      </ScrollView>
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
    scrollContent: {
      paddingHorizontal: spacing.screenPadding,
    },

    // Header
    header: {
      marginBottom: spacing.md,
    },
    eyebrow: {
      ...typography.caption,
      color: c.text.tertiary,
      marginBottom: 4,
    },
    title: {
      ...typography.displayMedium,
      color: c.text.primary,
    },
    subtitle: {
      ...typography.body,
      color: c.text.secondary,
      marginTop: 6,
    },

    // Ask bar
    askBarGlow: {
      borderRadius: radius.lg,
      shadowOffset: { width: 0, height: 0 },
    },
    askBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 18,
      paddingVertical: 14,
    },
    askPlaceholder: {
      ...typography.body,
      color: c.text.tertiary,
      flex: 1,
    },
    askSend: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Chip row
    chipsBleed: {
      marginHorizontal: -spacing.screenPadding,
    },
    chipsRow: {
      gap: 8,
      paddingVertical: spacing.md,
      paddingLeft: spacing.screenPadding,
      paddingRight: spacing.screenPadding,
    },

    // Section label
    sectionLabel: {
      ...typography.caption,
      color: c.text.tertiary,
      marginTop: spacing.xl,
      marginBottom: 10,
      paddingHorizontal: 4,
    },

    // Action card stack
    cardStack: {
      gap: spacing.itemGap,
    },

    // Recents
    recentsCard: {
      paddingVertical: 4,
    },
    recentsError: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: 4,
    },
    recentsEmpty: {
      paddingVertical: spacing.lg,
      paddingHorizontal: 4,
    },
    recentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: 14,
      minHeight: 56,
    },
    recentBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      // Mist — the same glow used on the river. No violet anywhere.
      backgroundColor: c.accent.sky,
    },
    recentTextCol: {
      flex: 1,
    },
    recentTitle: {
      ...typography.bodyMedium,
      color: c.text.primary,
    },
    recentWhen: {
      ...typography.caption,
      color: c.text.tertiary,
    },
    recentDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border.subtle,
      marginLeft: spacing.cardPadding + 18,
    },
  });
}
