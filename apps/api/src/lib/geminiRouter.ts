import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ROUTER_PROMPT_VERSION,
  ROUTER_SYSTEM_PROMPT,
} from '@chronos/shared/prompts/router';
import { env } from '../env.js';
import {
  assertAllowedOpenRouterModel,
  openRouterChatCompletion,
  type OpenRouterJsonSchemaResponseFormat,
} from './openRouterClient.js';

export type RouterResult = {
  intent: 'question' | 'schedule_change' | 'other';
  hints: string;
  routerPromptVersion: string;
};

export async function runGeminiRouter(
  userMessage: string,
): Promise<RouterResult | null> {
  if (!env.enableGeminiRouter) {
    return null;
  }

  if (!env.googleAiKey && !env.openRouterApiKey) {
    return null;
  }

  if (env.openRouterApiKey) {
    assertAllowedOpenRouterModel(
      env.openRouterGeminiRouterModel,
      'gemini_router',
    );

    const responseFormat: OpenRouterJsonSchemaResponseFormat = {
      type: 'json_schema',
      json_schema: {
        name: 'aura_router_result',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            intent: {
              type: 'string',
              enum: ['question', 'schedule_change', 'other'],
            },
            hints: { type: 'string' },
          },
          required: ['intent', 'hints'],
          additionalProperties: false,
        },
      },
    };

    const text = await openRouterChatCompletion({
      model: env.openRouterGeminiRouterModel,
      temperature: 0,
      maxTokens: 256,
      responseFormat,
      messages: [
        { role: 'system', content: ROUTER_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });

    const trimmed = text.trim();
    try {
      const parsed = JSON.parse(trimmed) as {
        intent?: string;
        hints?: string;
      };
      const intent =
        parsed.intent === 'schedule_change' ||
        parsed.intent === 'question' ||
        parsed.intent === 'other'
          ? parsed.intent
          : 'other';
      return {
        intent,
        hints: typeof parsed.hints === 'string' ? parsed.hints : '',
        routerPromptVersion: ROUTER_PROMPT_VERSION,
      };
    } catch {
      return {
        intent: 'other',
        hints: trimmed.slice(0, 500),
        routerPromptVersion: ROUTER_PROMPT_VERSION,
      };
    }
  }

  const genAI = new GoogleGenerativeAI(env.googleAiKey);
  const model = genAI.getGenerativeModel({
    model: env.geminiRouterModel,
    systemInstruction: ROUTER_SYSTEM_PROMPT,
  });

  const res = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
  });
  const text = res.response.text().trim();
  try {
    const parsed = JSON.parse(text) as {
      intent?: string;
      hints?: string;
    };
    const intent =
      parsed.intent === 'schedule_change' ||
      parsed.intent === 'question' ||
      parsed.intent === 'other'
        ? parsed.intent
        : 'other';
    return {
      intent,
      hints: typeof parsed.hints === 'string' ? parsed.hints : '',
      routerPromptVersion: ROUTER_PROMPT_VERSION,
    };
  } catch {
    return {
      intent: 'other',
      hints: text.slice(0, 500),
      routerPromptVersion: ROUTER_PROMPT_VERSION,
    };
  }
}
