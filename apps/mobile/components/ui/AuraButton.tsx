import { Pressable, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { Colors } from '@aura/shared/constants/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  haptic?: boolean;
}

export function AuraButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  haptic = true,
}: Props) {
  const isInert = disabled || loading;
  const handlePress = () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInert, busy: loading }}
      disabled={isInert}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant].container,
        fullWidth && styles.fullWidth,
        pressed && !isInert && styles.pressed,
        isInert && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].label.color} size="small" />
      ) : (
        <View style={styles.row}>
          {leadingIcon ? <View style={styles.icon}>{leadingIcon}</View> : null}
          <Text style={[styles.label, sizeLabel[size], variantStyles[variant].label]}>
            {label}
          </Text>
          {trailingIcon ? <View style={styles.icon}>{trailingIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '600', letterSpacing: -0.2 },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: 14, paddingVertical: 8 },
  md: { paddingHorizontal: 18, paddingVertical: 12 },
  lg: { paddingHorizontal: 24, paddingVertical: 16 },
});

const sizeLabel = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
});

const variantStyles = {
  primary: StyleSheet.create({
    container: { backgroundColor: Colors.steel },
    label: { color: Colors.textPrimary },
  }),
  secondary: StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.mist,
    },
    label: { color: Colors.mist },
  }),
  ghost: StyleSheet.create({
    container: { backgroundColor: 'transparent' },
    label: { color: Colors.textSecondary },
  }),
  destructive: StyleSheet.create({
    container: { backgroundColor: Colors.red },
    label: { color: Colors.textPrimary },
  }),
};
