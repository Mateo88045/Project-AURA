import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AuraButton } from '../ui/AuraButton';
import { DifficultyBars } from '../ui/DifficultyBars';

interface NowHeroCardProps {
  title: string;
  subject: string;
  estimatedMinutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  onStart: () => void;
}

/**
 * NowHeroCard — the "what am I doing right now" hero on the Today screen.
 * A solid dark surface with a diagonal accent bloom and a left glow edge that
 * echoes the river, so it reads as alive and legible on the dark canvas —
 * replacing the earlier GlassView, which resolved to a flat gray slab on iOS 26
 * when there was nothing behind it to refract.
 */
export function NowHeroCard({
  title,
  subject,
  estimatedMinutes,
  difficulty,
  onStart,
}: NowHeroCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      {/* Diagonal accent bloom — brightest at the top-left, fading to nothing */}
      <LinearGradient
        colors={[colors.accent.blue + '30', colors.accent.blue + '0F', 'transparent']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Left glow edge — the river, carried into the hero */}
      <View style={styles.accentEdge} />

      <View style={styles.content}>
        <View style={styles.nowRow}>
          <View style={styles.nowDot} />
          <Text style={[typography.micro, styles.nowLabel]}>NOW</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.meta}>
          {subject} · {estimatedMinutes} min
        </Text>
        <View style={styles.bars}>
          <DifficultyBars level={difficulty} animated={false} />
        </View>
        <View style={styles.button}>
          <AuraButton label="Start" onPress={onStart} fullWidth />
        </View>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: c.background.surface,
      borderWidth: 1,
      borderColor: c.border.glass,
    },
    accentEdge: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: c.accent.blue,
    },
    content: {
      padding: spacing.xl,
    },
    nowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    nowDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: c.accent.blue,
      shadowColor: c.accent.blue,
      shadowOpacity: 0.7,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 0 },
    },
    nowLabel: {
      color: c.accent.blue,
    },
    title: {
      ...typography.title1,
      color: c.text.primary,
      marginTop: spacing.sm,
    },
    meta: {
      ...typography.callout,
      color: c.text.secondary,
      marginTop: spacing.xs,
    },
    bars: {
      marginTop: spacing.md,
    },
    button: {
      marginTop: spacing.lg,
    },
  });
}
