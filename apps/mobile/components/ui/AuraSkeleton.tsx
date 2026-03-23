import { View, type DimensionValue } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';

interface AuraSkeletonProps {
  width?: DimensionValue;
  height?: number;
  rounded?: boolean;
  className?: string;
}

export function AuraSkeleton({
  width = '100%',
  height = 16,
  rounded = true,
  className,
}: AuraSkeletonProps) {
  return (
    <View
      className={className}
      style={{
        backgroundColor: Colors.surface2,
        width,
        height,
        borderRadius: rounded ? 999 : 0,
      }}
    />
  );
}

