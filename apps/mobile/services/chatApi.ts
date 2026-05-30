import type { CopilotAction } from '@chronos/shared/types';
import { getAuraApiBaseUrl, getAuraApiHeaders } from './auraClient';

export type ChatMessagePayload = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatApiResponse = {
  message: string;
  action?: CopilotAction;
  copilotPromptVersion: string;
  router?: unknown;
};

export async function sendCopilotMessage(
  userId: string,
  messages: ChatMessagePayload[],
): Promise<ChatApiResponse> {
  const base = getAuraApiBaseUrl().replace(/\/$/, '');
  const res = await fetch(`${base}/v1/chat`, {
    method: 'POST',
    headers: getAuraApiHeaders(userId),
    body: JSON.stringify({ messages }),
  });

  const json = (await res.json().catch(() => null)) as
    | ChatApiResponse
    | { error?: string }
    | null;

  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && 'error' in json && json.error
        ? String(json.error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (
    !json ||
    typeof json !== 'object' ||
    !('message' in json) ||
    typeof (json as { message?: unknown }).message !== 'string'
  ) {
    throw new Error('Invalid chat response');
  }

  return json as ChatApiResponse;
}
