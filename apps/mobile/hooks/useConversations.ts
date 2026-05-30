import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { Conversation } from '@chronos/shared/types';

interface ConversationsResult {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useConversations(userId: string): ConversationsResult {
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(20);

        if (!isMounted) return;

        if (queryError) {
          setError(queryError.message);
          setLoading(false);
          return;
        }

        const mapped: Conversation[] = (data ?? []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          messages: row.messages ?? [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        setConversations(mapped);
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

  return { conversations, loading, error, refetch };
}
