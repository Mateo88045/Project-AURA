import Anthropic from '@anthropic-ai/sdk';
import {
  COPILOT_PROMPT_VERSION,
  COPILOT_SYSTEM_PROMPT,
} from '@chronos/shared/prompts/copilot';
import type { CopilotAction } from '@chronos/shared/types';
import { env } from '../env.js';
import {
  assertAllowedOpenRouterModel,
  openRouterChatCompletion,
} from './openRouterClient.js';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type CopilotResponse = {
  message: string;
  action?: CopilotAction;
  copilotPromptVersion: string;
  rawAssistantText: string;
};

function tryParseCopilotJson(text: string): CopilotResponse | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const obj = JSON.parse(jsonMatch[0]) as {
      action?: CopilotAction;
      message?: string;
    };
    if (typeof obj.message !== 'string') return null;
    return {
      message: obj.message,
      action: obj.action,
      copilotPromptVersion: COPILOT_PROMPT_VERSION,
      rawAssistantText: text,
    };
  } catch {
    return null;
  }
}

export async function runClaudeCopilot(params: {
  messages: ChatMessage[];
  routerContext?: string;
}): Promise<CopilotResponse> {
  if (!env.anthropicApiKey && !env.openRouterApiKey) {
    throw new Error('ANTHROPIC_API_KEY or OPENROUTER_API_KEY is not configured');
  }

  const system = params.routerContext
    ? `${COPILOT_SYSTEM_PROMPT}\n\nRouter context (Gemini): ${params.routerContext}`
    : COPILOT_SYSTEM_PROMPT;

  if (env.openRouterApiKey) {
    assertAllowedOpenRouterModel(
      env.openRouterClaudeCopilotModel,
      'claude_copilot',
    );

    const assistantText = await openRouterChatCompletion({
      model: env.openRouterClaudeCopilotModel,
      temperature: 0.2,
      maxTokens: 1024,
      messages: [
        // Cache the (stable) system prompt so it isn't re-billed every turn.
        {
          role: 'system',
          content: [
            { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
          ],
        },
        ...params.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const parsed = tryParseCopilotJson(assistantText);
    if (parsed) return parsed;

    return {
      message: assistantText,
      copilotPromptVersion: COPILOT_PROMPT_VERSION,
      rawAssistantText: assistantText,
    };
  }

  const client = new Anthropic({ apiKey: env.anthropicApiKey });
  const anthropicMessages = params.messages.map((m) => ({
    role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }));

  const res = await client.messages.create({
    model: env.anthropicModel,
    max_tokens: 1024,
    // Prompt caching: the system prompt is identical across turns, so marking it
    // ephemeral lets Anthropic serve it from cache (~10% of input cost) on every
    // call after the first within the 5-minute window.
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: anthropicMessages,
  });

  const block = res.content.find((b) => b.type === 'text');
  const text =
    block && block.type === 'text'
      ? block.text
      : 'Sorry, I had trouble replying.';

  const parsed = tryParseCopilotJson(text);
  if (parsed) return parsed;

  return {
    message: text,
    copilotPromptVersion: COPILOT_PROMPT_VERSION,
    rawAssistantText: text,
  };
}
