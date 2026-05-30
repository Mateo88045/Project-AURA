import { useCallback, useState } from 'react';
import type { Difficulty, OnboardingAnswers, SubjectStrength } from '@chronos/shared/types';
import { getSupabaseOrNull } from '../lib/supabase';
import { IS_DEMO_MODE } from '../lib/env';
import { sanitizeDisplayName } from '../lib/validation';
import {
  saveNoWorkAfterGuardrail,
  saveOnboardingProfile,
  triggerOnboardingComplete,
} from '../services/onboarding';

export const SUBJECTS = [
  'Math', 'English', 'Biology', 'Chemistry', 'Physics',
  'History', 'Spanish', 'French', 'AP Calc', 'AP English',
  'AP Bio', 'AP Chem', 'Economics', 'Computer Science', 'Art', 'Music',
];

export const EXTRACURRICULARS = [
  'Sports', 'Music', 'Theater', 'Art', 'Debate',
  'Student Gov', 'Tutoring', 'Job', 'Volunteering', 'Gaming', 'Nothing much',
];

export const BEDTIME_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '8 PM', value: '20:00' },
  { label: '9 PM', value: '21:00' },
  { label: '10 PM', value: '22:00' },
  { label: '11 PM', value: '23:00' },
  { label: 'Midnight', value: '00:00' },
];

export const HOMEWORK_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '< 1 hr', value: 0.5 },
  { label: '1–2 hrs', value: 1.5 },
  { label: '2–3 hrs', value: 2.5 },
  { label: '3–4 hrs', value: 3.5 },
  { label: '4+ hrs', value: 4.5 },
];

export const TOTAL_STEPS = 7;

interface OnboardingFormState {
  displayName: string;
  gradeLevel: number | null;
  subjects: SubjectStrength[];
  extracurriculars: string[];
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | null;
  averageHomeworkHours: number | null;
  noWorkAfterTime: string | null;
  currentStep: number;
  submitting: boolean;
  submitError: string | null;
}

const INITIAL: OnboardingFormState = {
  displayName: '',
  gradeLevel: null,
  subjects: [],
  extracurriculars: [],
  preferredStudyTime: null,
  averageHomeworkHours: null,
  noWorkAfterTime: null,
  currentStep: 0,
  submitting: false,
  submitError: null,
};

function canAdvanceForStep(step: number, state: OnboardingFormState): boolean {
  switch (step) {
    case 0: return state.displayName.trim().length >= 2;
    case 1: return state.gradeLevel !== null;
    case 2: return state.subjects.length >= 1;
    case 3: return true;
    case 4: return state.preferredStudyTime !== null && state.averageHomeworkHours !== null;
    case 5: return state.noWorkAfterTime !== null;
    case 6: return true;
    default: return false;
  }
}

export function useOnboardingForm() {
  const [state, setState] = useState<OnboardingFormState>(INITIAL);

  const setDisplayName = useCallback((v: string) => {
    setState((s) => ({ ...s, displayName: v }));
  }, []);

  const setGradeLevel = useCallback((v: number) => {
    setState((s) => ({ ...s, gradeLevel: v }));
  }, []);

  const toggleSubject = useCallback((subject: string) => {
    setState((s) => {
      const exists = s.subjects.find((sub) => sub.subject === subject);
      if (exists) {
        return { ...s, subjects: s.subjects.filter((sub) => sub.subject !== subject) };
      }
      return { ...s, subjects: [...s.subjects, { subject, confidence: 3 as Difficulty }] };
    });
  }, []);

  const setSubjectConfidence = useCallback((subject: string, level: Difficulty) => {
    setState((s) => ({
      ...s,
      subjects: s.subjects.map((sub) =>
        sub.subject === subject ? { ...sub, confidence: level } : sub,
      ),
    }));
  }, []);

  const toggleExtracurricular = useCallback((item: string) => {
    setState((s) => {
      const exists = s.extracurriculars.includes(item);
      return {
        ...s,
        extracurriculars: exists
          ? s.extracurriculars.filter((e) => e !== item)
          : [...s.extracurriculars, item],
      };
    });
  }, []);

  const setPreferredStudyTime = useCallback(
    (v: 'morning' | 'afternoon' | 'evening') => {
      setState((s) => ({ ...s, preferredStudyTime: v }));
    },
    [],
  );

  const setAverageHomeworkHours = useCallback((v: number) => {
    setState((s) => ({ ...s, averageHomeworkHours: v }));
  }, []);

  const setNoWorkAfterTime = useCallback((v: string) => {
    setState((s) => ({ ...s, noWorkAfterTime: v }));
  }, []);

  const advance = useCallback(() => {
    setState((s) => {
      if (!canAdvanceForStep(s.currentStep, s)) return s;
      if (s.currentStep >= TOTAL_STEPS - 1) return s;
      return { ...s, currentStep: s.currentStep + 1 };
    });
  }, []);

  const retreat = useCallback(() => {
    setState((s) => {
      if (s.currentStep <= 0) return s;
      return { ...s, currentStep: s.currentStep - 1 };
    });
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    setState((s) => ({ ...s, submitting: true, submitError: null }));
    try {
      const answers: OnboardingAnswers = {
        subjects: state.subjects,
        extracurriculars: state.extracurriculars,
        averageHomeworkHours: state.averageHomeworkHours ?? 1.5,
        preferredStudyTime: state.preferredStudyTime ?? 'afternoon',
      };

      const supabase = getSupabaseOrNull();

      if (!supabase) {
        // Demo mode: stubs log but don't persist — still navigate forward
        if (!IS_DEMO_MODE) throw new Error('Supabase is not configured.');
        await saveOnboardingProfile({ userId: 'demo-user', displayName: state.displayName.trim(), gradeLevel: state.gradeLevel ?? 11, answers });
        setState((s) => ({ ...s, submitting: false }));
        return true;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error('No active session — please sign in first.');

      const { error } = await supabase
        .from('users')
        .update({
          display_name: sanitizeDisplayName(state.displayName.trim()),
          grade_level: state.gradeLevel ?? 11,
          onboarding_answers: JSON.parse(JSON.stringify(answers)),
          onboarding_step: 100,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        .eq('id', userId);
      if (error) throw new Error(error.message);

      if (state.noWorkAfterTime) {
        await saveNoWorkAfterGuardrail(userId, state.noWorkAfterTime);
      }
      await triggerOnboardingComplete(userId);
      setState((s) => ({ ...s, submitting: false }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setState((s) => ({ ...s, submitting: false, submitError: message }));
      return false;
    }
  }, [state]);

  const canAdvance = canAdvanceForStep(state.currentStep, state);

  return {
    currentStep: state.currentStep,
    totalSteps: TOTAL_STEPS,
    canAdvance,
    displayName: state.displayName,
    gradeLevel: state.gradeLevel,
    subjects: state.subjects,
    extracurriculars: state.extracurriculars,
    preferredStudyTime: state.preferredStudyTime,
    averageHomeworkHours: state.averageHomeworkHours,
    noWorkAfterTime: state.noWorkAfterTime,
    submitting: state.submitting,
    submitError: state.submitError,
    setDisplayName,
    setGradeLevel,
    toggleSubject,
    setSubjectConfidence,
    toggleExtracurricular,
    setPreferredStudyTime,
    setAverageHomeworkHours,
    setNoWorkAfterTime,
    advance,
    retreat,
    submit,
  };
}
