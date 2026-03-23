import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { AuraAvatar } from '../../components/ui/AuraAvatar';
import { AuraButton } from '../../components/ui/AuraButton';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useConnections } from '../../hooks/useConnections';
import { requestSundayBriefing } from '../../services/jobs';

const MOCK_USER_ID = 'user-1';

export default function SettingsScreen() {
  const router = useRouter();
  const [briefingBusy, setBriefingBusy] = useState(false);
  const [briefingMessage, setBriefingMessage] = useState<string | null>(null);
  const { user, loading: userLoading, error: userError } =
    useUserProfile(MOCK_USER_ID);
  const { connections } = useConnections(MOCK_USER_ID);

  const connectionSummary = useMemo(() => {
    const active = connections.filter((c) => c.status === 'active').length;
    return `${active} active connection${active === 1 ? '' : 's'}`;
  }, [connections]);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bgDark }}>
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />

      <View style={{ paddingHorizontal: Layout.screenPadding }} className="pt-12">
        <Text className="text-2xl font-semibold" style={{ color: Colors.textPrimary }}>
          Settings
        </Text>
        <Text className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
          Tune Aura to match your life.
        </Text>

        <View
          className="mt-6 flex-row items-center justify-between rounded-[14px] p-4"
          style={{ backgroundColor: Colors.surface1 }}
        >
          <View>
            <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
              {userLoading ? 'Loading…' : user?.displayName ?? 'Student'}
            </Text>
            <Text className="text-xs mt-1" style={{ color: Colors.textSecondary }}>
              {userError ? 'Profile error' : connectionSummary}
            </Text>
          </View>
          <AuraAvatar name={user?.displayName ?? 'Student'} />
        </View>

        <View className="mt-6 gap-3">
          <AuraButton
            label="Profile"
            variant="ghost"
            onPress={() => router.push('/onboarding/profile')}
          />
          <AuraButton
            label="Connections (coming soon)"
            variant="ghost"
            onPress={() => {
              // eslint-disable-next-line no-console
              console.log('[STUB] settings connections');
            }}
          />
          <AuraButton
            label="Guardrails (coming soon)"
            variant="ghost"
            onPress={() => {
              // eslint-disable-next-line no-console
              console.log('[STUB] settings guardrails');
            }}
          />
          <AuraButton
            label="Aura’s brain (coming soon)"
            variant="ghost"
            onPress={() => {
              // eslint-disable-next-line no-console
              console.log('[STUB] settings brain');
            }}
          />
          <AuraButton
            label="Run Sunday briefing job"
            variant="outline"
            loading={briefingBusy}
            onPress={() => {
              setBriefingMessage(null);
              setBriefingBusy(true);
              void requestSundayBriefing(MOCK_USER_ID)
                .then((r) => {
                  setBriefingMessage(`Job started (run ${r.runId})`);
                })
                .catch((e: unknown) => {
                  setBriefingMessage(
                    e instanceof Error ? e.message : 'Job request failed',
                  );
                })
                .finally(() => setBriefingBusy(false));
            }}
          />
        </View>
        {briefingMessage ? (
          <Text
            className="text-xs mt-2"
            style={{ color: Colors.textSecondary }}
          >
            {briefingMessage}
          </Text>
        ) : null}

        <View className="mt-10">
          <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
            About
          </Text>
          <Text className="text-sm mt-2" style={{ color: Colors.textSecondary }}>
            Aura drafts a shadow plan each day, then you approve it. Over time it
            learns what takes you longer than expected.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbOne: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: Colors.mist,
    opacity: 0.1,
  },
  orbTwo: {
    position: 'absolute',
    bottom: -70,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: Colors.steel,
    opacity: 0.12,
  },
});
