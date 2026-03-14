import { View, Text, Pressable } from 'react-native';
import { Task } from '@aura/shared/types';
import { Colors } from '@aura/shared/constants/colors';
import { DifficultyBadge } from './DifficultyBadge';
import { AuraButton } from './AuraButton';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onComplete?: () => void;
}

export function TaskCard({ task, onPress, onComplete }: TaskCardProps) {
  return (
    <Pressable
      className="w-full rounded-[14px] bg-[#111827] p-4 mb-3"
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-[#F1FAEE] text-base font-semibold">
            {task.title}
          </Text>
          <Text className="text-[#8EAFC2] text-xs mt-1">
            {task.subject} • {task.estimatedMinutes} min
          </Text>
          <Text className="text-[#8EAFC2] text-xs mt-1">
            Due {new Date(task.dueDate).toLocaleString()}
          </Text>
        </View>
        <View className="items-end">
          <DifficultyBadge difficulty={task.difficulty} />
          {onComplete && (
            <View className="mt-3">
              <AuraButton
                label="Done"
                size="sm"
                variant="ghost"
                onPress={onComplete}
              />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

