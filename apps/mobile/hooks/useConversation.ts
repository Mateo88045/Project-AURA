import { useState, useCallback, useEffect } from 'react';
import type { ConversationMessage } from '@chronos/shared/types';
import type { Json } from '@chronos/shared/supabase';
import { getSupabaseOrNull } from '../lib/supabase';
import { triggerCopilotAction } from '../services/jobs';

interface Result {
  messages: ConversationMessage[];
  sending: boolean;
  error: Error | null;
  send: (text: string) => Promise<void>;
}

const DEFAULT_GREETING: ConversationMessage = {
  role: 'assistant',
  content:
    "Hey — I'm your copilot. Ask me to move things around, free up an evening, or add a task.",
  timestamp: new Date().toISOString(),
};

export function useConversation(userId: string | null): Result {
  const supabase = getSupabaseOrNull();
  const [messages, setMessages] = useState<ConversationMessage[]>([DEFAULT_GREETING]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabase || !userId) return;
      const { data, error: err } = await supabase
        .from('conversations')
        .select('messages')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (err) setError(new Error(err.message));
      const stored = (data?.messages as ConversationMessage[] | undefined) ?? [];
      if (stored.length > 0) setMessages(stored);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || !userId) return;
      const userMsg: ConversationMessage = {
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };
      const next = [...messages, userMsg];
      setMessages(next);
      setSending(true);
      setError(null);
      try {
        const action = await triggerCopilotAction(userId, text);
        const reply: ConversationMessage = {
          role: 'assistant',
          content: action.confirmationMessage,
          timestamp: new Date().toISOString(),
        };
        const after = [...next, reply];
        setMessages(after);
        if (supabase) {
          // Upsert into a single conversation row per user, newest-first wins.
          await supabase
            .from('conversations')
            .upsert(
              {
                user_id: userId,
                messages: after as unknown as Json,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' },
            );
        }
      } catch (e) {
        setError(e as Error);
      } finally {
        setSending(false);
      }
    },
    [userId, messages, supabase],
  );

  return { messages, sending, error, send };
}
