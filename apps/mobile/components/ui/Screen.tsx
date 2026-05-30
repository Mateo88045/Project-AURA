import { type ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { spacing } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AmbientOrbs } from './AmbientOrbs';

interface ScreenProps {
  children: ReactNode;
  orbs?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}

/**
 * Base screen wrapper: applies the primary background, optional AmbientOrbs,
 * and horizontal screen padding. Does NOT apply safe area insets — screens
 * handle their own top/bottom padding so headers can sit flush under the notch.
 */
export function Screen({ children, orbs = true, padded = true, style }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background.primary }, style]}>
      {orbs && <AmbientOrbs />}
      <View style={[styles.content, padded && styles.padded]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.screenPadding,
  },
});
