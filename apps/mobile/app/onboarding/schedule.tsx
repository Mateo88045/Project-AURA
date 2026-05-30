import { useMemo, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { supabase } from '@chronos/shared/supabase';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme, type ResolvedMode } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraButton } from '../../components/ui/AuraButton';
import { AuraSheet } from '../../components/ui/AuraSheet';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';

const STAGGER_MS = 40;
const STEPS_TOTAL = 5;
const CURRENT_STEP = 3;

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface LocalEvent {
  id: string;
  title: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  daysOfWeek: number[];
}

const TEMPLATES = [
  { label: 'Class period', title: 'Class', startTime: '08:00', endTime: '08:50', daysOfWeek: [1, 2, 3, 4, 5] },
  { label: 'Sports', title: 'Practice', startTime: '15:30', endTime: '17:30', daysOfWeek: [1, 3, 5] },
  { label: 'Club', title: 'Club meeting', startTime: '15:00', endTime: '16:00', daysOfWeek: [2, 4] },
  { label: 'Meal', title: 'Dinner', startTime: '18:30', endTime: '19:15', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
];

function backdropColors(mode: ResolvedMode): [string, string, string] {
  return mode === 'light'
    ? ['#F8FAFC', '#F1F5F9', '#F8FAFC']
    : ['#07090F', '#0D1117', '#07090F'];
}

function formatTime12(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
}

function daysLabel(daysOfWeek: number[]): string {
  const sorted = [...daysOfWeek].sort();
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (sorted.length === 7) return 'Every day';
  if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) return 'Weekdays';
  return sorted.map((d) => names[d]).join(', ');
}

// ── Day selector ────────────────────────────────────────────────────────

interface DaySelectorProps {
  selected: number[];
  onToggle: (day: number) => void;
  colors: ThemeColors;
}

function DaySelector({ selected, onToggle, colors }: DaySelectorProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
      {DAY_LABELS.map((label, i) => {
        const isActive = selected.includes(i);
        return (
          <Pressable
            key={i}
            onPress={() => {
              haptic.selection();
              onToggle(i);
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isActive ? colors.accent.blue : colors.glass.light,
              borderWidth: 1,
              borderColor: isActive ? colors.accent.blue : colors.border.subtle,
            }}
          >
            <Text
              style={{
                ...typography.callout,
                color: isActive ? colors.text.inverse : colors.text.secondary,
                fontWeight: isActive ? '600' : '400',
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────

export default function OnboardingScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sheet form state
  const [formTitle, setFormTitle] = useState('');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('08:50');
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5]);

  function openNewEvent() {
    setEditingId(null);
    setFormTitle('');
    setFormStartTime('08:00');
    setFormEndTime('08:50');
    setFormDays([1, 2, 3, 4, 5]);
    setSheetOpen(true);
  }

  function openEditEvent(event: LocalEvent) {
    setEditingId(event.id);
    setFormTitle(event.title);
    setFormStartTime(event.startTime);
    setFormEndTime(event.endTime);
    setFormDays([...event.daysOfWeek]);
    setSheetOpen(true);
  }

  function applyTemplate(template: typeof TEMPLATES[number]) {
    setFormTitle(template.title);
    setFormStartTime(template.startTime);
    setFormEndTime(template.endTime);
    setFormDays([...template.daysOfWeek]);
    haptic.selection();
  }

  function toggleDay(day: number) {
    setFormDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function saveEvent() {
    if (!formTitle.trim() || formDays.length === 0) return;
    haptic.success();

    if (editingId) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? { ...e, title: formTitle.trim(), startTime: formStartTime, endTime: formEndTime, daysOfWeek: formDays }
            : e,
        ),
      );
    } else {
      setEvents((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          title: formTitle.trim(),
          startTime: formStartTime,
          endTime: formEndTime,
          daysOfWeek: formDays,
        },
      ]);
    }

    setSheetOpen(false);
  }

  function deleteEvent(eventId: string) {
    haptic.secondary();
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  async function handleContinue() {
    setSubmitting(true);

    if (userId && events.length > 0) {
      const rows = events.map((e) => ({
        user_id: userId,
        title: e.title,
        start_time: e.startTime,
        end_time: e.endTime,
        days_of_week: e.daysOfWeek,
      }));

      await supabase.from('fixed_events').insert(rows);
    }

    if (userId) {
      await supabase
        .from('users')
        .update({ onboarding_step: 3 })
        .eq('id', userId);
    }

    setSubmitting(false);
    router.push('/onboarding/preferences');
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={backdropColors(resolvedMode)}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <AmbientOrbs />

      <KeyboardAvoidingView
        style={styles.kbWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          {/* Progress dots */}
          <Animated.View entering={FadeIn.duration(280)} style={styles.progressRow}>
            {Array.from({ length: STEPS_TOTAL }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === CURRENT_STEP && styles.dotActive]}
              />
            ))}
          </Animated.View>

          {/* Content */}
          <ScrollView
            style={styles.scrollWrap}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeIn.delay(STAGGER_MS).duration(320)}>
              <GlassCard intensity="light" style={styles.card}>
                <View style={styles.cardInner}>
                  <Animated.View entering={FadeInDown.delay(STAGGER_MS * 2).duration(320)}>
                    <Text style={styles.label}>STEP 3 OF 4 · SCHEDULE</Text>
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(STAGGER_MS * 3).duration(320)}>
                    <Text style={styles.title}>What fills your week?</Text>
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(STAGGER_MS * 4).duration(320)}>
                    <Text style={styles.body}>
                      Classes, sports, clubs — anything Chronos should schedule around.
                    </Text>
                  </Animated.View>

                  {/* Event list */}
                  {events.map((event) => (
                    <Animated.View
                      key={event.id}
                      entering={FadeInUp.duration(280).springify().damping(14)}
                      style={styles.eventRow}
                    >
                      <Pressable
                        style={styles.eventContent}
                        onPress={() => openEditEvent(event)}
                      >
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventMeta}>
                          {daysLabel(event.daysOfWeek)} · {formatTime12(event.startTime)}–{formatTime12(event.endTime)}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => deleteEvent(event.id)}
                        hitSlop={8}
                        style={styles.deleteBtn}
                      >
                        <AuraSymbol name="xmark" size={14} color={colors.text.tertiary} />
                      </Pressable>
                    </Animated.View>
                  ))}

                  {/* Add event button */}
                  <Animated.View entering={FadeInDown.delay(STAGGER_MS * 5).duration(320)}>
                    <Pressable
                      onPress={openNewEvent}
                      style={styles.addBtn}
                    >
                      <AuraSymbol name="plus" size={16} color={colors.accent.blue} />
                      <Text style={[styles.addBtnText, { color: colors.accent.blue }]}>
                        Add event
                      </Text>
                    </Pressable>
                  </Animated.View>
                </View>
              </GlassCard>
            </Animated.View>
          </ScrollView>

          {/* CTA */}
          <Animated.View
            entering={FadeIn.delay(STAGGER_MS * 6).duration(320)}
            style={styles.ctaWrap}
          >
            <View style={styles.ctaButton}>
              <AuraButton
                label="Continue"
                size="lg"
                fullWidth
                onPress={() => { void handleContinue(); }}
                loading={submitting}
              />
            </View>
            <Text style={styles.disclaimer}>
              You can always edit these later in Settings.
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Add/Edit Event Sheet ──────────────────────────────────────── */}
      <AuraSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>
            {editingId ? 'Edit event' : 'Add event'}
          </Text>

          {/* Quick templates */}
          {!editingId && (
            <View style={styles.templateRow}>
              {TEMPLATES.map((t) => (
                <Pressable
                  key={t.label}
                  onPress={() => applyTemplate(t)}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateText}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Event name */}
          <Text style={styles.sheetLabel}>EVENT NAME</Text>
          <TextInput
            value={formTitle}
            onChangeText={setFormTitle}
            placeholder="e.g. AP Chemistry"
            placeholderTextColor={colors.text.tertiary}
            style={styles.sheetInput}
          />

          {/* Days */}
          <Text style={[styles.sheetLabel, { marginTop: spacing.lg }]}>DAYS</Text>
          <DaySelector selected={formDays} onToggle={toggleDay} colors={colors} />

          {/* Times */}
          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              <Text style={styles.sheetLabel}>START</Text>
              <TextInput
                value={formStartTime}
                onChangeText={setFormStartTime}
                placeholder="08:00"
                placeholderTextColor={colors.text.tertiary}
                style={styles.sheetInput}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.timeCol}>
              <Text style={styles.sheetLabel}>END</Text>
              <TextInput
                value={formEndTime}
                onChangeText={setFormEndTime}
                placeholder="08:50"
                placeholderTextColor={colors.text.tertiary}
                style={styles.sheetInput}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <AuraButton
              label={editingId ? 'Save changes' : 'Save event'}
              size="lg"
              fullWidth
              onPress={saveEvent}
              disabled={!formTitle.trim() || formDays.length === 0}
            />
          </View>
        </View>
      </AuraSheet>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    kbWrap: { flex: 1 },
    container: {
      flex: 1,
      paddingHorizontal: spacing.screenPadding,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingTop: spacing.sm,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border.subtle,
    },
    dotActive: {
      width: 8,
      backgroundColor: c.accent.blue,
    },
    scrollWrap: {
      flex: 1,
      width: '100%',
    },
    scrollContent: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    card: {
      borderRadius: radius.xl,
      maxWidth: 340,
      width: '100%',
    },
    cardInner: {
      padding: spacing.xl,
    },
    label: {
      ...typography.caption,
      color: c.text.tertiary,
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.title2,
      color: c.text.primary,
      marginBottom: spacing.sm,
    },
    body: {
      ...typography.body,
      color: c.text.secondary,
      marginBottom: spacing.lg,
    },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
      marginBottom: spacing.sm,
    },
    eventContent: {
      flex: 1,
    },
    eventTitle: {
      ...typography.headline,
      color: c.text.primary,
    },
    eventMeta: {
      ...typography.callout,
      color: c.text.secondary,
      marginTop: 2,
    },
    deleteBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.accent.blue,
    },
    addBtnText: {
      ...typography.headline,
    },
    ctaWrap: {
      width: '100%',
      alignItems: 'center',
    },
    ctaButton: {
      width: '100%',
      maxWidth: 340,
    },
    disclaimer: {
      ...typography.callout,
      marginTop: spacing.md,
      color: c.text.tertiary,
      textAlign: 'center',
    },
    // Sheet styles
    sheetContent: {
      gap: spacing.sm,
    },
    sheetTitle: {
      ...typography.title2,
      color: c.text.primary,
      marginBottom: spacing.md,
    },
    sheetLabel: {
      ...typography.micro,
      color: c.text.tertiary,
      marginBottom: spacing.xs,
    },
    sheetInput: {
      ...typography.body,
      color: c.text.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    templateRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    templateChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: c.glass.accent,
      borderWidth: 1,
      borderColor: c.border.accent,
    },
    templateText: {
      ...typography.callout,
      color: c.accent.blue,
    },
    timeRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    timeCol: {
      flex: 1,
    },
  });
}
