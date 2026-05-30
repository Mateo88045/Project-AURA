import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { Connection } from '@chronos/shared/types';

interface ConnectionsResult {
  connections: Connection[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useConnections(userId: string): ConnectionsResult {
  const [connections, setConnections] = useState<Connection[]>([]);
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
          .from('connections')
          .select('*')
          .eq('user_id', userId);

        if (!isMounted) return;

        if (queryError) {
          setError(queryError.message);
          setLoading(false);
          return;
        }

        const mapped: Connection[] = (data ?? []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          platform: row.platform,
          oauthToken: row.oauth_token ?? '',
          refreshToken: row.refresh_token ?? '',
          canvasApiToken: row.canvas_api_token ?? undefined,
          status: row.status,
          lastSyncedAt: row.last_synced_at ?? '',
          createdAt: row.created_at,
        }));

        setConnections(mapped);
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

  return { connections, loading, error, refetch };
}
