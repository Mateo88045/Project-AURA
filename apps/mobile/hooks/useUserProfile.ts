import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { User } from '@chronos/shared/types';
import { GUEST_USER_ID, isGuestId } from '../lib/guest';

const GUEST_PROFILE: User = {
  id: GUEST_USER_ID,
  email: '',
  displayName: 'Guest',
  gradeLevel: 11,
  onboardingAnswers: {
    subjects: [],
    extracurriculars: [],
    averageHomeworkHours: 0,
    preferredStudyTime: 'evening',
  },
  dailyTriggerTime: '20:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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

      if (isGuestId(userId)) {
        if (isMounted) {
          setUser(GUEST_PROFILE);
          setLoading(false);
        }
        return;
      }

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
