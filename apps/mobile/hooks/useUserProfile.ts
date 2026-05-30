import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { User } from '@chronos/shared/types';

interface UserProfileResult {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserProfile(userId: string): UserProfileResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (!isMounted) return;

        if (queryError) {
          setError(queryError.message);
          setLoading(false);
          return;
        }

        const mapped: User = {
          id: data.id,
          email: data.email,
          displayName: data.display_name ?? '',
          gradeLevel: data.grade_level ?? 11,
          onboardingAnswers: data.onboarding_answers ?? {
            subjects: [],
            extracurriculars: [],
            averageHomeworkHours: 0,
            preferredStudyTime: 'evening',
          },
          dailyTriggerTime: data.daily_trigger_time ?? '20:00',
          timezone: data.timezone,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setUser(mapped);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [userId, trigger]);

  return { user, loading, error, refetch };
}
