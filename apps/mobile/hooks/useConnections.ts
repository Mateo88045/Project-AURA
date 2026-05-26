import { useEffect, useState } from 'react';
import type { Connection } from '@aura/shared/types';

interface Result {
  data: Connection[];
  loading: boolean;
  error: Error | null;
}

export function useConnections(userId: string | null): Result {
  // TODO: Supabase — select id, user_id, platform, status, last_synced_at, created_at
  // from connections where user_id = userId.
  // NEVER select oauth_token / refresh_token / canvas_api_token on the client.
  const [data, setData] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setData(MOCK_CONNECTIONS);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [userId]);

  return { data, loading, error: null };
}

const MOCK_CONNECTIONS: Connection[] = [
  {
    id: 'c1',
    userId: 'mock-user',
    platform: 'google_classroom',
    oauthToken: '',
    refreshToken: '',
    status: 'active',
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    createdAt: '2025-09-15T00:00:00Z',
  },
];
