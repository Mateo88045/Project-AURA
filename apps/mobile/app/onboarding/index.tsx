import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@chronos/shared/constants/colors';
import { ChronosButton } from '../../components/ui/ChronosButton';
import AmbientOrbs from '../../components/onboarding/AmbientOrbs';
import { setAuthToken, setUserId } from '../../lib/storage';

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const [skipping, setSkipping] = useState(false);

  /**
   * Guest mode: lets the user try the app with mock data before committing
   * to an account. Required by App Store 5.1.1 — apps can't gate trial of
   * core functionality behind account creation. The auth guard in _layout
   * reads this token and considers the user "signed in" for navigation
   * purposes; demo-mode hooks render mock data.
   */
  const enterGuestMode = async () => {
    setSkipping(true);
    try {
      await setAuthToken('guest');
      await setUserId('guest-user');
      router.replace('/(tabs)');
    } finally {
      setSkipping(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <AmbientOrbs />

      <View style={styles.content}>
        <View style={styles.wordmark}>
          <Text style={styles.wordmarkText}>chronos</Text>
          <View style={styles.glowDot} />
        </View>

        <View style={styles.heroText}>
          <Text style={styles.taglineThin}>Your schedule,</Text>
          <Text style={styles.taglineBold}>handled.</Text>
        </View>

        <Text style={styles.subCopy}>
          Chronos connects to your classes, grades your workload, and builds a
          real study plan around your actual life.
        </Text>
      </View>

      <View style={styles.footer}>
        <ChronosButton
          label="Connect your school"
          onPress={() => router.push('/onboarding/connect')}
          fullWidth
        />
        <ChronosButton
          label="Try it first"
          onPress={enterGuestMode}
          loading={skipping}
          variant="ghost"
          fullWidth
        />
        <Text style={styles.footerNote}>
          Takes about 2 minutes. No card required.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    paddingHorizontal: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordmarkText: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 6,
  },
  glowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.mist,
    shadowColor: Colors.mist,
    shadowRadius: 6,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
  },
  heroText: {
    gap: 0,
  },
  taglineThin: {
    color: Colors.textSecondary,
    fontSize: 44,
    fontWeight: '300',
    letterSpacing: -1.2,
    lineHeight: 52,
  },
  taglineBold: {
    color: Colors.textPrimary,
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1.2,
    lineHeight: 52,
  },
  subCopy: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 23,
    maxWidth: 320,
  },
  footer: {
    paddingBottom: 16,
    gap: 14,
  },
  footerNote: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.7,
  },
});
