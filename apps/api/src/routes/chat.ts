import { Hono } from 'hono';
import type { AuraVariables } from '../middleware/auth.js';
import { runClaudeCopilot, type ChatMessage } from '../lib/claudeCopilot.js';
import { runGeminiRouter } from '../lib/geminiRouter.js';
import { env } from '../env.js';

export const chatRouter = new Hono<{ Variables: AuraVariables }>();

chatRouter.post('/', async (c) => {
  if (!env.anthropicApiKey && !env.openRouterApiKey) {
    return c.json(
      {
        error:
          'Chat is not configured (set ANTHROPIC_API_KEY or OPENROUTER_API_KEY)',
      },
      503,
    );
  }

  const body = (await c.req.json().catch(() => null)) as {
    messages?: unknown;
  } | null;

  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return c.json({ error: 'Expected { messages: ChatMessage[] }' }, 400);
  }

  const messages: ChatMessage[] = [];
  for (const m of body.messages) {
    if (
      m &&
      typeof m === 'object' &&
      (m as { role?: string }).role &&
      typeof (m as { content?: unknown }).content === 'string'
    ) {
      const role = (m as { role: string }).role;
      if (role !== 'user' && role !== 'assistant') {
        return c.json({ error: 'Invalid message role' }, 400);
      }
      messages.push({
        role,
        content: (m as { content: string }).content,
      });
    } else {
      return c.json({ error: 'Invalid messages shape' }, 400);
    }
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    return c.json({ error: 'At least one user message is required' }, 400);
  }

  let routerMeta: Awaited<ReturnType<typeof runGeminiRouter>> = null;
  try {
    routerMeta = await runGeminiRouter(lastUser.content);
  } catch (e) {
    routerMeta = null;
    // eslint-disable-next-line no-console
    console.warn('[chat] Gemini router failed', e);
  }

  const routerContext =
    routerMeta != null
      ? JSON.stringify({
          intent: routerMeta.intent,
          hints: routerMeta.hints,
          routerPromptVersion: routerMeta.routerPromptVersion,
        })
      : undefined;

  try {
    const out = await runClaudeCopilot({ messages, routerContext });
    return c.json({
      message: out.message,
      action: out.action,
      copilotPromptVersion: out.copilotPromptVersion,
      router: routerMeta,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[chat] Claude error', e);
    return c.json(
      { error: e instanceof Error ? e.message : 'Copilot error' },
      502,
    );
  }
});
