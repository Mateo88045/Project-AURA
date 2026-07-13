// Soft paywall screen.
//
// Triggered by useRequirePro() when the user takes their first interactive
// action against a rendered schedule (free_preview → gate), or any action at
// all after a lapsed trial (lapsed → readonly).
//
// Runs the same live billing flow as the onboarding paywall (services/
// purchases): plan selection, purchase, restore. On success we refresh the
// entitlement context and dismiss — the user re-taps their action with full
// access.

import { useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, Text, ScrollView, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../lib/theme';
import { AmbientOrbs } from '../components/ui/AmbientOrbs';
import { GlassCard } from '../components/ui/GlassCard';
import { AuraButton } from '../components/ui/AuraButton';
import { AuraSymbol } from '../components/ui/AuraSymbol';
import { useAuraToast } from '../components/ui/AuraToast';
import { useEntitlement } from '../lib/entitlement';
import { haptic } from '../lib/haptics';
import { useAuth } from '../hooks/useAuth';
import {
  PLANS,
  FREE_TRIAL_DAYS,
  configurePurchases,
  getOfferings,
  purchasePlan,
  restorePurchases,
  type BillingInterval,
  type SubscriptionPlan,
} from '../services/purchases';

const BULLETS = [
  'Auto-schedules Canvas & Classroom assignments around your fixed events',
  'Re-plans every night so you always start the day with a working schedule',
  'AI copilot for "what should I do next" — without you opening the calendar',
];

const extra = (Constants.expoConfig?.extra ?? {}) as {
  termsUrl?: string;
  privacyPolicyUrl?: string;
};
const TERMS_URL =
  extra.termsUrl ?? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = extra.privacyPolicyUrl ?? 'https://chronos-app.com/privacy';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams<{ mode?: string }>();
  const { refresh } = useEntitlement();
  const toast = useAuraToast();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const isReadOnly = params.mode === 'readonly';

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

  function handleDismiss() {
    haptic.selection();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  async function handleSubscribe() {
    if (busy) return;
    setBusy(true);
    haptic.primaryCTA();
    try {
      const result = await purchasePlan(activePlan);
      if (result.status === 'purchased' || result.status === 'restored' || result.status === 'preview') {
        haptic.success();
        refresh();
        toast.show('Chronos Pro is active — welcome aboard', 'success');
        handleDismiss();
      } else if (result.status === 'cancelled') {
        // User backed out of the sheet — stay put.
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
    haptic.selection();
    try {
      const result = await restorePurchases();
      if (result.status === 'restored' || result.status === 'preview') {
        haptic.success();
        refresh();
        toast.show('Subscription restored', 'success');
        handleDismiss();
      } else {
        Alert.alert('Nothing to restore', 'We couldn’t find an active subscription on this Apple ID.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <AmbientOrbs />

      <View style={styles.dismissRow}>
        <Pressable
          onPress={handleDismiss}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
        >
          <AuraSymbol name="xmark" size={18} color={colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(280)}>
          <Text style={styles.eyebrow}>
            {isReadOnly ? 'TRIAL ENDED' : 'CHRONOS PRO'}
          </Text>
          <Text style={styles.headline}>
            {isReadOnly
              ? 'Pick up where you left off.'
              : 'Let Chronos run your week.'}
          </Text>
          <Text style={styles.sub}>
            {isReadOnly
              ? 'Your schedule is still here. Reactivate to keep new tasks flowing in and the scheduler running.'
              : `Start a ${FREE_TRIAL_DAYS}-day free trial. No charge until it ends. Cancel anytime in Settings.`}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(320)} style={styles.bullets}>
          <GlassCard intensity="thick" style={styles.bulletCard}>
            {BULLETS.map((b, i) => (
              <View key={b} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{b}</Text>
                {i < BULLETS.length - 1 && <View style={styles.bulletDivider} />}
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Plan selector */}
        <Animated.View entering={FadeInDown.delay(120).duration(320)} style={styles.planRow}>
          {(['annual', 'monthly'] as BillingInterval[]).map((interval) => {
            const plan = plans.find((p) => p.interval === interval) ?? PLANS[interval];
            const active = selected === interval;
            return (
              <Pressable
                key={interval}
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
                    <Text style={styles.planBadgeText} numberOfLines={1}>{plan.badge}</Text>
                  </View>
                ) : null}
                <Text style={styles.planInterval}>
                  {interval === 'annual' ? 'Annual' : 'Monthly'}
                </Text>
                <View style={styles.priceLineRow}>
                  <Text style={styles.priceNow}>{plan.priceLabel}</Text>
                  <Text style={styles.priceRegular}>{plan.regularPriceLabel}</Text>
                </View>
                <Text style={styles.pricePeriod}>{plan.periodLabel}</Text>
                {plan.footnote ? <Text style={styles.priceFootnote}>{plan.footnote}</Text> : null}
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? (
                    <AuraSymbol name="checkmark" size={12} color={colors.text.inverse} weight="bold" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(180).duration(320)}
        style={styles.ctaWrap}
      >
        <AuraButton
          label={isReadOnly ? 'Reactivate' : `Start ${FREE_TRIAL_DAYS}-day free trial`}
          size="lg"
          fullWidth
          loading={busy}
          onPress={() => { void handleSubscribe(); }}
        />
        <Text style={styles.renewNote}>
          {isReadOnly ? '' : 'Then '}
          {activePlan.priceLabel} {activePlan.periodLabel} · auto-renews until cancelled
        </Text>
        <View style={styles.legalLinks}>
          <Pressable onPress={() => void Linking.openURL(TERMS_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>Terms</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => void Linking.openURL(PRIVACY_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>Privacy</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable
            onPress={() => { void handleRestore(); }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Restore purchases"
          >
            <Text style={styles.legalLink}>Restore Purchases</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
      paddingHorizontal: spacing.screenPadding,
    },
    dismissRow: {
      alignItems: 'flex-end',
      paddingBottom: spacing.md,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glass.light,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: spacing.xl },
    eyebrow: {
      ...typography.caption,
      color: c.text.tertiary,
      marginBottom: spacing.sm,
    },
    headline: {
      ...typography.displayMedium,
      color: c.text.primary,
    },
    sub: {
      ...typography.body,
      color: c.text.secondary,
      marginTop: spacing.md,
    },
    bullets: { marginTop: spacing.xl },
    bulletCard: {
      borderRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.md,
      position: 'relative',
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 8,
      backgroundColor: c.accent.blue,
    },
    bulletText: {
      ...typography.body,
      color: c.text.primary,
      flex: 1,
    },
    bulletDivider: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border.subtle,
    },

    // Plan cards
    planRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    planCard: {
      flex: 1,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: c.border.subtle,
      backgroundColor: c.glass.light,
      padding: spacing.md,
      paddingTop: spacing.lg,
      minHeight: 140,
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
    priceLineRow: {
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

    // CTA + legal
    ctaWrap: {
      gap: spacing.sm,
      paddingTop: spacing.md,
      alignItems: 'center',
    },
    renewNote: {
      ...typography.callout,
      color: c.text.tertiary,
      textAlign: 'center',
    },
    legalLinks: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 2,
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
