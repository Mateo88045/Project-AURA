import { View, Text, StyleSheet, Switch } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useGuardrails } from '../../hooks/useGuardrails';
import { useToast } from '../../components/ui/AuraToast';
import type { Guardrail } from '@aura/shared/types';

function describe(g: Guardrail): { title: string; body: string } {
  switch (g.ruleType) {
    case 'no_work_after':
      return {
        title: 'No work after',
        body: `Aura won't schedule blocks past ${(g.value as { time: string }).time}.`,
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
  const { data, loading } = useGuardrails(user?.id ?? null);

  const toggle = (id: string, next: boolean) => {
    // TODO: Supabase — update guardrails set active = $next where id = $id.
    console.log('[STUB] toggle guardrail', id, next);
    toast.show(next ? 'Guardrail on.' : 'Guardrail off.', 'info');
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Guardrails" eyebrow="Settings" />
      <Text style={styles.intro}>
        Rules Aura will never break when scheduling your week.
      </Text>
      {loading ? (
        <View style={{ gap: 12, marginTop: 24 }}>
          <AuraSkeleton height={70} />
          <AuraSkeleton height={70} />
          <AuraSkeleton height={70} />
        </View>
      ) : (
        <View style={{ gap: 10, marginTop: 24 }}>
          {data.map((g) => {
            const d = describe(g);
            return (
              <View key={g.id} style={styles.card}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.title}>{d.title}</Text>
                  <Text style={styles.body}>{d.body}</Text>
                </View>
                <Switch
                  value={g.active}
                  onValueChange={(v) => toggle(g.id, v)}
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
