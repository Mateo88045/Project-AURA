import { View, Text } from 'react-native';

/**
 * Shadow Schedule Review — /schedule/review
 * Status: Shell — layout only, data & actions TBD.
 */
export default function ShadowScheduleReviewScreen() {
  return (
    <View className="flex-1 bg-[#0A1118] items-center justify-center px-[28px]">
      <Text className="text-[#F1FAEE] text-lg font-semibold">
        Review Shadow Plan
      </Text>
      <Text className="text-[#8EAFC2] text-sm mt-2 text-center">
        Here you&apos;ll be able to review Aura&apos;s proposed schedule for your
        tasks, approve blocks, or ask for adjustments.
      </Text>
    </View>
  );
}

