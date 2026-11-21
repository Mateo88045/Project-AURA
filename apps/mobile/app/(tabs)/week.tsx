import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, radius, spacing } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';
import { useWeekLoad } from '../../hooks/useWeekLoad';
import { Screen } from '../../components/ui/Screen';
import { AuraText } from '../../components/ui/AuraText';
import { AuraButton } from '../../components/ui/AuraButton';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { CalmEmptyState } from '../../components/ui/CalmEmptyState';
import { WeekBars } from '../../components/week/WeekBars';
import { DueList } from '../../components/week/DueList';
import { weekOf } from '../../components/schedule/blockTime';
import { haptic } from '../../lib/haptics';
import { toLocalDayIso } from '../../lib/localDate';

function totalLabel(min: number): { big: string; unit: string } {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h === 0 ? { big: `${m}`, unit: 'min' } : { big: `${h}:${String(m).padStart(2, '0')}`, unit: 'h' };
}

export default function WeekScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const [offset, setOffset] = useState(0);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  const todayIso = toLocalDayIso(new Date());
  const days = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset * 7);
    return weekOf(d);
  }, [offset]);
  const { load, loading, error, refetch } = useWeekLoad(user?.id ?? '', days);

  const total = load.reduce((s, d) => s + d.minutes, 0);
  // Heaviest day: ties go to the earliest from today onward.
  const heaviest = useMemo(() => {
    const ahead = load.filter((d) => d.iso >= todayIso);
    const pool = ahead.some((d) => d.minutes > 0) ? ahead : load;
    return pool.reduce<(typeof load)[number] | null>(
      (best, d) => (d.minutes > 0 && (!best || d.minutes > best.minutes) ? d : best),
      null,
    );
  }, [load, todayIso]);
  const heavyName = heaviest?.date.toLocaleDateString(undefined, { weekday: 'long' });
  const due = (selectedIso ? load.filter((d) => d.iso === selectedIso) : load).flatMap((d) =>
    d.tasks.map((task) => ({ task, dayLabel: d.date.toLocaleDateString(undefined, { weekday: 'short' }) })),
  );
  const { big, unit } = totalLabel(total);
  const weekLabel = days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const shiftWeek = (by: number) => { haptic.selection(); setSelectedIso(null); setOffset((o) => o + by); };

  return (
    <Screen orbs={false}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.eyebrow}>Week of {weekLabel}</Text>
        <View style={styles.nav}>
          <Pressable onPress={() => shiftWeek(-1)} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Previous week">
            <AuraSymbol name="chevron.left" size={18} color={colors.text.secondary} />
          </Pressable>
          <Pressable onPress={() => shiftWeek(1)} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Next week">
            <AuraSymbol name="chevron.right" size={18} color={colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.gap}>
            <AuraSkeleton height={64} width={200} />
            <AuraSkeleton height={18} width={240} />
            <AuraSkeleton height={300} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <AuraText variant="body" color="secondary">Couldn&apos;t load this week.</AuraText>
            <AuraButton label="Try again" variant="outline" onPress={refetch} />
          </View>
        ) : total === 0 ? (
          <CalmEmptyState title="A light week" body="Nothing is due this week. Enjoy the room." icon="calendar" />
        ) : (
          <>
            <Text style={styles.total} accessibilityLabel={`${Math.round(total / 6) / 10} hours of homework due`}>
              {big}<Text style={styles.totalUnit}> {unit}</Text>
            </Text>
            <Text style={styles.sentence}>
              of homework due this week.{heavyName ? ` ${heavyName} is the heaviest.` : ''}
            </Text>

            <WeekBars
              load={load}
              heaviestIso={heaviest?.iso ?? null}
              selectedIso={selectedIso}
              todayIso={todayIso}
              onSelect={(iso) => setSelectedIso((cur) => (cur === iso ? null : iso))}
            />

            {heaviest && heavyName && (
              <Pressable
                onPress={() => {
                  haptic.liquidTap();
                  router.push({
                    pathname: '/ai/chat',
                    params: { prompt: `Spread out my ${heavyName} homework across the week so no day is too heavy.` },
                  } as Href);
                }}
                style={({ pressed }) => [styles.spread, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <AuraSymbol name="sparkles" size={16} color={colors.text.onAccent} />
                <Text style={styles.spreadText}>Spread out {heavyName}</Text>
              </Pressable>
            )}

            <Text style={styles.section}>
              {selectedIso ? `Due ${load.find((d) => d.iso === selectedIso)?.date.toLocaleDateString(undefined, { weekday: 'long' })}` : 'Due this week'}
            </Text>
            {due.length > 0 ? <DueList items={due} /> : <Text style={styles.none}>Nothing due that day.</Text>}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing.md },
    eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: c.text.secondary },
    nav: { flexDirection: 'row' },
    navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    gap: { gap: spacing.md, marginTop: spacing.lg },
    center: { marginTop: spacing.xxl, alignItems: 'center', gap: spacing.md },
    total: {
      fontFamily: fontFamily.display,
      fontSize: 64,
      lineHeight: 68,
      letterSpacing: -2.4,
      color: c.text.primary,
      fontVariant: ['tabular-nums'],
      marginTop: spacing.sm,
    },
    totalUnit: { fontSize: 24, letterSpacing: 0, color: c.text.secondary },
    sentence: { fontSize: 16, color: c.text.secondary, marginBottom: spacing.xl },
    spread: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 18,
      borderRadius: radius.full,
      backgroundColor: c.accent.steel,
      marginTop: spacing.lg,
    },
    spreadText: { fontSize: 15, fontWeight: '600', color: c.text.onAccent },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    section: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.text.secondary,
      marginTop: spacing.sectionGap,
      marginBottom: spacing.md,
    },
    none: { fontSize: 15, color: c.text.secondary },
  });
}
