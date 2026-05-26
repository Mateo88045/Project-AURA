import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AuraButton } from '../../components/ui/AuraButton';

export default function OnboardingWelcome() {
  const router = useRouter();
  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Text style={styles.eyebrow}>AURA</Text>
        <Text style={styles.title}>
          <Text style={{ fontWeight: '300' }}>The calendar that</Text>{'\n'}
          <Text style={{ fontWeight: '700' }}>manages you.</Text>
        </Text>
        <Text style={styles.body}>
          Aura connects to your classes, reads your assignments, and lays them
          across your free time so you never have to plan a study session again.
        </Text>
      </View>
      <View style={{ gap: 12, paddingBottom: 12 }}>
        <AuraButton
          label="Connect your school"
          onPress={() => router.push('/onboarding/connect')}
          variant="primary"
          size="lg"
          fullWidth
        />
        <AuraButton
          label="I'll connect later"
          onPress={() => router.push('/onboarding/profile')}
          variant="ghost"
          fullWidth
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: Colors.mist,
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: '600',
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1.2,
    marginBottom: 16,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 320,
  },
});
