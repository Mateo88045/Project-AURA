import { Pressable, Text, ActivityIndicator } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';

type AuraButtonVariant = 'primary' | 'ghost' | 'outline' | 'destructive';
type AuraButtonSize = 'sm' | 'md' | 'lg';

interface AuraButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: AuraButtonVariant;
  size?: AuraButtonSize;
}

const sizeClasses: Record<AuraButtonSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};

const baseClasses =
  'flex-row items-center justify-center rounded-lg active:opacity-80';

const variantClasses: Record<AuraButtonVariant, string> = {
  primary: '',
  ghost: '',
  outline: '',
  destructive: '',
};

const labelClasses = 'text-sm font-semibold';

export function AuraButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'md',
}: AuraButtonProps) {
  const isDisabled = disabled || loading;

  const { backgroundColor, borderColor, borderWidth, labelColor } =
    variant === 'primary'
      ? {
          backgroundColor: Colors.steel,
          borderColor: Colors.transparent,
          borderWidth: 0,
          labelColor: Colors.textPrimary,
        }
      : variant === 'destructive'
        ? {
            backgroundColor: Colors.red,
            borderColor: Colors.transparent,
            borderWidth: 0,
            labelColor: Colors.textPrimary,
          }
        : variant === 'outline'
          ? {
              backgroundColor: Colors.transparent,
              borderColor: Colors.steel,
              borderWidth: 1,
              labelColor: Colors.textPrimary,
            }
          : {
              backgroundColor: Colors.transparent,
              borderColor: 'rgba(69, 123, 157, 0.2)',
              borderWidth: 1,
              labelColor: Colors.textPrimary,
            };

  return (
    <Pressable
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        isDisabled ? 'opacity-60' : ''
      }`}
      style={{
        borderRadius: Layout.radiusButton,
        backgroundColor,
        borderColor,
        borderWidth,
      }}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textPrimary} />
      ) : (
        <Text className={labelClasses} style={{ color: labelColor }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

