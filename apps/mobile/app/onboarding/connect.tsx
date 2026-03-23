import { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { AuraButton } from '../../components/ui/AuraButton';

type PlatformChoice = 'google_classroom' | 'canvas' | 'skip' | null;

/**
 * Onboarding — Connect — /onboarding/connect
 */
export default function OnboardingConnectScreen() {
  const router = useRouter();
  const [choice, setChoice] = useState<PlatformChoice>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue(next: PlatformChoice) {
    const selected = next ?? choice;
    if (!selected) return;

    setChoice(selected);
    setSubmitting(true);

    // TODO: Supabase — create connections row in `connections` for selected platform
    // TODO: Trigger.dev — optionally kick off initial sync job for this user
    console.log('[STUB] User chose platform:', selected);

    setTimeout(() => {
      setSubmitting(false);
      router.push('/onboarding/profile');
    }, 500);
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bgDark }}>
      <View
        className="flex-1 justify-between"
        style={{ paddingHorizontal: Layout.screenPadding, paddingTop: 80, paddingBottom: 40 }}
      >
        <View>
          <Text
            className="text-xs font-light tracking-[1.5px]"
            style={{ color: Colors.textSecondary }}
          >
            STEP 1 · CONNECT
          </Text>
          <Text
            className="text-2xl font-semibold mt-2"
            style={{ color: Colors.textPrimary }}
          >
            Where does your homework live?
          </Text>
          <Text className="text-sm mt-3" style={{ color: Colors.textSecondary }}>
            Aura reads from your school platforms so you don&apos;t have to copy
            every assignment by hand.
          </Text>

          <View className="mt-6 space-y-3">
            <AuraButton
              label="Google Classroom"
              variant={choice === 'google_classroom' ? 'primary' : 'outline'}
              onPress={() => handleContinue('google_classroom')}
            />
            <AuraButton
              label="Canvas"
              variant={choice === 'canvas' ? 'primary' : 'outline'}
              onPress={() => handleContinue('canvas')}
            />
            <AuraButton
              label="I&apos;ll add things manually"
              variant={choice === 'skip' ? 'ghost' : 'ghost'}
              onPress={() => handleContinue('skip')}
            />
          </View>
        </View>

        <View>
          <AuraButton
            label="Continue"
            size="lg"
            onPress={() => handleContinue(null)}
            disabled={!choice}
            loading={submitting}
          />
          <Text className="text-xs mt-3" style={{ color: Colors.textSecondary }}>
            You can change or add platforms later in Settings. Aura will never
            post or turn in anything for you.
          </Text>
        </View>
      </View>
    </View>
  );
}

