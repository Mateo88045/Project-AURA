import { useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AuraSheet } from './AuraSheet';
import { AuraSkeleton } from './AuraSkeleton';
import { AuraSymbol } from './AuraSymbol';
import { AuraButton } from './AuraButton';
import type { AuraNotification, AuraNotificationType } from '../../hooks/useNotifications';

const STAGGER_MS = 40;

const TYPE_ICON: Record<AuraNotificationType, string> = {
  sync_complete:    'arrow.triangle.2.circlepath',
  task_reminder:    'clock.fill',
  schedule_ready:   'calendar.badge.checkmark',
  streak_milestone: 'flame.fill',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
  notifications: AuraNotification[];
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationCenter({
  visible,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
}: NotificationCenterProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <AuraSheet visible={visible} onClose={onClose}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <AuraButton label="Mark all read" variant="ghost" onPress={onMarkAllRead} />
        )}
      </View>

      {/* Content */}
      {loading && (
        <View style={styles.loadingList}>
          <AuraSkeleton height={56} />
          <AuraSkeleton height={56} />
          <AuraSkeleton height={56} />
        </View>
      )}

      {!loading && notifications.length === 0 && (
        <View style={styles.empty}>
          <AuraSymbol name="bell.slash" size={32} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>Chronos hasn't sent you anything yet</Text>
        </View>
      )}

      {!loading && notifications.length > 0 && (
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {notifications.map((n, i) => (
            <Animated.View
              key={n.id}
              entering={FadeInDown.delay(STAGGER_MS * i).duration(220)}
            >
              <Pressable
                onPress={() => onMarkRead(n.id)}
                style={[styles.row, !n.read && styles.rowUnread]}
                accessibilityRole="button"
                accessibilityLabel={n.title}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.glass.light }]}>
                  <AuraSymbol
                    name={TYPE_ICON[n.type]}
                    size={18}
                    color={n.read ? colors.text.tertiary : colors.accent.blue}
                    weight="semibold"
                  />
                </View>
                <View style={styles.textCol}>
                  <Text style={[styles.rowTitle, !n.read && { color: colors.text.primary }]} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text style={styles.rowBody} numberOfLines={2}>{n.body}</Text>
                </View>
                <View style={styles.meta}>
                  <Text style={styles.time}>{relativeTime(n.createdAt)}</Text>
                  {!n.read && <View style={[styles.unreadDot, { backgroundColor: colors.accent.blue }]} />}
                </View>
              </Pressable>
              {i < notifications.length - 1 && <View style={styles.divider} />}
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </AuraSheet>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.title2,
      color: c.text.primary,
    },
    loadingList: {
      gap: spacing.md,
    },
    empty: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.md,
    },
    emptyText: {
      ...typography.body,
      color: c.text.tertiary,
      textAlign: 'center',
    },
    list: {
      maxHeight: 420,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 14,
    },
    rowUnread: {
      opacity: 1,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    textCol: {
      flex: 1,
    },
    rowTitle: {
      ...typography.bodyMedium,
      color: c.text.secondary,
    },
    rowBody: {
      ...typography.callout,
      color: c.text.tertiary,
      marginTop: 2,
      lineHeight: 18,
    },
    meta: {
      alignItems: 'flex-end',
      gap: 6,
      minWidth: 40,
    },
    time: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border.subtle,
      marginLeft: 52,
    },
  });
}
