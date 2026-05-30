import { useMemo } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { typography, type ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';

type Variant =
  | 'displayLarge'
  | 'displayMedium'
  | 'title1'
  | 'title2'
  | 'headline'
  | 'body'
  | 'bodyMedium'
  | 'callout'
  | 'caption'
  | 'micro';

// Chronos's text-color vocabulary. Note: there is no "violet" — the only
// accent hues we recognize are Steel, Mist, easy/moderate/hard.
type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'steel'    // Chronos's primary CTA color
  | 'mist'     // Chronos's secondary glow color
  | 'easy'
  | 'moderate'
  | 'hard';

function makeColorMap(c: ThemeColors): Record<TextColor, string> {
  return {
    primary:   c.text.primary,
    secondary: c.text.secondary,
    tertiary:  c.text.tertiary,
    inverse:   c.text.inverse,
    steel:     c.accent.blue,
    mist:      c.accent.sky,
    easy:      c.accent.emerald,
    moderate:  c.accent.amber,
    hard:      c.accent.coral,
  };
}

interface AuraTextProps extends TextProps {
  variant?: Variant;
  color?: TextColor;
  children: React.ReactNode;
}

export function AuraText({
  variant = 'body',
  color,
  style,
  children,
  ...props
}: AuraTextProps) {
  const { colors } = useTheme();
  const colorMap = useMemo(() => makeColorMap(colors), [colors]);
  const base = typography[variant] as TextStyle;
  // Always fall back through the live theme so light mode gets proper ink.
  const themedBase: TextStyle = { ...base, color: colors.text.primary };
  const override: TextStyle = color ? { color: colorMap[color] } : {};

  return (
    <Text style={[themedBase, override, style]} {...props}>
      {children}
    </Text>
  );
}
