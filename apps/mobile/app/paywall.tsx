// Soft paywall screen.
//
// Triggered by useRequirePro() when the user takes their first interactive
// action against a rendered schedule (free_preview → gate), or any action at
// all after a lapsed trial (lapsed → readonly).
//
// The actual StoreKit / RevenueCat call is stubbed — `handleStartTrial` and
// `handleRestore` are the two spots Mateo wires into Purchases.purchasePackage
// and Purchases.restorePurchases. Everything else (copy, layout, dismissal)
// is final.

import { useMemo } from 'react';
import { View, Pressable, StyleSheet, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

const BULLETS = [
  'Auto-schedules Canvas & Classroom assignments around your fixed events',
  'Re-plans every night so you always start the day with a working schedule',
  'AI copilot for "what should I do next" — without you opening the calendar',
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams<{ mode?: string }>();
  const { refresh } = useEntitlement();
  const toast = useAuraToast();

  const isReadOnly = params.mode === 'readonly';

  async function handleStartTrial() {
    haptic.primaryCTA();
    // TODO: RevenueCat — await Purchases.purchasePackage(offering.monthly)
    // On success the customer-info webhook flips status → 'trialing'; we
    // refresh() to pick it up and dismiss.
    toast.show('Trial flow not wired yet — RevenueCat keys pending', 'info');
    refresh();
  }

  async function handleRestore() {
    haptic.selection();
    // TODO: RevenueCat — await Purchases.restorePurchases()
    toast.show('Restore not wired yet — RevenueCat keys pending', 'info');
    refresh();
  }

  function handleDismiss() {
    haptic.selection();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
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
              : 'Start a 14-day free trial. No charge until day 15. Cancel anytime in Settings.'}
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

        <Animated.View entering={FadeInDown.delay(120).duration(320)} style={styles.priceWrap}>
          <Text style={styles.priceLine}>
            {isReadOnly ? 'Reactivate' : '14 days free, then'}
            <Text style={styles.priceAmount}>
              {isReadOnly ? '' : ' $—/mo'}
            </Text>
          </Text>
          <Text style={styles.priceNote}>
            {/* Price lands from RevenueCat offering once configured. */}
            Pricing finalizes at App Store / Play Store config time
          </Text>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(180).duration(320)}
        style={styles.ctaWrap}
      >
        <AuraButton
          label={isReadOnly ? 'Reactivate' : 'Start free trial'}
          size="lg"
          fullWidth
          onPress={handleStartTrial}
        />
        <Pressable
          onPress={handleRestore}
          style={styles.restoreBtn}
          accessibilityRole="button"
          accessibilityLabel="Restore purchases"
        >
          <Text style={styles.restoreText}>Restore purchase</Text>
        </Pressable>
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
    priceWrap: { marginTop: spacing.xl },
    priceLine: {
      ...typography.headline,
      color: c.text.primary,
    },
    priceAmount: {
      ...typography.headline,
      color: c.accent.blue,
    },
    priceNote: {
      ...typography.callout,
      color: c.text.tertiary,
      marginTop: spacing.xs,
    },
    ctaWrap: {
      gap: spacing.sm,
      paddingTop: spacing.md,
    },
    restoreBtn: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    restoreText: {
      ...typography.callout,
      color: c.text.secondary,
    },
  });
}
