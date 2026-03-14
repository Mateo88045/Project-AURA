import { View } from 'react-native';

interface AuraSkeletonProps {
  width?: number | string;
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
      className={`bg-[#1F2937] ${className ?? ''}`}
      style={{
        width,
        height,
        borderRadius: rounded ? 999 : 0,
      }}
    />
  );
}

