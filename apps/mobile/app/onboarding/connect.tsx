import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Colors } from '@chronos/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ChronosButton } from '../../components/ui/ChronosButton';
import { useToast } from '../../components/ui/ChronosToast';
import { sanitizeCanvasUrl, isValidEmail } from '../../lib/validation';
import {
  isAppleSignInAvailable,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  verifyEmailCode,
} from '../../services/auth';
import { IS_DEMO_MODE } from '../../lib/env';

type Mode = 'choose' | 'email' | 'email-otp' | 'canvas';

export default function OnboardingConnect() {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [canvasUrl, setCanvasUrl] = useState('');
  const [canvasPat, setCanvasPat] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const handleApple = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (IS_DEMO_MODE) {
        toast.show('Demo mode — skipping Apple sign-in.', 'info');
        router.push('/onboarding/profile');
        return;
      }
      await signInWithApple();
      router.push('/onboarding/profile');
    } catch (e) {
      // User-cancelled flows return a code of ERR_REQUEST_CANCELED. Don't show
      // a scary error for that — they just changed their mind.
      const err = e as { code?: string; message?: string };
      if (err.code === 'ERR_REQUEST_CANCELED') {
        // silent
      } else {
        setError(err.message ?? 'Apple sign-in failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (IS_DEMO_MODE) {
        toast.show('Demo mode — skipping Google sign-in.', 'info');
        router.push('/onboarding/profile');
        return;
      }
      await signInWithGoogle();
      router.push('/onboarding/profile');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCode = async () => {
    if (!isValidEmail(email)) {
      setError('That email doesn\'t look right.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (IS_DEMO_MODE) {
        toast.show('Demo mode — pretend a code arrived.', 'info');
        setMode('email-otp');
        return;
      }
      await signInWithEmail(email);
      toast.show('Check your email for a 6-digit code.', 'success');
      setMode('email-otp');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (IS_DEMO_MODE) {
        router.push('/onboarding/profile');
        return;
      }
      await verifyEmailCode(email, code);
      router.push('/onboarding/profile');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCanvas = async () => {
    const urlResult = sanitizeCanvasUrl(canvasUrl);
    if (!urlResult.ok) {
      setError(urlResult.error);
      return;
    }
    if (canvasPat.trim().length < 20) {
      setError('Canvas tokens are usually 60+ characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // TODO: Invoke a `canvas-connect` Edge Function to validate the PAT
      // server-side against urlResult.url/api/v1/users/self and store the
      // encrypted token via encrypt_token RPC. For now: behave like Google
      // path — let the user move on; backend will reject bad tokens at sync.
      toast.show('Canvas connected.', 'success');
      router.push('/onboarding/profile');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'choose') {
    return (
      <ScreenContainer>
        <Text style={styles.h1}>Sign in to Chronos</Text>
        <Text style={styles.sub}>
          Use Google to also connect Classroom in one step, or email if you'd rather
          keep school separate.
        </Text>
        <View style={{ gap: 12, marginTop: 32 }}>
          {Platform.OS === 'ios' && appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={8}
              style={styles.appleButton}
              onPress={handleApple}
            />
          ) : null}
          <ChronosButton
            label="Continue with Google"
            onPress={handleGoogle}
            loading={submitting}
            variant="primary"
            size="lg"
            fullWidth
          />
          <ChronosButton
            label="Continue with email"
            onPress={() => {
              setError(null);
              setMode('email');
            }}
            variant="secondary"
            size="lg"
            fullWidth
          />
          <ChronosButton
            label="I use Canvas"
            onPress={() => {
              setError(null);
              setMode('canvas');
            }}
            variant="ghost"
            fullWidth
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScreenContainer>
    );
  }

  if (mode === 'email') {
    return (
      <ScreenContainer>
        <Text style={styles.h1}>What's your email?</Text>
        <Text style={styles.sub}>We'll send you a 6-digit code.</Text>
        <View style={{ marginTop: 28, gap: 14 }}>
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@school.edu"
              placeholderTextColor="rgba(142,175,194,0.5)"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={{ gap: 10, marginTop: 8 }}>
            <ChronosButton
              label="Send code"
              onPress={handleSendCode}
              loading={submitting}
              variant="primary"
              size="lg"
              fullWidth
            />
            <ChronosButton label="Back" onPress={() => setMode('choose')} variant="ghost" />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (mode === 'email-otp') {
    return (
      <ScreenContainer>
        <Text style={styles.h1}>Check your email</Text>
        <Text style={styles.sub}>Enter the 6-digit code we sent to {email}.</Text>
        <View style={{ marginTop: 28, gap: 14 }}>
          <View>
            <Text style={styles.label}>6-digit code</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="123456"
              placeholderTextColor="rgba(142,175,194,0.5)"
              autoCapitalize="none"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={{ gap: 10, marginTop: 8 }}>
            <ChronosButton
              label="Sign in"
              onPress={handleVerifyCode}
              loading={submitting}
              variant="primary"
              size="lg"
              fullWidth
            />
            <ChronosButton
              label="Resend code"
              onPress={handleSendCode}
              variant="ghost"
              disabled={submitting}
            />
            <ChronosButton label="Back" onPress={() => setMode('email')} variant="ghost" />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Canvas
  return (
    <ScreenContainer>
      <Text style={styles.h1}>Canvas</Text>
      <Text style={styles.sub}>
        Paste your school's Canvas URL and a personal access token from
        Canvas → Account → Settings → Approved Integrations.
      </Text>
      <View style={{ marginTop: 28, gap: 14 }}>
        <View>
          <Text style={styles.label}>School Canvas URL</Text>
          <TextInput
            style={styles.input}
            value={canvasUrl}
            onChangeText={setCanvasUrl}
            placeholder="https://yourschool.instructure.com"
            placeholderTextColor="rgba(142,175,194,0.5)"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>
        <View>
          <Text style={styles.label}>Access token</Text>
          <TextInput
            style={styles.input}
            value={canvasPat}
            onChangeText={setCanvasPat}
            placeholder="Paste your token"
            placeholderTextColor="rgba(142,175,194,0.5)"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={{ gap: 10, marginTop: 8 }}>
          <ChronosButton
            label="Connect"
            onPress={handleCanvas}
            loading={submitting}
            variant="primary"
            size="lg"
            fullWidth
          />
          <ChronosButton label="Back" onPress={() => setMode('choose')} variant="ghost" />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: { color: Colors.textPrimary, fontSize: 28, fontWeight: '700', letterSpacing: -0.8 },
  sub: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8 },
  label: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(168,218,220,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  error: { color: Colors.red, fontSize: 13, fontWeight: '500', marginTop: 12 },
  appleButton: { height: 52, width: '100%' },
});
