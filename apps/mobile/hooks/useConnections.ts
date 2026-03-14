import { useEffect, useState } from 'react';
import { Connection } from '@aura/shared/types';

interface ConnectionsResult {
  connections: Connection[];
  loading: boolean;
  error: string | null;
}

export function useConnections(userId: string): ConnectionsResult {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // TODO: Supabase — query connections where user_id = userId

        const mockConnections: Connection[] = [
          {
            id: 'conn-1',
            userId,
            platform: 'google_classroom',
            oauthToken: 'stub',
            refreshToken: 'stub',
            status: 'active',
            lastSyncedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ];

        if (!isMounted) return;
        setConnections(mockConnections);
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

  return { connections, loading, error };
}

