import { View, Text, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, User, Link2, ShieldCheck, Brain, Clock, LogOut, FileText, LifeBuoy, CalendarDays } from 'lucide-react-native';
import { Colors } from '@chronos/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ChronosAvatar } from '../../components/ui/ChronosAvatar';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useToast } from '../../components/ui/ChronosToast';
import { signOut } from '../../services/auth';
import { PRIVACY_POLICY_URL, SUPPORT_URL, TERMS_URL } from '../../lib/env';

interface Row {
  label: string;
  value?: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

async function openExternal(url: string, toast: { show: (msg: string, variant?: 'info' | 'error' | 'success') => void }) {
  if (!url) {
    toast.show('Link not configured yet.', 'info');
    return;
  }
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      toast.show('Can\'t open that link.', 'error');
      return;
    }
    await Linking.openURL(url);
  } catch {
    toast.show('Can\'t open that link.', 'error');
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const toast = useToast();

  const onSignOut = () => {
    Alert.alert('Sign out?', "You'll need your school login to come back in.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          toast.show('Signed out.', 'info');
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const rows: Row[] = [
    {
      label: 'Profile',
      value: user?.displayName,
      icon: <User color={Colors.textSecondary} size={18} strokeWidth={1.8} />,
      onPress: () => router.push('/onboarding/profile'),
    },
    {
      label: 'Connections',
      icon: <Link2 color={Colors.textSecondary} size={18} strokeWidth={1.8} />,
      onPress: () => router.push('/settings/connections'),
    },
    {
      label: 'Fixed events',
      icon: <CalendarDays color={Colors.textSecondary} size={18} strokeWidth={1.8} />,
      onPress: () => router.push('/settings/fixed-events'),
    },
    {
      label: 'Guardrails',
      icon: <ShieldCheck color={Colors.textSecondary} size={18} strokeWidth={1.8} />,
      onPress: () => router.push('/settings/guardrails'),
    },
    {
      label: 'Chronos\'s brain',
      icon: <Brain color={Colors.textSecondary} size={18} strokeWidth={1.8} />,
      onPress: () => router.push('/settings/brain'),
    },
    {
      label: 'Daily trigger time',
      value: user?.dailyTriggerTime,
      icon: <Clock color={Colors.textSecondary} size={18} strokeWidth={1.8} />,
      onPress: () => router.push('/settings/guardrails'),
    },
    {
      label: 'Privacy policy',
      icon: <ShieldCheck color={Colors.textSecondary} size={18} strokeWidth={1.8} />,
      onPress: () => openExternal(PRIVACY_POLICY_URL, toast),
    },
    {
      label: 'Terms of service',
      icon: <FileText color={Colors.textSecondary} size={18} strokeWidth={1.8} />,
      onPress: () => openExternal(TERMS_URL, toast),
    },
    {
      label: 'Contact support',
      icon: <LifeBuoy color={Colors.textSecondary} size={18} strokeWidth={1.8} />,
      onPress: () => openExternal(SUPPORT_URL, toast),
    },
    {
      label: 'Sign out',
      icon: <LogOut color={Colors.red} size={18} strokeWidth={1.8} />,
      onPress: onSignOut,
      destructive: true,
    },
  ];

  return (
    <ScreenContainer>
      <View style={styles.userBlock}>
        <ChronosAvatar name={user?.displayName ?? '—'} size={56} />
        <View>
          <Text style={styles.name}>{user?.displayName ?? '—'}</Text>
          <Text style={styles.meta}>
            Grade {user?.gradeLevel ?? '—'} · {user?.email ?? '—'}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 32, gap: 4 }}>
        {rows.map((r) => (
          <Pressable
            key={r.label}
            onPress={r.onPress}
            accessibilityRole="button"
            accessibilityLabel={r.label}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.rowIcon}>{r.icon}</View>
            <Text style={[styles.rowLabel, r.destructive && { color: Colors.red }]}>
              {r.label}
            </Text>
            <View style={styles.rowRight}>
              {r.value ? <Text style={styles.rowValue}>{r.value}</Text> : null}
              {!r.destructive ? (
                <ChevronRight color={Colors.textSecondary} size={16} />
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  userBlock: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  meta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(168,218,220,0.08)',
  },
  pressed: { opacity: 0.6 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(168,218,220,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, color: Colors.textPrimary, fontSize: 15, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { color: Colors.textSecondary, fontSize: 13 },
});
