import { Hono } from 'hono';
import { tasks } from '@trigger.dev/sdk/v3';
import type { AuraVariables } from '../middleware/auth.js';
import { assertTriggerConfigured, env } from '../env.js';

export const jobsRouter = new Hono<{ Variables: AuraVariables }>();

jobsRouter.post('/daily-sync', async (c) => {
  try {
    assertTriggerConfigured();
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : 'Trigger not configured' },
      503,
    );
  }

  const userId = c.get('userId');
  const handle = await tasks.trigger('daily-assignment-trigger', { userId });
  return c.json({
    ok: true as const,
    runId: handle.id,
    userId,
  });
});

jobsRouter.post('/shadow-replan', async (c) => {
  try {
    assertTriggerConfigured();
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : 'Trigger not configured' },
      503,
    );
  }

  const body = (await c.req.json().catch(() => null)) as {
    day?: string;
  } | null;
  const day =
    typeof body?.day === 'string' && body.day.length > 0
      ? body.day
      : new Date().toISOString().slice(0, 10);

  const userId = c.get('userId');
  const handle = await tasks.trigger('shadow-replan', { userId, day });
  return c.json({ ok: true as const, runId: handle.id, userId, day });
});

jobsRouter.post('/sunday-briefing', async (c) => {
  try {
    assertTriggerConfigured();
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : 'Trigger not configured' },
      503,
    );
  }

  const userId = c.get('userId');
  const handle = await tasks.trigger('sunday-briefing', { userId });
  return c.json({ ok: true as const, runId: handle.id, userId });
});
