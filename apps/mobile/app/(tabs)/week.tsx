import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { useTasksForDay } from '../../hooks/useTasksForDay';
import { TaskCard } from '../../components/ui/TaskCard';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';

const MOCK_USER_ID = 'user-1';

function formatDayLabel(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function toDayIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function WeekScreen() {
  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());

    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [today]);

  const [selectedDayIso, setSelectedDayIso] = useState<string>(toDayIso(today));
  const { tasks, loading, error } = useTasksForDay(MOCK_USER_ID, selectedDayIso);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bgDark }}>
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />

      <View style={{ paddingHorizontal: Layout.screenPadding }} className="pt-12">
        <Text className="text-2xl font-semibold" style={{ color: Colors.textPrimary }}>
          This week
        </Text>
        <Text className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
          Tap a day to see what&apos;s coming.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-5"
          contentContainerStyle={{ gap: 10 }}
        >
          {weekDays.map((day) => {
            const dayIso = toDayIso(day);
            const isSelected = dayIso === selectedDayIso;
            return (
              <Pressable
                key={dayIso}
                className={`px-4 py-3 rounded-[14px] border ${
                  isSelected ? '' : 'bg-transparent'
                }`}
                style={{
                  backgroundColor: isSelected ? Colors.surface1 : Colors.transparent,
                  borderColor: isSelected ? Colors.mist : 'rgba(168, 218, 220, 0.15)',
                }}
                onPress={() => setSelectedDayIso(dayIso)}
              >
                <Text className="text-xs" style={{ color: Colors.textSecondary }}>
                  {formatDayLabel(day)}
                </Text>
                <Text
                  className="text-base font-semibold mt-1"
                  style={{ color: Colors.textPrimary }}
                >
                  {day.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="mt-6 flex-1">
          {loading && (
            <View>
              <AuraSkeleton height={18} className="mb-3" />
              <AuraSkeleton height={80} className="mb-3" />
              <AuraSkeleton height={80} className="mb-3" />
            </View>
          )}

          {!loading && error && (
            <Text className="text-sm" style={{ color: Colors.red }}>
              Couldn&apos;t load tasks for this day.
            </Text>
          )}

          {!loading && !error && tasks.length === 0 && (
            <View className="mt-6">
              <Text
                className="text-base font-semibold"
                style={{ color: Colors.textPrimary }}
              >
                Nothing scheduled yet
              </Text>
              <Text className="text-sm mt-2" style={{ color: Colors.textSecondary }}>
                Once Aura syncs your classes, you&apos;ll see your week fill in.
              </Text>
            </View>
          )}

          {!loading && !error && tasks.length > 0 && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
              className="mt-2"
            >
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbOne: {
    position: 'absolute',
    top: -70,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: Colors.mist,
    opacity: 0.1,
  },
  orbTwo: {
    position: 'absolute',
    bottom: -70,
    left: -30,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: Colors.steel,
    opacity: 0.12,
  },
});
