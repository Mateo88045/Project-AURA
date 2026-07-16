import { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme, backdropGradient } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraButton } from '../../components/ui/AuraButton';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { enableGuestMode } from '../../lib/guest';

const STAGGER_MS = 40;

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Guideline 5.1.1 — let users try the app before creating an account.
  const exploreAsGuest = async () => {
    await enableGuestMode();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={backdropGradient(colors, resolvedMode)}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <AmbientOrbs />

      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        {/* Hero */}
        <View style={styles.heroWrap}>
          <Animated.View entering={FadeIn.delay(STAGGER_MS).duration(320)}>
            <GlassCard intensity="light" style={styles.card}>
              <View style={styles.cardInner}>
                <View style={styles.iconCircle}>
                  <AuraSymbol name="sparkles" size={36} color={colors.accent.blue} />
                </View>

                <Animated.View entering={FadeInDown.delay(STAGGER_MS * 2).duration(320)}>
                  <Text style={styles.label}>WELCOME</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(STAGGER_MS * 3).duration(320)}>
                  <Text style={styles.title}>Your homework brain.</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(STAGGER_MS * 4).duration(320)}>
                  <Text style={styles.body}>
                    Chronos watches your classes, drafts a plan every night, and
                    turns your free time into a calm, glowing river.
                  </Text>
                </Animated.View>
              </View>
            </GlassCard>
          </Animated.View>
        </View>

        {/* CTA */}
        <Animated.View
          entering={FadeIn.delay(STAGGER_MS * 5).duration(320)}
          style={styles.ctaWrap}
        >
          <Text style={styles.hint}>TAKES ABOUT 1 MINUTE</Text>
          <View style={styles.ctaButton}>
            <AuraButton
              label="Get started"
              size="lg"
              fullWidth
              onPress={() => router.push('/onboarding/connect')}
            />
          </View>
          <View style={styles.ctaButton}>
            <AuraButton
              label="Explore without an account"
              variant="ghost"
              fullWidth
              onPress={exploreAsGuest}
            />
          </View>
          <Text style={styles.disclaimer}>
            No schedules are changed without your approval.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    container: {
      flex: 1,
      paddingHorizontal: spacing.screenPadding,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroWrap: {
      flex: 1,
      justifyContent: 'center',
      width: '100%',
      maxWidth: 340,
      alignSelf: 'center',
    },
    card: {
      borderRadius: radius.xl,
    },
    cardInner: {
      padding: spacing.xl,
      alignItems: 'flex-start',
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.glass.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border.accent,
    },
    label: {
      ...typography.caption,
      color: c.text.tertiary,
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.title1,
      color: c.text.primary,
      marginBottom: spacing.sm,
    },
    body: {
      ...typography.body,
      color: c.text.secondary,
      marginTop: spacing.xs,
    },
    ctaWrap: {
      width: '100%',
      alignItems: 'center',
      gap: spacing.sm,
    },
    hint: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    ctaButton: {
      width: '100%',
      maxWidth: 340,
    },
    disclaimer: {
      ...typography.callout,
      marginTop: spacing.xs,
      color: c.text.tertiary,
      textAlign: 'center',
    },
  });
}
