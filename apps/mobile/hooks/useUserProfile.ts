import { useEffect, useState } from 'react';
import { User } from '@aura/shared/types';

interface UserProfileResult {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useUserProfile(userId: string): UserProfileResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // TODO: Supabase — query users where id = userId

        const mockUser: User = {
          id: userId,
          email: 'student@example.com',
          displayName: 'Alex Rivera',
          gradeLevel: 11,
          onboardingAnswers: {
            subjects: [],
            extracurriculars: ['Soccer'],
            averageHomeworkHours: 2,
            preferredStudyTime: 'evening',
          },
          dailyTriggerTime: '19:30',
          timezone: 'America/New_York',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!isMounted) return;
        setUser(mockUser);
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
  }, [userId]);

  return { user, loading, error };
}

