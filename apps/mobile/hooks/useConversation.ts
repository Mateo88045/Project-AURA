import { useState, useCallback } from 'react';
import type { ConversationMessage } from '@aura/shared/types';
import { triggerCopilotAction } from '../services/jobs';

interface Result {
  messages: ConversationMessage[];
  sending: boolean;
  error: Error | null;
  send: (text: string) => Promise<void>;
}

export function useConversation(userId: string | null): Result {
  // TODO: Supabase — select messages from conversations where user_id = userId
  // order by updated_at desc limit 1. On send, append to messages jsonb[] and
  // update updated_at. Realtime subscribe so the UI streams new assistant messages.
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      role: 'assistant',
      content:
        'Hey — I\'m your copilot. Ask me to move things around, free up an evening, or add a task.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || !userId) return;
      const userMsg: ConversationMessage = {
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);
      setSending(true);
      setError(null);
      try {
        const action = await triggerCopilotAction(userId, text);
        const reply: ConversationMessage = {
          role: 'assistant',
          content: action.confirmationMessage,
          timestamp: new Date().toISOString(),
        };
        setMessages((m) => [...m, reply]);
      } catch (e) {
        setError(e as Error);
      } finally {
        setSending(false);
      }
    },
    [userId],
  );

  return { messages, sending, error, send };
}
