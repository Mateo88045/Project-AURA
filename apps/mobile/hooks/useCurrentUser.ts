import { useEffect, useState } from 'react';
import type { User } from '@aura/shared/types';

interface Result {
  data: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCurrentUser(): Result {
  // TODO: Supabase — select * from users where id = auth.uid() limit 1.
  // Should subscribe to realtime changes on the row so display name / settings
  // updates show up everywhere immediately.
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setData(MOCK_USER);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  return { data, loading, error: null, refetch: () => {} };
}

const MOCK_USER: User = {
  id: 'mock-user',
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
