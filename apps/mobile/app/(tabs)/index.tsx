import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { useTodaySchedule } from '../../hooks/useTodaySchedule';
import { useUserProfile } from '../../hooks/useUserProfile';
import { AuraAvatar } from '../../components/ui/AuraAvatar';
import { AuraButton } from '../../components/ui/AuraButton';
import { AuraSheet } from '../../components/ui/AuraSheet';
import { TaskCard } from '../../components/ui/TaskCard';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';

const MOCK_USER_ID = 'user-1';

export default function TodayScreen() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const dayIso = today.toISOString().slice(0, 10);

  const { user } = useUserProfile(MOCK_USER_ID);
  const { scheduledBlocks, fixedEvents, loading, error } = useTodaySchedule(
    MOCK_USER_ID,
    dayIso,
  );

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedBlock = useMemo(
    () => scheduledBlocks.find((block) => block.taskId === selectedTaskId),
    [scheduledBlocks, selectedTaskId],
  );

  const friendlyDate = useMemo(
    () =>
      today.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    [today],
  );

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bgDark }}>
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />

      <View
        className="flex-1"
        style={{ paddingHorizontal: Layout.screenPadding }}
      >
        <View className="pt-12 pb-6 flex-row items-center justify-between">
          <View>
            <Text
              className="text-xs font-light tracking-[1.5px]"
              style={{ color: Colors.textSecondary }}
            >
              TODAY
            </Text>
            <Text
              className="text-2xl font-semibold mt-1"
              style={{ color: Colors.textPrimary }}
            >
              {friendlyDate}
            </Text>
            <Text className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
              Hey, {user?.displayName ?? 'there'}
            </Text>
          </View>
          <AuraAvatar name={user?.displayName ?? 'Aura User'} />
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <Text
            className="text-base font-semibold"
            style={{ color: Colors.textPrimary }}
          >
            Your river
          </Text>
          <AuraButton
            label="Review shadow plan"
            size="sm"
            variant="ghost"
            onPress={() => router.push('/schedule/review')}
          />
        </View>

        {loading && (
          <View className="mt-4">
            <AuraSkeleton height={18} className="mb-3" />
            <AuraSkeleton height={80} className="mb-3" />
            <AuraSkeleton height={80} className="mb-3" />
          </View>
        )}

        {!loading && error && (
          <View className="mt-8 items-center">
            <Text className="text-sm mb-3" style={{ color: Colors.red }}>
              We couldn&apos;t load today&apos;s schedule.
            </Text>
            <AuraButton
              label="Try again"
              onPress={() => {
                // No-op; hook will re-run if dependencies change. In a real app
                // we might bump a key or expose a refetch function.
              }}
            />
          </View>
        )}

        {!loading && !error && scheduledBlocks.length === 0 && (
          <View className="mt-8">
            <Text
              className="text-base font-semibold"
              style={{ color: Colors.textPrimary }}
            >
              Aura is still learning your week
            </Text>
            <Text className="text-sm mt-2" style={{ color: Colors.textSecondary }}>
              Once you connect your classes, Aura will start drafting a plan and
              your river will light up with tasks.
            </Text>
          </View>
        )}

        {!loading && !error && scheduledBlocks.length > 0 && (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row">
              <View className="items-center mr-4">
                <View
                  className="flex-1 w-px"
                  style={{ backgroundColor: Colors.mist, opacity: 0.3 }}
                />
              </View>
              <View className="flex-1">
                {fixedEvents.map((event) => (
                  <View
                    key={event.id}
                    className="flex-row items-center mb-4"
                  >
                    <View
                      className="w-3 h-3 rounded-full border mr-3"
                      style={{ borderColor: Colors.textSecondary }}
                    />
                    <View className="flex-1">
                      <Text className="text-xs" style={{ color: Colors.textSecondary }}>
                        {event.startTime} – {event.endTime}
                      </Text>
                      <Text
                        className="text-sm mt-0.5"
                        style={{ color: Colors.textSecondary }}
                      >
                        {event.title}
                      </Text>
                    </View>
                  </View>
                ))}

                {scheduledBlocks.map((block) => (
                  <View
                    key={block.id}
                    className="flex-row items-stretch mb-4"
                  >
                    <View className="items-center mr-3">
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: Colors.mist,
                          shadowColor: Colors.mist,
                          shadowOpacity: 0.6,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 0 },
                        }}
                      />
                    </View>
                    <View className="flex-1">
                      {block.task && (
                        <TaskCard
                          task={block.task}
                          onPress={() => setSelectedTaskId(block.taskId ?? '')}
                        />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      <AuraSheet
        visible={!!selectedBlock && !!selectedBlock.task}
        onClose={() => setSelectedTaskId(null)}
      >
        {selectedBlock && selectedBlock.task && (
          <TaskCard task={selectedBlock.task} onComplete={() => {}} />
        )}
      </AuraSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  orbOne: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: Colors.mist,
    opacity: 0.12,
  },
  orbTwo: {
    position: 'absolute',
    bottom: -60,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: Colors.steel,
    opacity: 0.16,
  },
});

