import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AuraSymbol } from '../ui/AuraSymbol';
import { haptic } from '../../lib/haptics';

interface DraftReviewChipProps {
  /** Number of shadow blocks awaiting approval. Chip hides itself at 0. */
  count: number;
  onPress: () => void;
}

/**
 * The tap target for pending shadow drafts. The DayPulse stats line can only
 * *mention* drafts — this chip is how the user actually reaches the review
 * sheet from Today, which is where they are when the notification lands.
 */
export function DraftReviewChip({ count, onPress }: DraftReviewChipProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (count === 0) return null;

  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      // Plain style only — NativeWind's cssInterop drops Pressable function
      // styles, so pressed feedback comes from the haptic instead.
      style={styles.chip}
      accessibilityRole="button"
      accessibilityLabel={`Review ${count} draft ${count === 1 ? 'block' : 'blocks'} Chronos proposed`}
    >
      <View style={styles.iconWrap}>
        <AuraSymbol name="sparkles" size={13} color={colors.accent.sky} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {count === 1 ? 'Chronos drafted 1 block' : `Chronos drafted ${count} blocks`}
      </Text>
      <Text style={styles.action}>Review</Text>
      <AuraSymbol name="chevron.right" size={11} color={colors.accent.sky} />
    </Pressable>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      paddingLeft: 10,
      paddingRight: 12,
      paddingVertical: 8,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.accent.sky + '66',
      backgroundColor: c.glass.medium,
    },
    iconWrap: {
      width: 16,
      alignItems: 'center',
    },
    label: {
      ...typography.callout,
      color: c.text.primary,
      flexShrink: 1,
    },
    action: {
      ...typography.callout,
      fontWeight: '600' as const,
      color: c.accent.sky,
    },
  });
}
