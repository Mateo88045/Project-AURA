import type { OnboardingAnswers } from '@chronos/shared/types';
import { getSupabaseOrNull } from '../lib/supabase';
import { IS_DEMO_MODE } from '../lib/env';

/**
 * Demo-mode fallback for saveOnboardingProfile.
 * In real mode, useOnboardingForm.submit() writes directly to Supabase.
 * This function is only invoked when Supabase is not configured (demo/CI).
 */
export async function saveOnboardingProfile(payload: {
  userId: string;
  displayName: string;
  gradeLevel: number;
  answers: OnboardingAnswers;
}): Promise<void> {
  if (__DEV__ || IS_DEMO_MODE) {
    // eslint-disable-next-line no-console
    console.log('[onboarding] saveOnboardingProfile (demo)', payload.userId);
  }
}

/**
 * Upserts the user's bedtime guardrail into the guardrails table.
 * Uses ON CONFLICT (user_id, rule_type) to update an existing row.
 */
export async function saveNoWorkAfterGuardrail(
  userId: string,
  time: string, // HH:MM
): Promise<void> {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    if (__DEV__ || IS_DEMO_MODE) {
      // eslint-disable-next-line no-console
      console.log('[onboarding] saveNoWorkAfterGuardrail (demo)', userId, time);
    }
    return;
  }

  const { error } = await supabase.from('guardrails').upsert(
    {
      user_id: userId,
      rule_type: 'no_work_after',
      value: { time },
      active: true,
    },
    { onConflict: 'user_id,rule_type' },
  );

  if (error) throw new Error(error.message);
}

/**
 * Kicks off the post-onboarding pipeline:
 * triggers the first classroom sync so the user has real data on day one.
 */
export async function triggerOnboardingComplete(userId: string): Promise<void> {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    if (__DEV__ || IS_DEMO_MODE) {
      // eslint-disable-next-line no-console
      console.log('[onboarding] triggerOnboardingComplete (demo)', userId);
    }
    return;
  }

  // Fire the classroom-sync edge function to pull the first batch of assignments.
  // The function initializes default guardrails server-side if none exist yet.
  const { error } = await supabase.functions.invoke('classroom-sync', {
    body: { user_id: userId },
  });

  if (error) throw new Error(error.message);
}
