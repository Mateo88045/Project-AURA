import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './env.js';
import { apiAuth, type ApiVariables } from './middleware/auth.js';
import { requireActiveEntitlement } from './middleware/requireActiveEntitlement.js';
import { jobsRouter } from './routes/jobs.js';
import { chatRouter } from './routes/chat.js';
import { ocrRouter } from './routes/ocr.js';
import { webhooksRouter } from './routes/webhooks.js';

const app = new Hono();

// TODO SECURITY: Restrict origin to app bundle scheme before production deploy
app.use('/*', cors({ origin: '*' }));

app.get('/health', (c) => c.json({ ok: true }));

// Webhooks are auth'd via their own shared secrets (not the mobile API key),
// so they live OUTSIDE the /v1 JWT-protected group.
app.route('/webhooks', webhooksRouter);

const v1 = new Hono<{ Variables: ApiVariables }>();
v1.use('/*', apiAuth);
// Paid-tier endpoints — guard with entitlement check after auth.
// See docs/entitlement-design.md (Option A "frozen").
v1.use('/jobs/*', requireActiveEntitlement);
v1.use('/chat/*', requireActiveEntitlement);
v1.use('/ocr/*', requireActiveEntitlement);
v1.route('/jobs', jobsRouter);
v1.route('/chat', chatRouter);
v1.route('/ocr', ocrRouter);

app.route('/v1', v1);

serve({ fetch: app.fetch, port: env.port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`[chronos/api] listening on http://localhost:${info.port}`);
});
