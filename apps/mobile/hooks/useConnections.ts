import { useEffect, useState, useCallback } from 'react';
import type { Connection } from '@chronos/shared/types';
import { getSupabaseOrNull } from '../lib/supabase';

interface Result {
  data: Connection[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useConnections(userId: string | null): Result {
  const supabase = getSupabaseOrNull();
  const [data, setData] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setData(MOCK_CONNECTIONS);
      setLoading(false);
      return;
    }
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    // Important: never select the token columns on the client. They are
    // server-only and the encrypted variants stay in the DB.
    const { data: rows, error: err } = await supabase
      .from('connections')
      .select('id, user_id, platform, status, last_synced_at, created_at')
      .eq('user_id', userId);
    if (err) {
      setError(new Error(err.message));
      setLoading(false);
      return;
    }
    type Row = {
      id: string;
      user_id: string;
      platform: string;
      status: string;
      last_synced_at: string | null;
      created_at: string;
    };
    setData(
      (rows ?? []).map((r: Row) => ({
        id: r.id,
        userId: r.user_id,
        platform: r.platform as Connection['platform'],
        oauthToken: '',
        refreshToken: '',
        status: r.status as Connection['status'],
        lastSyncedAt: r.last_synced_at ?? r.created_at,
        createdAt: r.created_at,
      })),
    );
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refetch: load };
}

const MOCK_CONNECTIONS: Connection[] = [
  {
    id: 'c1',
    userId: 'demo-user',
    platform: 'google_classroom',
    oauthToken: '',
    refreshToken: '',
    status: 'active',
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    createdAt: '2025-09-15T00:00:00Z',
  },
];
