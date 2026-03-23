import { env } from '../env.js';

export type OpenRouterChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OpenRouterJsonSchemaResponseFormat = {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: true;
    schema: {
      type: 'object';
      properties: Record<
        string,
        {
          type: 'string';
          enum?: readonly string[];
        }
      >;
      required: readonly string[];
      additionalProperties: false;
    };
  };
};

type OpenRouterModelKind = 'gemini_router' | 'claude_copilot';

const ALLOWED_OPENROUTER_MODELS: Record<OpenRouterModelKind, readonly string[]> =
  {
    gemini_router: ['google/gemini-2.0-flash-001'],
    claude_copilot: ['anthropic/claude-sonnet-4'],
  };

export function assertAllowedOpenRouterModel(
  model: string,
  kind: OpenRouterModelKind,
): void {
  const allowed = ALLOWED_OPENROUTER_MODELS[kind];
  if (!allowed.some((m) => m === model)) {
    throw new Error(
      `[OpenRouter] Model not allowed for ${kind}. Got "${model}". Allowed: ${allowed.join(
        ', ',
      )}`,
    );
  }
}

export async function openRouterChatCompletion(params: {
  model: string;
  messages: OpenRouterChatMessage[];
  temperature: number;
  maxTokens: number;
  responseFormat?: OpenRouterJsonSchemaResponseFormat;
}): Promise<string> {
  if (!env.openRouterApiKey) {
    throw new Error('[OpenRouter] OPENROUTER_API_KEY is not configured');
  }

  const res = await fetch(`${env.openRouterBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openRouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      ...(params.responseFormat ? { response_format: params.responseFormat } : {}),
    }),
  });

  if (!res.ok) {
    const body = (await res.text().catch(() => '')) as string;
    throw new Error(
      `[OpenRouter] Request failed: HTTP ${res.status}. ${body.slice(0, 500)}`,
    );
  }

  const json = (await res.json().catch(() => null)) as
    | {
        choices?: Array<{
          message?: { content?: string };
        }>;
      }
    | null;

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('[OpenRouter] Invalid response shape (missing content)');
  }

  return content;
}

