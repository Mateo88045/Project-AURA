import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { AuraButton } from '../../components/ui/AuraButton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useConnections } from '../../hooks/useConnections';
import { useToast } from '../../components/ui/AuraToast';

const PLATFORM_LABELS = {
  google_classroom: 'Google Classroom',
  canvas: 'Canvas',
} as const;

const STATUS_COLOR = {
  active: Colors.green,
  expired: Colors.amber,
  error: Colors.red,
} as const;

export default function ConnectionsHub() {
  const router = useRouter();
  const toast = useToast();
  const { data: user } = useCurrentUser();
  const { data, loading } = useConnections(user?.id ?? null);

  const revoke = (id: string) => {
    // TODO: Supabase — delete from connections where id = $id and user_id = auth.uid().
    // Also revoke OAuth token server-side (Google revocation endpoint or Canvas
    // /api/v1/users/self/tokens/$tokenId delete).
    console.log('[STUB] revoke connection', id);
    toast.show('Connection removed.', 'info');
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Connections" eyebrow="Settings" />
      {loading ? (
        <View style={{ gap: 12 }}>
          <AuraSkeleton height={72} />
          <AuraSkeleton height={72} />
        </View>
      ) : data.length === 0 ? (
        <EmptyState
          title="No platforms connected."
          body="Connect Google Classroom or Canvas to start pulling assignments."
          action={
            <AuraButton
              label="Connect now"
              onPress={() => router.push('/onboarding/connect')}
              variant="primary"
            />
          }
        />
      ) : (
        <View style={{ gap: 12 }}>
          {data.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.platform}>{PLATFORM_LABELS[c.platform]}</Text>
                <Text style={styles.synced}>
                  Last synced{' '}
                  {new Date(c.lastSyncedAt).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <View style={styles.statusRow}>
                  <View style={[styles.dot, { backgroundColor: STATUS_COLOR[c.status] }]} />
                  <Text style={[styles.status, { color: STATUS_COLOR[c.status] }]}>
                    {c.status}
                  </Text>
                </View>
                <AuraButton label="Disconnect" onPress={() => revoke(c.id)} variant="ghost" size="sm" />
              </View>
            </View>
          ))}
          <View style={{ marginTop: 16 }}>
            <AuraButton
              label="Connect another platform"
              onPress={() => router.push('/onboarding/connect')}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.12)',
    backgroundColor: 'rgba(168,218,220,0.04)',
  },
  platform: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  synced: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  status: { fontSize: 11, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase' },
});
