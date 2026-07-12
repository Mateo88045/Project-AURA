import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';

interface StreakChipProps {
  streak: number;
}

/**
 * StreakChip — small persistent header tag ("🔥 4-day streak").
 * Quiet sibling of StreakBadge (the pop-in celebration on task completion).
 * Hidden until a streak of 2+ exists, so day one stays pressure-free.
 */
export function StreakChip({ streak }: StreakChipProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (streak < 2) return null;

  return (
    <View style={styles.chip}>
      <Text style={styles.flame} allowFontScaling={false}>
        {'\u{1F525}'}
      </Text>
      <Text style={[styles.label, { color: colors.accent.amber }]}>
        {streak}-day streak
      </Text>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      backgroundColor: c.glass.light,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border.subtle,
    },
    flame: {
      fontSize: 11,
    },
    label: {
      ...typography.micro,
    },
  });
}
