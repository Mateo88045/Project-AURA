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
  primary: 'bg-[#457B9D]',
  ghost: 'bg-transparent border border-[#457B9D33]',
  outline: 'bg-transparent border border-[#457B9D]',
  destructive: 'bg-[#E76F6F]',
};

const labelClasses = 'text-[#F1FAEE] text-sm font-semibold';

export function AuraButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'md',
}: AuraButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        isDisabled ? 'opacity-60' : ''
      }`}
      style={{ borderRadius: Layout.radiusButton }}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textPrimary} />
      ) : (
        <Text className={labelClasses}>{label}</Text>
      )}
    </Pressable>
  );
}

