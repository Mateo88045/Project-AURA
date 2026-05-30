import { Stack } from 'expo-router';
import { Colors } from '@chronos/shared/constants/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bgDark },
        animation: 'slide_from_right',
      }}
    />
  );
}
