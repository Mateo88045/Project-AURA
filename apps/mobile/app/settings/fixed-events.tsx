import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { Plus, Trash2, X } from 'lucide-react-native';
import type { FixedEvent } from '@chronos/shared/types';
import { Colors } from '@chronos/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ChronosSkeleton } from '../../components/ui/ChronosSkeleton';
import { ChronosButton } from '../../components/ui/ChronosButton';
import { ChronosSheet } from '../../components/ui/ChronosSheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/ChronosToast';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useFixedEvents } from '../../hooks/useFixedEvents';
import {
  createFixedEvent,
  deleteFixedEvent,
  updateFixedEvent,
  validateFixedEvent,
  type FixedEventInput,
} from '../../services/fixedEvents';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function FixedEventsEditor() {
  const toast = useToast();
  const { data: user } = useCurrentUser();
  const { data, loading, error, refetch } = useFixedEvents(user?.id ?? null);
  const [editing, setEditing] = useState<FixedEvent | 'new' | null>(null);

  return (
    <ScreenContainer>
      <ScreenHeader title="Fixed events" eyebrow="Settings" />
      <Text style={styles.intro}>
        The unmovable things in your week — classes, sports, meals, sleep.
        Chronos schedules around these.
      </Text>

      {loading ? (
        <View style={{ gap: 12, marginTop: 24 }}>
          <ChronosSkeleton height={70} />
          <ChronosSkeleton height={70} />
          <ChronosSkeleton height={70} />
        </View>
      ) : error ? (
        <View style={{ marginTop: 24 }}>
          <ErrorState message="Couldn't load your events." onRetry={refetch} />
        </View>
      ) : data.length === 0 ? (
        <View style={{ marginTop: 24 }}>
          <EmptyState
            title="No fixed events yet."
            body="Add the classes and routines that anchor your day so Chronos knows what to work around."
            action={
              <ChronosButton
                label="Add an event"
                variant="primary"
                onPress={() => setEditing('new')}
              />
            }
          />
        </View>
      ) : (
        <View style={{ gap: 10, marginTop: 24 }}>
          {data.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => setEditing(e)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${e.title}`}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardTitle}>{e.title}</Text>
                <Text style={styles.cardMeta}>
                  {formatClock12(e.startTime)} – {formatClock12(e.endTime)} ·{' '}
                  {summarizeDays(e.daysOfWeek)}
                </Text>
              </View>
            </Pressable>
          ))}
          <View style={{ marginTop: 12 }}>
            <ChronosButton
              label="Add an event"
              variant="secondary"
              fullWidth
              leadingIcon={<Plus color={Colors.mist} size={16} strokeWidth={1.8} />}
              onPress={() => setEditing('new')}
            />
          </View>
        </View>
      )}

      <FixedEventSheet
        target={editing}
        onClose={() => setEditing(null)}
        onSaved={async (msg) => {
          setEditing(null);
          toast.show(msg, 'success');
          refetch();
        }}
        onError={(msg) => toast.show(msg, 'error')}
        userId={user?.id ?? null}
      />
    </ScreenContainer>
  );
}

interface SheetProps {
  target: FixedEvent | 'new' | null;
  userId: string | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

function FixedEventSheet({ target, userId, onClose, onSaved, onError }: SheetProps) {
  const isNew = target === 'new';
  const event = target && target !== 'new' ? target : null;

  const initial: FixedEventInput = useMemo(
    () => ({
      title: event?.title ?? '',
      startTime: event?.startTime ?? '15:30',
      endTime: event?.endTime ?? '16:30',
      daysOfWeek: event?.daysOfWeek ?? [1, 2, 3, 4, 5],
    }),
    // Only re-derive defaults when the targeted event identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event?.id, isNew],
  );

  const [input, setInput] = useState<FixedEventInput>(initial);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when target changes
  useMemo(() => {
    setInput(initial);
  }, [initial]);

  const save = async () => {
    if (!userId) return;
    const err = validateFixedEvent(input);
    if (err) {
      onError(err);
      return;
    }
    setSubmitting(true);
    try {
      if (event) {
        await updateFixedEvent(event.id, input);
        onSaved('Updated.');
      } else {
        await createFixedEvent(userId, input);
        onSaved('Added.');
      }
    } catch (e) {
      onError((e as Error).message || "Couldn't save that.");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = () => {
    if (!event) return;
    Alert.alert(
      `Remove ${event.title}?`,
      "Chronos won't schedule around this anymore.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await deleteFixedEvent(event.id);
              onSaved('Removed.');
            } catch (e) {
              onError((e as Error).message || "Couldn't remove that.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const toggleDay = (i: number) => {
    setInput((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(i)
        ? prev.daysOfWeek.filter((d) => d !== i)
        : [...prev.daysOfWeek, i].sort((a, b) => a - b),
    }));
  };

  return (
    <ChronosSheet
      open={target !== null}
      onClose={onClose}
      title={event ? 'Edit event' : 'New event'}
    >
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={input.title}
            onChangeText={(t) => setInput((p) => ({ ...p, title: t }))}
            placeholder="Period 1 — English"
            placeholderTextColor="rgba(142,175,194,0.5)"
            autoCapitalize="sentences"
            maxLength={48}
          />
        </View>

        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Starts</Text>
            <TextInput
              style={styles.input}
              value={input.startTime}
              onChangeText={(t) => setInput((p) => ({ ...p, startTime: t }))}
              placeholder="08:15"
              placeholderTextColor="rgba(142,175,194,0.5)"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              autoCorrect={false}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Ends</Text>
            <TextInput
              style={styles.input}
              value={input.endTime}
              onChangeText={(t) => setInput((p) => ({ ...p, endTime: t }))}
              placeholder="09:10"
              placeholderTextColor="rgba(142,175,194,0.5)"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              autoCorrect={false}
            />
          </View>
        </View>

        <View>
          <Text style={styles.label}>Days</Text>
          <View style={styles.dayRow}>
            {DAY_LABELS.map((d, i) => {
              const selected = input.daysOfWeek.includes(i);
              return (
                <Pressable
                  key={d}
                  onPress={() => toggleDay(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`${d}${selected ? ', selected' : ''}`}
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.dayChip,
                    selected && styles.dayChipActive,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.dayChipText, selected && styles.dayChipTextActive]}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ marginTop: 8, gap: 10 }}>
          <ChronosButton
            label={event ? 'Save changes' : 'Add event'}
            onPress={save}
            loading={submitting}
            variant="primary"
            size="lg"
            fullWidth
          />
          {event ? (
            <ChronosButton
              label="Remove"
              onPress={remove}
              variant="ghost"
              leadingIcon={<Trash2 color={Colors.red} size={16} strokeWidth={1.8} />}
              fullWidth
              haptic={false}
            />
          ) : (
            <ChronosButton
              label="Cancel"
              onPress={onClose}
              variant="ghost"
              leadingIcon={<X color={Colors.textSecondary} size={16} strokeWidth={1.8} />}
              fullWidth
              haptic={false}
            />
          )}
        </View>
      </View>
    </ChronosSheet>
  );
}

function formatClock12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}

function summarizeDays(days: number[]): string {
  if (days.length === 7) return 'Every day';
  if (
    days.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => days.includes(d))
  ) {
    return 'Weekdays';
  }
  if (
    days.length === 2 &&
    days.includes(0) &&
    days.includes(6)
  ) {
    return 'Weekends';
  }
  return days.map((d) => DAY_LABELS[d]).join(' · ');
}

const styles = StyleSheet.create({
  intro: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.12)',
    backgroundColor: 'rgba(168,218,220,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
  cardLeft: { flex: 1, gap: 4 },
  cardTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  cardMeta: { color: Colors.textSecondary, fontSize: 12 },
  label: {
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(168,218,220,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  timeRow: { flexDirection: 'row', gap: 10 },
  dayRow: { flexDirection: 'row', gap: 6 },
  dayChip: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.2)',
    backgroundColor: 'rgba(168,218,220,0.04)',
  },
  dayChipActive: {
    borderColor: Colors.mist,
    backgroundColor: 'rgba(168,218,220,0.18)',
  },
  dayChipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  dayChipTextActive: { color: Colors.textPrimary, fontWeight: '600' },
});
