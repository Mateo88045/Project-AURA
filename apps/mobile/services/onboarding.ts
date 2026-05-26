import type { OnboardingAnswers } from '@aura/shared/types';

export async function saveOnboardingProfile(payload: {
  userId: string;
  displayName: string;
  gradeLevel: number;
  answers: OnboardingAnswers;
}): Promise<void> {
  // TODO: Supabase — UPDATE users SET
  //   display_name = payload.displayName,
  //   grade_level = payload.gradeLevel,
  //   onboarding_answers = payload.answers
  // WHERE id = payload.userId
  console.log('[STUB] saveOnboardingProfile:', payload);
}

export async function saveNoWorkAfterGuardrail(
  userId: string,
  time: string, // HH:MM
): Promise<void> {
  // TODO: Supabase — INSERT INTO guardrails (user_id, rule_type, value, active)
  // VALUES (userId, 'no_work_after', { time }, true)
  // ON CONFLICT (user_id, rule_type) DO UPDATE SET value = excluded.value
  console.log('[STUB] saveNoWorkAfterGuardrail:', userId, time);
}

export async function triggerOnboardingComplete(userId: string): Promise<void> {
  // TODO: Trigger.dev — fire job 'onboarding-complete' with payload { userId }
  // Job steps: initialize default guardrails, trigger first assignment sync
  console.log('[STUB] triggerOnboardingComplete:', userId);
}
