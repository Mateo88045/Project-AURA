import { useEffect, useState, useCallback } from 'react';
import type { User } from '@chronos/shared/types';
import { getSupabaseOrNull } from '../lib/supabase';
import { useAuth } from './useAuth';

interface Result {
  data: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCurrentUser(): Result {
  const supabase = getSupabaseOrNull();
  const { userId, loading: authLoading } = useAuth();
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setData(MOCK_USER);
      setLoading(false);
      return;
    }
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data: row, error: err } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (err) {
      setError(new Error(err.message));
      setLoading(false);
      return;
    }
    setData(row ? rowToUser(row) : null);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase
      .channel(`users:${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, load]);

  return { data, loading: loading || authLoading, error, refetch: load };
}

function rowToUser(row: {
  id: string;
  email: string;
  display_name: string | null;
  grade_level: number | null;
  onboarding_answers: unknown;
  daily_trigger_time: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}): User {
  const answers = (row.onboarding_answers ?? {}) as Partial<User['onboardingAnswers']>;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? '',
    gradeLevel: row.grade_level ?? 0,
    onboardingAnswers: {
      subjects: answers.subjects ?? [],
      extracurriculars: answers.extracurriculars ?? [],
      averageHomeworkHours: answers.averageHomeworkHours ?? 0,
      preferredStudyTime: answers.preferredStudyTime ?? 'evening',
    },
    dailyTriggerTime: row.daily_trigger_time.slice(0, 5),
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const MOCK_USER: User = {
  id: 'demo-user',
  email: 'alex@example.com',
  displayName: 'Alex',
  gradeLevel: 11,
  onboardingAnswers: {
    subjects: [
      { subject: 'Math', confidence: 3 },
      { subject: 'English', confidence: 4 },
      { subject: 'History', confidence: 4 },
      { subject: 'Chemistry', confidence: 2 },
    ],
    extracurriculars: ['Soccer', 'Debate'],
    averageHomeworkHours: 3,
    preferredStudyTime: 'evening',
  },
  dailyTriggerTime: '15:30',
  timezone: 'America/Los_Angeles',
  createdAt: '2025-09-01T00:00:00Z',
  updatedAt: '2026-05-25T00:00:00Z',
};
