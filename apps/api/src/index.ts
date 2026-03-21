import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './env.js';
import { devAuth, type AuraVariables } from './middleware/auth.js';
import { jobsRouter } from './routes/jobs.js';
import { chatRouter } from './routes/chat.js';

const app = new Hono();

app.use('/*', cors({ origin: '*' }));

app.get('/health', (c) => c.json({ ok: true }));

const v1 = new Hono<{ Variables: AuraVariables }>();
v1.use('/*', devAuth);
v1.route('/jobs', jobsRouter);
v1.route('/chat', chatRouter);

app.route('/v1', v1);

serve({ fetch: app.fetch, port: env.port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`[aura/api] listening on http://localhost:${info.port}`);
});
