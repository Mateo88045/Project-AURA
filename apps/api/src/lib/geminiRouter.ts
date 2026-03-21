import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ROUTER_PROMPT_VERSION,
  ROUTER_SYSTEM_PROMPT,
} from '@aura/shared/prompts/router';
import { env } from '../env.js';

export type RouterResult = {
  intent: 'question' | 'schedule_change' | 'other';
  hints: string;
  routerPromptVersion: string;
};

export async function runGeminiRouter(
  userMessage: string,
): Promise<RouterResult | null> {
  if (!env.enableGeminiRouter || !env.googleAiKey) {
    return null;
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
