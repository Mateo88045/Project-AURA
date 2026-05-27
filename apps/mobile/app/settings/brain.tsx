import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function BrainViewer() {
  const { data: user, loading } = useCurrentUser();

  if (loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Aura's brain" eyebrow="Settings" />
        <View style={{ gap: 12 }}>
          <AuraSkeleton height={120} />
          <AuraSkeleton height={120} />
        </View>
      </ScreenContainer>
    );
  }

  if (!user || !user.onboardingAnswers) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Aura's brain" eyebrow="Settings" />
        <EmptyState
          title="Nothing here yet."
          body="Complete the onboarding questionnaire and Aura's brain will fill in here."
        />
      </ScreenContainer>
    );
  }

  const a = user.onboardingAnswers;

  return (
    <ScreenContainer>
      <ScreenHeader title="Aura's brain" eyebrow="Settings" />
      <Text style={styles.intro}>
        What Aura knows about you — and uses to schedule your week.
      </Text>

      <Section title="Subject confidence">
        <View style={{ gap: 8, marginTop: 8 }}>
          {a.subjects.map((s) => (
            <View key={s.subject} style={styles.row}>
              <Text style={styles.label}>{s.subject}</Text>
              <View style={styles.bars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.bar,
                      { backgroundColor: i <= s.confidence ? Colors.mist : 'rgba(168,218,220,0.15)' },
                    ]}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </Section>

      {a.extracurriculars.length > 0 ? (
        <Section title="Extracurriculars">
          <View style={styles.chipRow}>
            {a.extracurriculars.map((e) => (
              <View key={e} style={styles.chip}>
                <Text style={styles.chipText}>{e}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="Rhythm">
        <Fact label="Best work time" value={a.preferredStudyTime} />
        <Fact label="Average homework / day" value={`${a.averageHomeworkHours}h`} />
        <Fact label="Daily trigger" value={user.dailyTriggerTime} />
        <Fact label="Timezone" value={user.timezone} />
      </Section>
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={styles.section}>{title.toUpperCase()}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.factValue}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  section: {
    color: Colors.mist,
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionBody: {
    backgroundColor: 'rgba(168,218,220,0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,218,220,0.1)',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  bars: { flexDirection: 'row', gap: 4 },
  bar: { width: 18, height: 4, borderRadius: 2 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(168,218,220,0.1)',
  },
  chipText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(168,218,220,0.08)',
  },
  factValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
});
