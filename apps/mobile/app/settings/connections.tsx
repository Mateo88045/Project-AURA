import { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { AuraButton } from '../../components/ui/AuraButton';
import { AuraSheet } from '../../components/ui/AuraSheet';
import { useConnections } from '../../hooks/useConnections';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';
import { initiateGoogleOAuth, saveCanvasToken } from '../../services/oauthService';
import { useAuraToast } from '../../components/ui/AuraToast';
import type { Connection, ConnectionStatus, Platform } from '@chronos/shared/types';

// ---------------------------------------------------------------------------
// Pulsing status dot — emerald breathing when active
// ---------------------------------------------------------------------------

interface PulsingDotProps {
  status: ConnectionStatus | 'disconnected';
  colors: ThemeColors;
}

function PulsingDot({ status, colors }: PulsingDotProps) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (status === 'active') {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1400 }),
          withTiming(1, { duration: 1400 }),
        ),
        -1,
        false,
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1400 }),
          withTiming(1, { duration: 1400 }),
        ),
        -1,
        false,
      );
    }
  }, [status, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const color =
    status === 'active'
      ? colors.accent.emerald
      : status === 'expired'
        ? colors.accent.amber
        : status === 'error'
          ? colors.accent.coral
          : colors.text.tertiary;

  return <Animated.View style={[dotStyles.dot, { backgroundColor: color }, animatedStyle]} />;
}

const dotStyles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

// ---------------------------------------------------------------------------
// Platform tile — hero card per platform (Google Classroom / Canvas)
// ---------------------------------------------------------------------------

interface PlatformMeta {
  name: string;
  icon: string;
  tint: string;
  gradient: readonly [string, string];
}

function getPlatformMeta(c: ThemeColors): Record<Platform, PlatformMeta> {
  return {
    google_classroom: {
      name: 'Google Classroom',
      icon: 'g.circle.fill',
      tint: c.accent.emerald,
      gradient: [c.accent.emerald + '2E', 'transparent'] as const,
    },
    canvas: {
      name: 'Canvas',
      icon: 'c.circle.fill',
      tint: c.accent.amber,
      gradient: [c.accent.amber + '2E', 'transparent'] as const,
    },
  };
}

interface PlatformTileProps {
  platform: Platform;
  connection: Connection | null;
  onSync: () => void;
  onDisconnect: () => void;
  onConnect: () => void;
  delay?: number;
  colors: ThemeColors;
  tileStyles: ReturnType<typeof makeTileStyles>;
  platformMeta: Record<Platform, PlatformMeta>;
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const minutes = Math.round((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function PlatformTile({
  platform,
  connection,
  onSync,
  onDisconnect,
  onConnect,
  delay = 0,
  colors,
  tileStyles,
  platformMeta,
}: PlatformTileProps) {
  const meta = platformMeta[platform];
  const connected = connection !== null && connection.status !== 'error';
  const lastSync = connection?.lastSyncedAt ? formatRelativeTime(connection.lastSyncedAt) : null;
  const courseCount = connected ? 6 : 0; // stub
  const statusLabel: string = !connection
    ? 'Not connected'
    : connection.status === 'active'
      ? 'Syncing nightly'
      : connection.status === 'expired'
        ? 'Reconnection needed'
        : 'Connection error';

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(500)}>
      <GlassCard intensity="regular" borderAccent style={tileStyles.card}>
        <LinearGradient
          colors={meta.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={tileStyles.headerRow}>
          <View style={[tileStyles.iconBox, { backgroundColor: meta.tint + '22' }]}>
            <AuraSymbol name={meta.icon} size={24} color={meta.tint} weight="semibold" />
          </View>
          <View style={tileStyles.headerText}>
            <Text style={tileStyles.platformName}>{meta.name}</Text>
            <View style={tileStyles.statusRow}>
              <PulsingDot status={connection?.status ?? 'disconnected'} colors={colors} />
              <Text style={tileStyles.statusText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {connected ? (
          <>
            <View style={tileStyles.statsRow}>
              <View style={tileStyles.statCol}>
                <Text style={tileStyles.statValue}>{courseCount}</Text>
                <Text style={tileStyles.statLabel}>COURSES</Text>
              </View>
              <View style={tileStyles.statDivider} />
              <View style={tileStyles.statCol}>
                <Text style={tileStyles.statValue}>{lastSync ?? '—'}</Text>
                <Text style={tileStyles.statLabel}>LAST SYNC</Text>
              </View>
            </View>

            <View style={tileStyles.actionsRow}>
              <AuraButton
                label="Sync now"
                variant="outline"
                size="md"
                onPress={onSync}
                style={tileStyles.primaryAction}
              />
              <AuraButton
                label="Disconnect"
                variant="ghost"
                size="md"
                onPress={onDisconnect}
                style={tileStyles.secondaryAction}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={tileStyles.helpText}>
              {platform === 'canvas'
                ? 'Paste a personal access token from your school Canvas settings.'
                : 'Sign in with your school Google account.'}
            </Text>
            <AuraButton
              label={platform === 'canvas' ? 'Add Canvas token' : 'Sign in'}
              variant="primary"
              size="md"
              fullWidth
              onPress={onConnect}
            />
          </>
        )}
      </GlassCard>
    </Animated.View>
  );
}

function makeTileStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      padding: spacing.cardPadding,
      gap: spacing.md,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    platformName: {
      ...typography.title2,
      color: c.text.primary,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusText: {
      ...typography.callout,
      color: c.text.secondary,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border.subtle,
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      ...typography.title2,
      color: c.text.primary,
      fontVariant: ['tabular-nums'],
    },
    statLabel: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 32,
      backgroundColor: c.border.subtle,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    primaryAction: {
      flex: 1,
    },
    secondaryAction: {
      flex: 1,
    },
    helpText: {
      ...typography.body,
      color: c.text.secondary,
      lineHeight: 22,
    },
  });
}

// ---------------------------------------------------------------------------
// Sync history (mock)
// ---------------------------------------------------------------------------

interface SyncEvent {
  id: string;
  platform: Platform;
  relative: string;
  summary: string;
  isError?: boolean;
}

const MOCK_SYNC_EVENTS: SyncEvent[] = [
  { id: 's1', platform: 'google_classroom', relative: '2h ago', summary: '3 new assignments pulled' },
  { id: 's2', platform: 'google_classroom', relative: 'Yesterday', summary: '1 assignment updated' },
  { id: 's3', platform: 'google_classroom', relative: '2d ago', summary: 'No changes' },
  { id: 's4', platform: 'google_classroom', relative: '3d ago', summary: '5 new assignments pulled' },
];

interface SyncRowProps {
  event: SyncEvent;
  isLast: boolean;
  colors: ThemeColors;
  historyStyles: ReturnType<typeof makeHistoryStyles>;
  platformMeta: Record<Platform, PlatformMeta>;
}

function SyncRow({ event, isLast, colors, historyStyles, platformMeta }: SyncRowProps) {
  const meta = platformMeta[event.platform];
  const tint = event.isError ? colors.accent.coral : meta.tint;
  return (
    <>
      <View style={historyStyles.row}>
        <View style={[historyStyles.rowDot, { backgroundColor: tint }]} />
        <View style={historyStyles.rowTextCol}>
          <Text style={historyStyles.rowTitle} numberOfLines={1}>
            {event.summary}
          </Text>
          <Text style={historyStyles.rowSub}>{meta.name}</Text>
        </View>
        <Text style={historyStyles.rowTime}>{event.relative}</Text>
      </View>
      {!isLast ? <View style={historyStyles.divider} /> : null}
    </>
  );
}

function makeHistoryStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: 14,
    },
    rowDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    rowTextCol: {
      flex: 1,
    },
    rowTitle: {
      ...typography.bodyMedium,
      color: c.text.primary,
    },
    rowSub: {
      ...typography.callout,
      color: c.text.tertiary,
      marginTop: 2,
    },
    rowTime: {
      ...typography.caption,
      color: c.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border.subtle,
      marginLeft: spacing.cardPadding + 20,
    },
  });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ConnectionsHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tileStyles = useMemo(() => makeTileStyles(colors), [colors]);
  const historyStyles = useMemo(() => makeHistoryStyles(colors), [colors]);
  const platformMeta = useMemo(() => getPlatformMeta(colors), [colors]);

  const { user: authUser } = useAuth();
  const { connections, loading } = useConnections(authUser?.id ?? '');
  const toast = useAuraToast();
  const [syncingPlatform, setSyncingPlatform] = useState<Platform | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [showCanvasSheet, setShowCanvasSheet] = useState(false);
  const [canvasTokenInput, setCanvasTokenInput] = useState('');
  const [savingCanvas, setSavingCanvas] = useState(false);

  const gc = useMemo(
    () => connections.find((c) => c.platform === 'google_classroom') ?? null,
    [connections],
  );
  const canvasConn = useMemo(
    () => connections.find((c) => c.platform === 'canvas') ?? null,
    [connections],
  );

  async function handleSync(platform: Platform) {
    if (syncingPlatform) return;
    setSyncingPlatform(platform);
    haptic.primaryCTA();
    toast.show('Syncing your assignments…', 'info');
    // TODO: Trigger.dev — fire job 'manual-platform-sync' with payload { userId, platform }
    // Job steps: fetch platform → normalize tasks → enter Pipeline A at step 3
    setTimeout(() => setSyncingPlatform(null), 600);
  }

  function handleDisconnect(_platform: Platform) {
    haptic.secondary();
    // TODO: Supabase — update connections set status='error' where user_id=authUser?.id and platform=_platform
  }

  async function handleConnect(platform: Platform) {
    haptic.primaryCTA();
    if (platform === 'google_classroom') {
      setConnectingGoogle(true);
      const result = await initiateGoogleOAuth();
      setConnectingGoogle(false);
      // TODO: Supabase — create connections row for google_classroom
      if (result) {
        toast.show('Google Classroom connected', 'success');
      } else {
        toast.show('Something went wrong — try again', 'error');
      }
    } else if (platform === 'canvas') {
      setShowCanvasSheet(true);
    }
  }

  async function handleSaveCanvasToken() {
    if (!canvasTokenInput.trim()) return;
    setSavingCanvas(true);
    try {
      await saveCanvasToken(authUser?.id ?? '', canvasTokenInput.trim());
      haptic.success();
      toast.show('Canvas connected', 'success');
    } catch {
      haptic.error();
      toast.show('Something went wrong — try again', 'error');
    } finally {
      setSavingCanvas(false);
      setShowCanvasSheet(false);
      setCanvasTokenInput('');
    }
  }

  return (
    <View style={styles.root}>
      <AmbientOrbs />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.headerRow}>
          <Pressable
            hitSlop={12}
            onPress={() => {
              haptic.secondary();
              router.back();
            }}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <AuraSymbol name="chevron.left" size={22} color={colors.text.primary} />
          </Pressable>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInUp.delay(60).duration(500)} style={styles.titleBlock}>
          <Text style={styles.eyebrow}>CONNECTIONS</Text>
          <Text style={styles.title}>Sources</Text>
          <Text style={styles.subtitle}>
            Chronos pulls assignments from these platforms every night.
          </Text>
        </Animated.View>

        {/* Platform tiles */}
        <View style={styles.tilesCol}>
          <PlatformTile
            platform="google_classroom"
            connection={gc}
            onSync={() => handleSync('google_classroom')}
            onDisconnect={() => handleDisconnect('google_classroom')}
            onConnect={() => handleConnect('google_classroom')}
            delay={140}
            colors={colors}
            tileStyles={tileStyles}
            platformMeta={platformMeta}
          />
          <PlatformTile
            platform="canvas"
            connection={canvasConn}
            onSync={() => handleSync('canvas')}
            onDisconnect={() => handleDisconnect('canvas')}
            onConnect={() => handleConnect('canvas')}
            delay={220}
            colors={colors}
            tileStyles={tileStyles}
            platformMeta={platformMeta}
          />
        </View>

        {/* Sync history */}
        <Animated.Text
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.sectionLabel}
        >
          SYNC HISTORY
        </Animated.Text>
        <Animated.View entering={FadeInUp.delay(320).duration(500)}>
          <GlassCard intensity="light" style={styles.historyCard}>
            {loading ? (
              <View style={styles.historyEmpty}>
                <Text style={styles.historyEmptyText}>Loading…</Text>
              </View>
            ) : MOCK_SYNC_EVENTS.length === 0 ? (
              <View style={styles.historyEmpty}>
                <Text style={styles.historyEmptyText}>No sync events yet</Text>
              </View>
            ) : (
              MOCK_SYNC_EVENTS.map((e, i) => (
                <SyncRow
                  key={e.id}
                  event={e}
                  isLast={i === MOCK_SYNC_EVENTS.length - 1}
                  colors={colors}
                  historyStyles={historyStyles}
                  platformMeta={platformMeta}
                />
              ))
            )}
          </GlassCard>
        </Animated.View>

        {/* Footnote */}
        <Animated.View entering={FadeIn.delay(420).duration(500)} style={styles.footnoteWrap}>
          <AuraSymbol name="lock.fill" size={12} color={colors.text.tertiary} />
          <Text style={styles.footnoteText}>
            Tokens are encrypted at rest. Chronos never stores your password.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Canvas token bottom sheet */}
      <AuraSheet
        visible={showCanvasSheet}
        onClose={() => { setShowCanvasSheet(false); setCanvasTokenInput(''); }}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Connect Canvas</Text>
          <Text style={styles.sheetBody}>
            Find your token in Canvas → Account → Settings → Approved Integrations → New Access Token.
          </Text>
          <TextInput
            style={styles.sheetInput}
            placeholder="Paste your Canvas API token"
            placeholderTextColor={colors.text.tertiary}
            value={canvasTokenInput}
            onChangeText={setCanvasTokenInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <AuraButton
            label={savingCanvas ? 'Saving…' : 'Save token'}
            size="lg"
            fullWidth
            onPress={() => { void handleSaveCanvasToken(); }}
            disabled={!canvasTokenInput.trim()}
            loading={savingCanvas}
          />
          <Text style={styles.sheetHint}>
            Tokens are encrypted at rest. Chronos never stores your password.
          </Text>
        </View>
      </AuraSheet>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    scrollContent: {
      paddingHorizontal: spacing.screenPadding,
    },

    // Header
    headerRow: {
      flexDirection: 'row',
      marginBottom: spacing.lg,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    } as ViewStyle,

    // Title block
    titleBlock: {
      marginBottom: spacing.xl,
    },
    eyebrow: {
      ...typography.caption,
      color: c.accent.sky,
      marginBottom: 6,
    },
    title: {
      ...typography.displayMedium,
      color: c.text.primary,
      marginBottom: 8,
    },
    subtitle: {
      ...typography.body,
      color: c.text.secondary,
      lineHeight: 22,
    },

    // Tiles
    tilesCol: {
      gap: spacing.md,
    },

    // Section label
    sectionLabel: {
      ...typography.caption,
      color: c.text.tertiary,
      marginTop: spacing.xl,
      marginBottom: 10,
      paddingHorizontal: 4,
    },

    // History
    historyCard: {
      paddingVertical: 4,
    },
    historyEmpty: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    historyEmptyText: {
      ...typography.callout,
      color: c.text.tertiary,
    },

    // Footnote
    footnoteWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.lg,
      paddingHorizontal: 4,
    },
    footnoteText: {
      ...typography.callout,
      color: c.text.tertiary,
      flex: 1,
    },

    // Canvas token sheet
    sheetContent: {
      paddingHorizontal: spacing.screenPadding,
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    sheetTitle: {
      ...typography.title2,
      color: c.text.primary,
    },
    sheetBody: {
      ...typography.body,
      color: c.text.secondary,
      lineHeight: 22,
    },
    sheetInput: {
      ...typography.body,
      color: c.text.primary,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    sheetHint: {
      ...typography.caption,
      color: c.text.tertiary,
      textAlign: 'center',
    },
  });
}
