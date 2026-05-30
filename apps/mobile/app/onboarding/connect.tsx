import { useMemo, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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
import { initiateGoogleOAuth, saveCanvasToken } from '../../services/oauthService';
import { requestNotificationPermissions } from '../../lib/notifications';

const STAGGER_MS = 40;
const STEPS_TOTAL = 5;
const CURRENT_STEP = 1;

type PlatformChoice = 'google_classroom' | 'canvas' | 'skip' | null;
type ConnectStep = 'choose' | 'google_oauth_loading' | 'canvas_token' | 'success';

function backdropColors(mode: ResolvedMode): [string, string, string] {
  return mode === 'light'
    ? ['#F8FAFC', '#F1F5F9', '#F8FAFC']
    : ['#07090F', '#0D1117', '#07090F'];
}

interface PlatformOptionProps {
  label: string;
  sublabel: string;
  selected: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}

function PlatformOption({
  label,
  sublabel,
  selected,
  onPress,
  colors,
  styles,
}: PlatformOptionProps) {
  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={[styles.option, selected && styles.optionSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <View style={styles.optionContent}>
        <Text
          style={[
            styles.optionLabel,
            selected && { color: colors.accent.blue },
          ]}
        >
          {label}
        </Text>
        <Text style={styles.optionSublabel}>{sublabel}</Text>
      </View>
      {selected && (
        <View style={styles.check}>
          <AuraSymbol name="checkmark" size={16} color={colors.accent.blue} />
        </View>
      )}
    </Pressable>
  );
}

export default function OnboardingConnectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [choice, setChoice] = useState<PlatformChoice>(null);
  const [step, setStep] = useState<ConnectStep>('choose');
  const [canvasToken, setCanvasToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function saveStepAndContinue() {
    // Request notification permissions during onboarding, not on cold launch.
    await requestNotificationPermissions();
    if (userId) {
      await supabase
        .from('users')
        .update({ onboarding_step: 1 })
        .eq('id', userId);
    }
    router.push('/onboarding/profile');
  }

  async function handleContinue() {
    if (!choice) return;

    if (choice === 'skip') {
      await saveStepAndContinue();
      return;
    }

    if (choice === 'google_classroom') {
      setStep('google_oauth_loading');
      setSubmitting(true);

      const oauthResult = await initiateGoogleOAuth();

      // Null result = user cancelled, network error, or Supabase Google
      // provider isn't configured. Reset to 'choose' instead of silently
      // advancing to success so the user can retry.
      if (!oauthResult || !userId) {
        haptic.error();
        setSubmitting(false);
        setStep('choose');
        return;
      }

      // TODO: Supabase — upsert connections row for google_classroom
      // Table: connections
      // Columns: user_id, platform, oauth_token, refresh_token, status
      // Conflict target: (user_id, platform)
      // Note: oauth_token = Google access token (provider_token from Supabase session)
      //       refresh_token = Google refresh token (provider_refresh_token)
      //       Backend Trigger.dev Classroom fetch job reads these to call the API.
      await supabase.from('connections').upsert(
        {
          user_id: userId,
          platform: 'google_classroom',
          status: 'active',
          oauth_token: oauthResult.providerToken,
          refresh_token: oauthResult.providerRefreshToken,
        },
        { onConflict: 'user_id,platform' },
      );

      haptic.success();
      setSubmitting(false);
      setStep('success');
      return;
    }

    if (choice === 'canvas') {
      setStep('canvas_token');
      return;
    }
  }

  async function handleConnectCanvas() {
    if (!canvasToken.trim()) return;
    setSubmitting(true);
    await saveCanvasToken(userId, canvasToken.trim());
    haptic.success();
    setSubmitting(false);
    setStep('success');
  }

  function handleFinishSuccess() {
    void saveStepAndContinue();
  }

  function renderCardContent() {
    if (step === 'success') {
      return (
        <Animated.View
          entering={FadeInDown.duration(280).springify().damping(14).stiffness(160)}
          style={styles.successContent}
        >
          <View style={styles.successIconWrap}>
            <AuraSymbol name="checkmark.circle.fill" size={48} color={colors.accent.emerald} />
          </View>
          <Text style={styles.successTitle}>Connected!</Text>
          <Text style={styles.successBody}>
            Chronos will sync your assignments and build your first plan tonight.
          </Text>
        </Animated.View>
      );
    }

    if (step === 'canvas_token') {
      return (
        <Animated.View entering={FadeInDown.duration(280)}>
          <Text style={styles.label}>CONNECT CANVAS</Text>
          <Text style={styles.title}>Enter your API token</Text>
          <Text style={styles.body}>
            Find it in Canvas → Account → Settings → Approved Integrations → New Access Token.
          </Text>
          <TextInput
            style={styles.tokenInput}
            placeholder="Paste your Canvas API token"
            placeholderTextColor={colors.text.tertiary}
            value={canvasToken}
            onChangeText={setCanvasToken}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={false}
            returnKeyType="done"
          />
          <Text style={styles.tokenHint}>
            Tokens are encrypted at rest. Chronos never stores your password.
          </Text>
        </Animated.View>
      );
    }

    return (
      <>
        <Animated.View entering={FadeInDown.delay(STAGGER_MS * 2).duration(320)}>
          <Text style={styles.label}>STEP 1 OF 4 · CONNECT</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(STAGGER_MS * 3).duration(320)}>
          <Text style={styles.title}>Where does your homework live?</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(STAGGER_MS * 4).duration(320)}>
          <Text style={styles.body}>
            Chronos reads from your school platforms so you don&apos;t have to copy
            every assignment by hand.
          </Text>
        </Animated.View>

        {step === 'google_oauth_loading' ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.oauthLoading}>
            <AuraSymbol name="arrow.2.circlepath" size={22} color={colors.accent.blue} />
            <Text style={styles.oauthLoadingText}>Connecting to Google…</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(STAGGER_MS * 5).duration(320)} style={styles.options}>
            <PlatformOption
              label="Google Classroom"
              sublabel="Recommended"
              selected={choice === 'google_classroom'}
              onPress={() => setChoice('google_classroom')}
              colors={colors}
              styles={styles}
            />
            <PlatformOption
              label="Canvas"
              sublabel="API token required"
              selected={choice === 'canvas'}
              onPress={() => setChoice('canvas')}
              colors={colors}
              styles={styles}
            />
            <PlatformOption
              label="Add manually"
              sublabel="Photos and typed tasks"
              selected={choice === 'skip'}
              onPress={() => setChoice('skip')}
              colors={colors}
              styles={styles}
            />
          </Animated.View>
        )}
      </>
    );
  }

  function renderCTA() {
    if (step === 'success') {
      return (
        <View style={styles.ctaButton}>
          <AuraButton label="Continue" size="lg" fullWidth onPress={handleFinishSuccess} />
        </View>
      );
    }
    if (step === 'canvas_token') {
      return (
        <View style={styles.ctaButton}>
          <AuraButton
            label={submitting ? 'Connecting…' : 'Connect Canvas'}
            size="lg"
            fullWidth
            onPress={() => { void handleConnectCanvas(); }}
            disabled={!canvasToken.trim()}
            loading={submitting}
          />
        </View>
      );
    }
    return (
      <View style={styles.ctaButton}>
        <AuraButton
          label={submitting ? 'Connecting…' : 'Continue'}
          size="lg"
          fullWidth
          onPress={() => { void handleContinue(); }}
          disabled={!choice || step === 'google_oauth_loading'}
          loading={submitting}
        />
      </View>
    );
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          <Animated.View entering={FadeIn.duration(280)} style={styles.progressRow}>
            {Array.from({ length: STEPS_TOTAL }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === CURRENT_STEP && styles.dotActive]}
              />
            ))}
          </Animated.View>

          <View style={styles.heroWrap}>
            <Animated.View entering={FadeIn.delay(STAGGER_MS).duration(320)}>
              <GlassCard intensity="light" style={styles.card}>
                <View style={styles.cardInner}>
                  {renderCardContent()}
                </View>
              </GlassCard>
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeIn.delay(STAGGER_MS * 6).duration(320)}
            style={styles.ctaWrap}
          >
            {renderCTA()}
            {step !== 'success' && (
              <Text style={styles.disclaimer}>
                You can change or add platforms later in Settings.
              </Text>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    flex: { flex: 1 },
    container: {
      flex: 1,
      paddingHorizontal: spacing.screenPadding,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingTop: spacing.sm,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border.subtle,
    },
    dotActive: {
      width: 8,
      backgroundColor: c.accent.blue,
    },
    heroWrap: {
      width: '100%',
      maxWidth: 340,
      alignSelf: 'center',
    },
    card: {
      borderRadius: radius.xl,
    },
    cardInner: {
      padding: spacing.xl,
    },
    label: {
      ...typography.caption,
      color: c.text.tertiary,
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.title2,
      color: c.text.primary,
      marginBottom: spacing.sm,
    },
    body: {
      ...typography.body,
      color: c.text.secondary,
      marginBottom: spacing.lg,
    },
    options: {
      gap: spacing.sm,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.glass.light,
    },
    optionSelected: {
      borderColor: c.accent.blue,
      backgroundColor: c.glass.accent,
    },
    optionContent: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      ...typography.headline,
      color: c.text.primary,
    },
    optionSublabel: {
      ...typography.callout,
      color: c.text.tertiary,
    },
    check: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    oauthLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.lg,
    },
    oauthLoadingText: {
      ...typography.body,
      color: c.text.secondary,
    },
    tokenInput: {
      ...typography.body,
      color: c.text.primary,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    tokenHint: {
      ...typography.caption,
      color: c.text.tertiary,
    },
    successContent: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    successIconWrap: {
      marginBottom: spacing.sm,
    },
    successTitle: {
      ...typography.title1,
      color: c.text.primary,
      textAlign: 'center',
    },
    successBody: {
      ...typography.body,
      color: c.text.secondary,
      textAlign: 'center',
    },
    ctaWrap: {
      width: '100%',
      alignItems: 'center',
    },
    ctaButton: {
      width: '100%',
      maxWidth: 340,
    },
    disclaimer: {
      ...typography.callout,
      marginTop: spacing.md,
      color: c.text.tertiary,
      textAlign: 'center',
    },
  });
}
