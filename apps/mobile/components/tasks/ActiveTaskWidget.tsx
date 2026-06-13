import { View, Text, Pressable, StyleSheet, type DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Pause, Play, Plus, Check } from 'lucide-react-native';
import { Colors, difficultyColor } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { useTaskSession } from '../../hooks/useTaskSession';

// Lifts the widget clear of the bottom tab bar (height 84) so it floats like
// DoorDash's live order card rather than colliding with navigation.
const TAB_BAR_CLEARANCE = 92;

function formatRemaining(ms: number, overtime: boolean): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const body = `${minutes}:${String(seconds).padStart(2, '0')}`;
  return overtime ? `+${body}` : body;
}

/**
 * App-wide floating focus-session widget. Renders nothing when no task is in
 * session. Mirrors the native iOS Live Activity so the experience is identical
 * whether or not the device supports ActivityKit. Mounted once in the root
 * layout.
 */
export function ActiveTaskWidget() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    session,
    remainingMs,
    progress,
    isOvertime,
    isRunning,
    pause,
    resume,
    extend,
    complete,
  } = useTaskSession();

  if (!session) return null;

  const accent = difficultyColor(session.difficulty);
  const fillPercent: DimensionValue = `${Math.min(100, Math.round(progress * 100))}%`;

  const handleComplete = async () => {
    const result = await complete();
    if (result) {
      router.push(
        `/tasks/${result.taskId}/complete?actual=${result.actualMinutes}` as Href,
      );
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.anchor, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Focusing on ${session.title}. ${formatRemaining(remainingMs, isOvertime)} remaining.`}
        onPress={() => router.push(`/tasks/${session.taskId}`)}
        style={styles.card}
      >
        <View style={styles.headerRow}>
          <Text style={styles.subject} numberOfLines={1}>
            {session.subject.toUpperCase()}
          </Text>
          <Text style={[styles.time, isOvertime && { color: Colors.amber }]}>
            {formatRemaining(remainingMs, isOvertime)}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {session.title}
        </Text>

        {/* The river: a thin track with a glowing filled head. */}
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: fillPercent, backgroundColor: accent, shadowColor: accent },
            ]}
          />
        </View>

        <View style={styles.controls}>
          <Text style={styles.statusLabel}>
            {isRunning ? (isOvertime ? 'Overtime' : 'Focusing') : 'Paused'}
          </Text>
          <View style={styles.actions}>
            <IconButton
              label="Add 5 minutes"
              onPress={() => extend(5)}
              icon={<Plus color={Colors.textSecondary} size={18} strokeWidth={2} />}
            />
            <IconButton
              label={isRunning ? 'Pause' : 'Resume'}
              onPress={isRunning ? pause : resume}
              icon={
                isRunning ? (
                  <Pause color={Colors.mist} size={18} strokeWidth={2} fill={Colors.mist} />
                ) : (
                  <Play color={Colors.mist} size={18} strokeWidth={2} fill={Colors.mist} />
                )
              }
            />
            <IconButton
              label="Complete task"
              onPress={handleComplete}
              accent
              icon={<Check color={Colors.bgDark} size={18} strokeWidth={2.5} />}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function IconButton({
  label,
  onPress,
  icon,
  accent = false,
}: {
  label: string;
  onPress: () => void;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        accent && styles.iconButtonAccent,
        pressed && styles.pressed,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  card: {
    borderRadius: Layout.radiusCard,
    backgroundColor: 'rgba(13,22,31,0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.22)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    shadowColor: Colors.mist,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subject: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    flexShrink: 1,
  },
  time: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  title: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(168,218,220,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168,218,220,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.18)',
  },
  iconButtonAccent: { backgroundColor: Colors.mist, borderColor: Colors.mist },
  pressed: { opacity: 0.7 },
});
