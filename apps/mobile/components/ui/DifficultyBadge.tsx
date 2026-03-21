import { View } from 'react-native';
import { Colors, difficultyColor } from '@aura/shared/constants/colors';

interface DifficultyBadgeProps {
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const color = difficultyColor(difficulty);

  return (
    <View className="flex-row gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < difficulty;
        return (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="h-[3px] w-[10px] rounded-full"
            style={{
              backgroundColor: filled ? color : Colors.surface3,
            }}
          />
        );
      })}
    </View>
  );
}

