import { useMemo } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import {
  USER_STAGES,
  type UserStage,
} from '@chronos/shared/constants/userStage';
import { useTheme } from '../../lib/theme';
import { haptic } from '../../lib/haptics';

interface StagePickerProps {
  /** The selected stage id (e.g. 'grade_11', 'freshman', 'professional'). */
  value: string | null;
  onChange: (stageId: string) => void;
}

interface Section {
  title: string;
  stages: UserStage[];
}

const SECTIONS: Section[] = [
  { title: 'High school', stages: USER_STAGES.filter((s) => s.group === 'school') },
  { title: 'College',     stages: USER_STAGES.filter((s) => s.group === 'college') },
  { title: 'Other',       stages: USER_STAGES.filter((s) => s.group === 'work') },
];

export function StagePicker({ value, onChange }: StagePickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
          <View style={styles.chipGrid}>
            {section.stages.map((stage) => {
              const selected = stage.id === value;
              return (
                <Pressable
                  key={stage.id}
                  onPress={() => {
                    haptic.selection();
                    onChange(stage.id);
                  }}
                  style={[styles.chip, selected && styles.chipSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={stage.label}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && { color: colors.accent.blue },
                    ]}
                  >
                    {stage.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.md,
    },
    section: {
      gap: spacing.xs,
    },
    sectionLabel: {
      ...typography.micro,
      color: c.text.tertiary,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.glass.light,
    },
    chipSelected: {
      borderColor: c.accent.blue,
      backgroundColor: c.glass.accent,
    },
    chipText: {
      ...typography.callout,
      color: c.text.primary,
    },
  });
}
