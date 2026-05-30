import { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { radius, spacing, typography } from '@chronos/shared/theme';
import type { ThemeColors } from '@chronos/shared/theme';
import { useTheme } from '../../lib/theme';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { GlassCard } from '../../components/ui/GlassCard';
import { AuraSymbol } from '../../components/ui/AuraSymbol';
import { AuraButton } from '../../components/ui/AuraButton';
import { useUserProfile } from '../../hooks/useUserProfile';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user: authUser } = useAuth();
  const { user, loading: profileLoading } = useUserProfile(authUser?.id ?? '');

  const [name, setName] = useState(user?.displayName ?? '');
  const [gradeLevel, setGradeLevel] = useState(
    user?.gradeLevel?.toString() ?? '',
  );
  const [wakeTime, setWakeTime] = useState(user?.dailyTriggerTime ?? '07:00');
  const [bedTime, setBedTime] = useState('22:30');
  const [saving, setSaving] = useState(false);

  // Sync from profile once it loads
  useState(() => {
    if (user) {
      setName(user.displayName);
      setGradeLevel(user.gradeLevel.toString());
    }
  });

  const numericGrade =
    gradeLevel.trim().length > 0
      ? Number.parseInt(gradeLevel.trim(), 10)
      : null;

  const canSave =
    name.trim().length > 0 &&
    numericGrade !== null &&
    Number.isFinite(numericGrade) &&
    numericGrade >= 8 &&
    numericGrade <= 12;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    haptic.primaryCTA();
    // TODO: Supabase — upsert into users set display_name=name, grade_level=numericGrade,
    // daily_trigger_time=wakeTime where id=authUser?.id
    setTimeout(() => {
      setSaving(false);
      router.back();
    }, 400);
  }

  if (profileLoading) return null;

  return (
    <View style={styles.root}>
      <AmbientOrbs />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 140,
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.headerRow}>
            <Pressable
              hitSlop={12}
              onPress={() => {
                haptic.secondary();
                router.back();
              }}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <AuraSymbol
                name="chevron.left"
                size={22}
                color={colors.text.primary}
              />
            </Pressable>
          </Animated.View>

          {/* Title block */}
          <Animated.View
            entering={FadeInUp.delay(60).duration(500)}
            style={styles.titleBlock}
          >
            <Text style={styles.eyebrow}>PROFILE</Text>
            <Text style={styles.title}>Edit your info</Text>
            <Text style={styles.subtitle}>
              Chronos uses this to personalize your schedule and greetings.
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInUp.delay(120).duration(500)}>
            <GlassCard intensity="light" style={styles.card}>
              <View style={styles.fields}>
                <View>
                  <Text style={styles.inputLabel}>NAME</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Alex Rivera"
                    placeholderTextColor={colors.text.tertiary}
                    style={styles.input}
                  />
                </View>

                <View>
                  <Text style={styles.inputLabel}>GRADE LEVEL</Text>
                  <TextInput
                    value={gradeLevel}
                    onChangeText={setGradeLevel}
                    placeholder="11"
                    keyboardType="number-pad"
                    placeholderTextColor={colors.text.tertiary}
                    style={styles.input}
                  />
                </View>

                <View style={styles.timeRow}>
                  <View style={styles.timeCol}>
                    <Text style={styles.inputLabel}>WAKE</Text>
                    <TextInput
                      value={wakeTime}
                      onChangeText={setWakeTime}
                      placeholder="07:00"
                      placeholderTextColor={colors.text.tertiary}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.timeCol}>
                    <Text style={styles.inputLabel}>BEDTIME</Text>
                    <TextInput
                      value={bedTime}
                      onChangeText={setBedTime}
                      placeholder="22:30"
                      placeholderTextColor={colors.text.tertiary}
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Save button */}
          <Animated.View
            entering={FadeInUp.delay(180).duration(500)}
            style={styles.ctaWrap}
          >
            <AuraButton
              label="Save changes"
              size="lg"
              fullWidth
              onPress={handleSave}
              disabled={!canSave}
              loading={saving}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background.primary,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.screenPadding,
    },

    // Header
    headerRow: {
      flexDirection: 'row',
      marginBottom: spacing.lg,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    } as ViewStyle,

    // Title
    titleBlock: {
      marginBottom: spacing.xl,
    },
    eyebrow: {
      ...typography.caption,
      color: c.accent.blue,
      marginBottom: 6,
    },
    title: {
      ...typography.displayMedium,
      color: c.text.primary,
      marginBottom: 8,
    },
    subtitle: {
      ...typography.body,
      color: c.text.secondary,
      lineHeight: 22,
    },

    // Card
    card: {
      padding: spacing.cardPadding,
    },
    fields: {
      gap: spacing.lg,
    },
    inputLabel: {
      ...typography.micro,
      color: c.text.tertiary,
      marginBottom: spacing.xs,
    },
    input: {
      ...typography.body,
      color: c.text.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.glass.light,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    timeRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    timeCol: {
      flex: 1,
    },

    // CTA
    ctaWrap: {
      marginTop: spacing.xl,
    },
  });
}
