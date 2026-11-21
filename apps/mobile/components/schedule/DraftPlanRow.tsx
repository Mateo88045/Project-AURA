import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import type { BlockStatus } from '@chronos/shared/types';
import { useTheme } from '../../lib/theme';

interface DraftPlanRowProps {
  time: string;
  title: string;
  /** Homework only. Fixed rows render dim and take no actions. */
  meta?: string;
  status?: BlockStatus;
  disabled?: boolean;
  first: boolean;
  onKeep?: () => void;
  onSkip?: () => void;
  onUndo?: () => void;
}

export function DraftPlanRow(p: DraftPlanRowProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const fixed = !p.meta;
  const skipped = p.status === 'rejected';
  const kept = p.status === 'approved';

  return (
    <View style={[s.row, fixed && s.rowFixed, !p.first && s.divider]}>
      <Text style={[s.time, (fixed || skipped) && s.dim]}>{p.time}</Text>
      <View style={s.body}>
        <Text style={[s.title, fixed && s.titleFixed, skipped && s.struck]} numberOfLines={2}>{p.title}</Text>
        {p.meta ? <Text style={[s.meta, skipped && s.struck]}>{p.meta}</Text> : null}
      </View>
      {!fixed && (
        <View style={[s.actions, p.disabled && s.disabled]}>
          {skipped ? (
            <Action label="Undo" color={colors.accent.sky} onPress={p.onUndo} disabled={p.disabled} s={s} />
          ) : (
            <>
              <Action
                label={kept ? 'Kept' : 'Keep'}
                color={kept ? colors.accent.emerald : colors.accent.sky}
                onPress={p.onKeep}
                disabled={p.disabled}
                selected={kept}
                s={s}
              />
              <Action label="Skip" color={colors.accent.coral} onPress={p.onSkip} disabled={p.disabled} s={s} />
            </>
          )}
        </View>
      )}
    </View>
  );
}

function Action({ label, color, onPress, disabled, selected, s }: {
  label: string; color: string; onPress?: () => void; disabled?: boolean; selected?: boolean;
  s: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={s.action}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <Text style={[s.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 12, paddingLeft: 16, paddingRight: 8 },
    rowFixed: { paddingVertical: 11 },
    divider: { borderTopWidth: 1, borderTopColor: c.border.subtle },
    time: { ...typography.nSubhead, lineHeight: 22, width: 44, color: c.text.primary, fontVariant: ['tabular-nums'] },
    dim: { color: c.text.secondary },
    body: { flex: 1 },
    title: { ...typography.nHeadline, color: c.text.primary },
    titleFixed: { fontWeight: '400', color: c.text.secondary },
    meta: { ...typography.nSubhead, color: c.text.secondary, marginTop: 2 },
    struck: { textDecorationLine: 'line-through', color: c.text.tertiary },
    actions: { flexDirection: 'row', alignItems: 'center', marginTop: -11 },
    disabled: { opacity: 0.5 },
    action: { minWidth: 44, height: 44, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
    actionText: { ...typography.nSubhead, fontWeight: '600' },
  });
}
