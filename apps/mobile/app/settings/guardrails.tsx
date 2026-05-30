import { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Colors } from '@chronos/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ChronosSkeleton } from '../../components/ui/ChronosSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useGuardrails } from '../../hooks/useGuardrails';
import { useToast } from '../../components/ui/ChronosToast';
import { getSupabaseOrNull } from '../../lib/supabase';
import type { Guardrail } from '@chronos/shared/types';

function describe(g: Guardrail): { title: string; body: string } {
  switch (g.ruleType) {
    case 'no_work_after':
      return {
        title: 'No work after',
        body: `Chronos won't schedule blocks past ${(g.value as { time: string }).time}.`,
      };
    case 'buffer_after_event':
      return {
        title: 'Breathing room',
        body: `Leave ${(g.value as { minutes: number }).minutes} minutes after fixed events.`,
      };
    case 'max_hours_per_day':
      return {
        title: 'Daily cap',
        body: `Max ${(g.value as { hours: number }).hours} hours of scheduled work per day.`,
      };
  }
}

export default function GuardrailsEditor() {
  const toast = useToast();
  const { data: user } = useCurrentUser();
  const { data, loading, error, refetch } = useGuardrails(user?.id ?? null);
  // Optimistic overrides: id → active state while the DB write is in flight
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const toggle = async (id: string, next: boolean) => {
    setOverrides((o) => ({ ...o, [id]: next }));

    const supabase = getSupabaseOrNull();
    if (!supabase) {
      toast.show(next ? 'Guardrail on.' : 'Guardrail off.', 'info');
      return;
    }

    const { error } = await supabase
      .from('guardrails')
      .update({ active: next })
      .eq('id', id);

    if (error) {
      // Rollback optimistic update
      setOverrides((o) => {
        const n = { ...o };
        delete n[id];
        return n;
      });
      toast.show("Couldn't update that guardrail.", 'error');
      return;
    }

    toast.show(next ? 'Guardrail on.' : 'Guardrail off.', 'info');
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Guardrails" eyebrow="Settings" />
      <Text style={styles.intro}>
        Rules Chronos will never break when scheduling your week.
      </Text>
      {loading ? (
        <View style={{ gap: 12, marginTop: 24 }}>
          <ChronosSkeleton height={70} />
          <ChronosSkeleton height={70} />
          <ChronosSkeleton height={70} />
        </View>
      ) : error ? (
        <ErrorState
          message="Couldn't load your guardrails."
          onRetry={refetch}
        />
      ) : data.length === 0 ? (
        <EmptyState
          title="No guardrails yet."
          body="Chronos will add sensible defaults the first time it schedules your week."
        />
      ) : (
        <View style={{ gap: 10, marginTop: 24 }}>
          {data.map((g) => {
            const d = describe(g);
            const active = overrides[g.id] ?? g.active;
            return (
              <View key={g.id} style={styles.card}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.title}>{d.title}</Text>
                  <Text style={styles.body}>{d.body}</Text>
                </View>
                <Switch
                  value={active}
                  onValueChange={(v) => void toggle(g.id, v)}
                  trackColor={{ false: 'rgba(142,175,194,0.3)', true: Colors.mist }}
                  thumbColor={Colors.textPrimary}
                />
              </View>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.12)',
    backgroundColor: 'rgba(168,218,220,0.04)',
  },
  title: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  body: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
});
