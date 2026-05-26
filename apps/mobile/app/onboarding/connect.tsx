import { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AuraButton } from '../../components/ui/AuraButton';
import { useToast } from '../../components/ui/AuraToast';
import { sanitizeCanvasUrl } from '../../lib/validation';

type Platform = 'google_classroom' | 'canvas' | null;

export default function OnboardingConnect() {
  const router = useRouter();
  const toast = useToast();
  const [platform, setPlatform] = useState<Platform>(null);
  const [canvasUrl, setCanvasUrl] = useState('');
  const [canvasPat, setCanvasPat] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectGoogle = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // TODO: Integration — Google Classroom OAuth via expo-auth-session.
      // PKCE flow; exchange code on backend; persist user_id token via setAuthToken.
      await new Promise((r) => setTimeout(r, 600));
      toast.show('Google Classroom connected.', 'success');
      router.push('/onboarding/profile');
    } catch (e) {
      setError('Could not connect to Google Classroom. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const connectCanvas = async () => {
    const urlResult = sanitizeCanvasUrl(canvasUrl);
    if (!urlResult.ok) {
      setError(urlResult.error);
      return;
    }
    if (canvasPat.trim().length < 20) {
      setError('Canvas access tokens are usually 60+ characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // TODO: Integration — POST to canvas-pat-validate Edge Function with
      // { url: urlResult.url, pat: canvasPat }. Backend validates by calling
      // /api/v1/users/self with the token, then stores connection row.
      await new Promise((r) => setTimeout(r, 600));
      toast.show('Canvas connected.', 'success');
      router.push('/onboarding/profile');
    } catch (e) {
      setError('Canvas didn\'t accept that token. Double-check it.');
    } finally {
      setSubmitting(false);
    }
  };

  if (platform === null) {
    return (
      <ScreenContainer>
        <Text style={styles.h1}>Pick your school's platform</Text>
        <Text style={styles.sub}>
          Pull in your assignments automatically. You can connect more later.
        </Text>
        <View style={{ gap: 12, marginTop: 32 }}>
          <AuraButton
            label="Google Classroom"
            onPress={() => setPlatform('google_classroom')}
            variant="primary"
            size="lg"
            fullWidth
          />
          <AuraButton
            label="Canvas"
            onPress={() => setPlatform('canvas')}
            variant="secondary"
            size="lg"
            fullWidth
          />
          <AuraButton
            label="Skip for now"
            onPress={() => router.push('/onboarding/profile')}
            variant="ghost"
            fullWidth
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.h1}>
        {platform === 'google_classroom' ? 'Google Classroom' : 'Canvas'}
      </Text>
      {platform === 'google_classroom' ? (
        <>
          <Text style={styles.sub}>
            We'll open Google to sign in. We only request read access to
            coursework — no profile, no email body.
          </Text>
          <View style={{ marginTop: 32, gap: 12 }}>
            <AuraButton
              label="Continue with Google"
              onPress={connectGoogle}
              loading={submitting}
              variant="primary"
              size="lg"
              fullWidth
            />
            <AuraButton label="Back" onPress={() => setPlatform(null)} variant="ghost" />
          </View>
        </>
      ) : (
        <>
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
              <AuraButton
                label="Connect"
                onPress={connectCanvas}
                loading={submitting}
                variant="primary"
                size="lg"
                fullWidth
              />
              <AuraButton label="Back" onPress={() => setPlatform(null)} variant="ghost" />
            </View>
          </View>
        </>
      )}
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
  error: { color: Colors.red, fontSize: 13, fontWeight: '500' },
});
