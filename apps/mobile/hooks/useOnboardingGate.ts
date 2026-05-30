import { useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import { GUEST_USER_ID } from '../lib/guest';

/** Onboarding progress values — each screen increments by 1. */
export type OnboardingStep = 0 | 1 | 2 | 3 | 4;

/** Maps a step value to the route the user should resume at.
 *  Step = highest completed step, so the route is the NEXT screen. */
const STEP_ROUTES: Record<OnboardingStep, string> = {
  0: '/onboarding',            // Nothing done → welcome
  1: '/onboarding/profile',    // Connect done → profile next
  2: '/onboarding/schedule',   // Profile done → schedule next
  3: '/onboarding/preferences',// Schedule done → preferences next
  4: '/(tabs)',                 // All done → main app
};

interface OnboardingGateResult {
  step: OnboardingStep;
  loading: boolean;
  isComplete: boolean;
  /** The route the user should be redirected to based on their step. */
  targetRoute: string;
  /** Call after saving screen data to advance to the next step. */
  advance: () => Promise<void>;
}

export function useOnboardingGate(userId: string | null): OnboardingGateResult {
  const [step, setStep] = useState<OnboardingStep>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Guest users skip onboarding entirely — they're exploring with no account
    // (Guideline 5.1.1), so there's no Supabase row to read. Treat as complete.
    if (userId === GUEST_USER_ID) {
      setStep(4);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function load() {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_step')
        .eq('id', userId)
        .single();

      if (!isMounted) return;

      if (error || !data) {
        // User row may not exist yet (just signed up, trigger hasn't fired).
        // Default to step 0.
        setStep(0);
      } else {
        setStep(Math.min(data.onboarding_step, 4) as OnboardingStep);
      }
      setLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  async function advance() {
    if (!userId || step >= 4) return;
    const nextStep = (step + 1) as OnboardingStep;

    await supabase
      .from('users')
      .update({ onboarding_step: nextStep })
      .eq('id', userId);

    setStep(nextStep);
  }

  return {
    step,
    loading,
    isComplete: step >= 4,
    targetRoute: STEP_ROUTES[step],
    advance,
  };
}
