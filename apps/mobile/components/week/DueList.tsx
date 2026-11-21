import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { radius } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import type { Task } from '@chronos/shared/types';
import { useTheme } from '../../lib/theme';
import { haptic } from '../../lib/haptics';

/** White inset list of homework due; each row opens the task. */
export interface DueItem {
  task: Task;
  dayLabel: string;
}

export function DueList({ items }: { items: DueItem[] }) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      {items.map(({ task: t, dayLabel }, i) => (
        <Pressable
          key={`${t.id}:${i}`}
          onPress={() => { haptic.selection(); router.push(`/tasks/${t.id}` as Href); }}
          style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <View style={styles.textCol}>
            <Text style={styles.title} numberOfLines={1}>{t.title}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {t.subject} · {dayLabel}
            </Text>
          </View>
          <Text style={styles.minutes}>{t.estimatedMinutes} m</Text>
        </Pressable>
      ))}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.background.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border.glass,
      overflow: 'hidden',
    },
    row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border.subtle },
    pressed: { backgroundColor: c.glass.light },
    textCol: { flex: 1, gap: 2 },
    title: { fontSize: 15, fontWeight: '600', color: c.text.primary },
    meta: { fontSize: 13, color: c.text.secondary },
    minutes: { fontSize: 14, fontWeight: '600', color: c.text.secondary, fontVariant: ['tabular-nums'] },
  });
}
