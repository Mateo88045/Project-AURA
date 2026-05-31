import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { supabase } from '@chronos/shared/supabase';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme, type ResolvedMode } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraButton } from '../../components/ui/AuraButton';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';
import {
  PLANS,
  FREE_TRIAL_DAYS,
  configurePurchases,
  getOfferings,
  purchasePlan,
  restorePurchases,
  type BillingInterval,
  type SubscriptionPlan,
} from '../../services/purchases';

const STAGGER_MS = 50;

const BENEFITS: { icon: string; title: string; body: string }[] = [
  {
    icon: 'sparkles',
    title: 'Auto-scheduled days',
    body: 'Chronos plans your homework around classes, sports, and sleep — every night.',
  },
  {
    icon: 'camera.fill',
    title: 'Snap & schedule',
    body: 'Photograph any assignment. AI grades the difficulty and finds the time.',
  },
  {
    icon: 'bubble.left.and.bubble.right.fill',
    title: 'Your AI copilot',
    body: 'Ask Chronos to move tasks, lighten a night, or explain your week.',
  },
];

function backdropColors(mode: ResolvedMode): [string, string, string] {
  return mode === 'light'
    ? ['#F8FAFC', '#F1F5F9', '#F8FAFC']
    : ['#07090F', '#0D1117', '#07090F'];
}

const extra = (Constants.expoConfig?.extra ?? {}) as {
  termsUrl?: string;
  privacyPolicyUrl?: string;
};
const TERMS_URL = extra.termsUrl ?? 'https://chronos-app.com/terms';
const PRIVACY_URL = extra.privacyPolicyUrl ?? 'https://chronos-app.com/privacy';
// Apple's standard EULA — used unless you host your own.
const APPLE_EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export default function OnboardingPaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [plans, setPlans] = useState<SubscriptionPlan[]>([PLANS.annual, PLANS.monthly]);
  const [selected, setSelected] = useState<BillingInterval>('annual');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    void configurePurchases(userId).then(getOfferings).then((offerings) => {
      if (mounted && offerings.length) setPlans(offerings);
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const activePlan = plans.find((p) => p.interval === selected) ?? PLANS[selected];

  async function completeOnboarding() {
    if (userId) {
      await supabase
        .from('users')
        .update({ onboarding_step: 6 })
        .eq('id', userId);
    }
    router.replace('/(tabs)');
  }

  async function handleSubscribe() {
    if (busy) return;
    setBusy(true);
    haptic.primaryCTA();
    try {
      const result = await purchasePlan(activePlan);
      if (result.status === 'purchased' || result.status === 'restored' || result.status === 'preview') {
        haptic.success();
        await completeOnboarding();
      } else if (result.status === 'cancelled') {
        // User backed out — stay on the paywall.
      } else {
        Alert.alert('Purchase failed', result.message ?? 'Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    if (busy) return;
    setBusy(true);
    haptic.secondary();
    try {
      const result = await restorePurchases();
      if (result.status === 'restored' || result.status === 'preview') {
        haptic.success();
        await completeOnboarding();
      } else {
        Alert.alert('Nothing to restore', 'We couldn’t find an active subscription on this Apple ID.');
      }
    } finally {
      setBusy(false);
    }
  }

  function handleSkip() {
    haptic.secondary();
    void completeOnboarding();
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={backdropColors(resolvedMode)}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <AmbientOrbs />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(360)} style={styles.header}>
          <Text style={styles.eyebrow}>EARLY ACCESS</Text>
          <Text style={styles.title}>Unlock Chronos</Text>
          <Text style={styles.subtitle}>
            Start with a {FREE_TRIAL_DAYS}-day free trial. Cancel anytime.
          </Text>
        </Animated.View>

        {/* Benefits */}
        <Animated.View entering={FadeInUp.delay(STAGGER_MS).duration(420)}>
          <GlassCard intensity="light" style={styles.benefitsCard}>
            {BENEFITS.map((b, i) => (
              <View key={b.title} style={[styles.benefitRow, i > 0 && styles.benefitRowGap]}>
                <View style={styles.benefitIcon}>
                  <AuraSymbol name={b.icon} size={18} color={colors.accent.blue} weight="semibold" />
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{b.title}</Text>
                  <Text style={styles.benefitBody}>{b.body}</Text>
                </View>
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Plan selector */}
        <View style={styles.planRow}>
          {(['annual', 'monthly'] as BillingInterval[]).map((interval, i) => {
            const plan = plans.find((p) => p.interval === interval) ?? PLANS[interval];
            const active = selected === interval;
            return (
              <Animated.View
                key={interval}
                entering={FadeInDown.delay(STAGGER_MS * (2 + i)).duration(380)}
                style={styles.planCol}
              >
                <Pressable
                  onPress={() => {
                    haptic.selection();
                    setSelected(interval);
                  }}
                  style={[styles.planCard, active && styles.planCardActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${plan.interval} plan, ${plan.priceLabel} ${plan.periodLabel}`}
                >
                  {plan.badge ? (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.planInterval}>
                    {interval === 'annual' ? 'Annual' : 'Monthly'}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceNow}>{plan.priceLabel}</Text>
                    <Text style={styles.priceRegular}>{plan.regularPriceLabel}</Text>
                  </View>
                  <Text style={styles.pricePeriod}>{plan.periodLabel}</Text>
                  {plan.footnote ? (
                    <Text style={styles.priceFootnote}>{plan.footnote}</Text>
                  ) : null}
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? (
                      <AuraSymbol name="checkmark" size={12} color={colors.text.inverse} weight="bold" />
                    ) : null}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(STAGGER_MS * 4).duration(420)} style={styles.ctaWrap}>
          <AuraButton
            label={`Start ${FREE_TRIAL_DAYS}-day free trial`}
            size="lg"
            fullWidth
            onPress={() => { void handleSubscribe(); }}
            loading={busy}
          />
          <Text style={styles.renewNote}>
            Then {activePlan.priceLabel} {activePlan.periodLabel}. Auto-renews until cancelled.
          </Text>

          <Pressable onPress={handleSkip} hitSlop={8} style={styles.skipBtn} accessibilityRole="button">
            <Text style={styles.skipText}>Not now — continue with limited access</Text>
          </Pressable>
        </Animated.View>

        {/* Legal footer — required for auto-renewable subscriptions */}
        <Animated.View entering={FadeIn.delay(STAGGER_MS * 5).duration(420)} style={styles.legal}>
          <Text style={styles.legalBody}>
            Payment is charged to your Apple ID at confirmation. Subscriptions auto-renew
            unless turned off at least 24 hours before the period ends. Manage or cancel in
            your App Store account settings.
          </Text>
          <View style={styles.legalLinks}>
            <Pressable onPress={() => void Linking.openURL(TERMS_URL || APPLE_EULA)} hitSlop={8}>
              <Text style={styles.legalLink}>Terms of Use</Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable onPress={() => void Linking.openURL(PRIVACY_URL)} hitSlop={8}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable onPress={() => { void handleRestore(); }} hitSlop={8} accessibilityRole="button">
              <Text style={styles.legalLink}>Restore Purchases</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    scrollContent: {
      paddingHorizontal: spacing.screenPadding,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    eyebrow: {
      ...typography.caption,
      color: c.accent.blue,
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
      textAlign: 'center',
    },
    benefitsCard: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    benefitRow: {
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'flex-start',
    },
    benefitRowGap: {
      marginTop: spacing.lg,
    },
    benefitIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: c.glass.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    benefitText: {
      flex: 1,
    },
    benefitTitle: {
      ...typography.bodyMedium,
      color: c.text.primary,
    },
    benefitBody: {
      ...typography.callout,
      color: c.text.secondary,
      marginTop: 2,
    },
    planRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    planCol: {
      flex: 1,
    },
    planCard: {
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: c.border.subtle,
      backgroundColor: c.glass.light,
      padding: spacing.md,
      paddingTop: spacing.lg,
      minHeight: 150,
    },
    planCardActive: {
      borderColor: c.accent.blue,
      backgroundColor: c.glass.accent,
    },
    planBadge: {
      position: 'absolute',
      top: -10,
      left: spacing.md,
      right: spacing.md,
      backgroundColor: c.accent.blue,
      borderRadius: radius.sm,
      paddingVertical: 3,
      paddingHorizontal: 6,
      alignItems: 'center',
    },
    planBadgeText: {
      ...typography.micro,
      color: c.text.inverse,
      fontWeight: '700',
    },
    planInterval: {
      ...typography.caption,
      color: c.text.secondary,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      marginTop: 6,
    },
    priceNow: {
      ...typography.title1,
      color: c.text.primary,
    },
    priceRegular: {
      ...typography.callout,
      color: c.text.tertiary,
      textDecorationLine: 'line-through',
    },
    pricePeriod: {
      ...typography.callout,
      color: c.text.secondary,
    },
    priceFootnote: {
      ...typography.micro,
      color: c.text.tertiary,
      marginTop: 6,
    },
    radio: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: c.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioActive: {
      backgroundColor: c.accent.blue,
      borderColor: c.accent.blue,
    },
    ctaWrap: {
      alignItems: 'center',
    },
    renewNote: {
      ...typography.callout,
      color: c.text.tertiary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    skipBtn: {
      marginTop: spacing.lg,
      paddingVertical: spacing.xs,
    },
    skipText: {
      ...typography.callout,
      color: c.text.secondary,
      fontWeight: '500',
    },
    legal: {
      marginTop: spacing.xl,
      alignItems: 'center',
    },
    legalBody: {
      ...typography.micro,
      color: c.text.tertiary,
      textAlign: 'center',
      lineHeight: 16,
    },
    legalLinks: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 6,
      marginTop: spacing.sm,
    },
    legalLink: {
      ...typography.micro,
      color: c.text.secondary,
      textDecorationLine: 'underline',
    },
    legalDot: {
      ...typography.micro,
      color: c.text.tertiary,
    },
  });
}
