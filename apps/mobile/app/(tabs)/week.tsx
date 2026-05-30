import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@chronos/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ChronosSkeleton } from '../../components/ui/ChronosSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useWeekScheduledBlocks } from '../../hooks/useWeekScheduledBlocks';
import { useFixedEvents } from '../../hooks/useFixedEvents';
import { addDays, isSameDay, startOfWeek, todayKey, minutesBetween } from '../../lib/time';

export default function WeekScreen() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const fixed = useFixedEvents(user?.id ?? null);

  const days = useMemo(() => {
    const start = startOfWeek();
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  const dayKeys = useMemo(() => days.map((d) => todayKey(d)), [days]);
  const week = useWeekScheduledBlocks(user?.id ?? null, dayKeys);

  const loading = week.loading || fixed.loading;

  return (
    <ScreenContainer>
      <Text style={styles.h1}>This week</Text>
      <Text style={styles.sub}>Tap a day to dive in.</Text>

      {loading ? (
        <View style={{ gap: 14, marginTop: 24 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <ChronosSkeleton key={i} height={72} radius={14} />
          ))}
        </View>
      ) : week.error ? (
        <View style={{ marginTop: 24 }}>
          <ErrorState
            message="Couldn't load this week's schedule."
            onRetry={week.refetch}
          />
        </View>
      ) : (
        <View style={{ gap: 12, marginTop: 24 }}>
          {days.map((d) => {
            const isToday = isSameDay(d, new Date());
            const weekday = d.getDay();
            const fixedHere = fixed.data.filter((e) => e.daysOfWeek.includes(weekday));
            const fixedMins = fixedHere.reduce((acc, e) => {
              const [sh, sm] = e.startTime.split(':').map(Number);
              const [eh, em] = e.endTime.split(':').map(Number);
              return acc + (eh * 60 + em) - (sh * 60 + sm);
            }, 0);
            const dayKey = todayKey(d);
            const blocksForDay = week.byDay[dayKey] ?? [];
            const aiMins = blocksForDay
              .filter((b) => !!b.taskId)
              .reduce((acc, b) => acc + minutesBetween(b.startTime, b.endTime), 0);
            const density = Math.min(1, (fixedMins + aiMins) / (12 * 60));

            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => router.push('/(tabs)')}
                accessibilityRole="button"
                accessibilityLabel={`Open ${d.toLocaleDateString()}`}
                style={({ pressed }) => [
                  styles.dayCard,
                  isToday && styles.dayCardToday,
                  pressed && styles.pressed,
                ]}
              >
                <View>
                  <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                    {d.toLocaleDateString(undefined, { weekday: 'short' })}
                  </Text>
                  <Text style={styles.dayDate}>{d.getDate()}</Text>
                </View>
                <View style={styles.densityBar}>
                  <View style={[styles.densityFill, { width: `${density * 100}%` }]} />
                </View>
                <Text style={styles.dayHours}>
                  {Math.round((fixedMins + aiMins) / 60 * 10) / 10}h
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -1.2,
  },
  sub: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(168,218,220,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.1)',
    borderRadius: 14,
    gap: 14,
  },
  dayCardToday: {
    borderColor: 'rgba(168,218,220,0.4)',
    backgroundColor: 'rgba(168,218,220,0.07)',
  },
  pressed: { opacity: 0.7 },
  dayName: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
    width: 36,
  },
  dayNameToday: { color: Colors.mist },
  dayDate: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    width: 36,
  },
  densityBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(168,218,220,0.1)',
    overflow: 'hidden',
  },
  densityFill: { height: '100%', backgroundColor: Colors.mist, opacity: 0.7 },
  dayHours: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    width: 44,
    textAlign: 'right',
  },
});
