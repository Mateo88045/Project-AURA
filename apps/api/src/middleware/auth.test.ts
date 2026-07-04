import { test } from 'node:test';
import assert from 'node:assert/strict';

// Set env before importing the module under test — env.ts reads process.env
// at module-evaluation time.
process.env.AURA_API_KEY = 'test-shared-key';
process.env.DEV_USER_ID = 'user-1';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_ANON_KEY = '';

const { Hono } = await import('hono');
const { createAuthMiddleware, GUEST_USER_ID } = await import('./auth.js');
type ApiVariables = { userId: string };

function buildTestApp(verifyToken: Parameters<typeof createAuthMiddleware>[0]) {
  const app = new Hono<{ Variables: ApiVariables }>();
  app.use('/*', createAuthMiddleware(verifyToken));
  app.get('/whoami', (c) => c.json({ userId: c.get('userId') }));
  return app;
}

test('rejects requests with no Authorization header', async () => {
  const app = buildTestApp(async () => null);
  const res = await app.request('/whoami');
  assert.equal(res.status, 401);
});

test('rejects a valid shared key paired with a forged real-user-id header (the original vulnerability)', async () => {
  const app = buildTestApp(async () => null);
  const res = await app.request('/whoami', {
    headers: {
      authorization: 'Bearer test-shared-key',
      'x-dev-user-id': 'some-other-real-students-uuid',
    },
  });
  assert.equal(
    res.status,
    401,
    'the shared dev key must never authenticate as an arbitrary client-supplied user id',
  );
});

test('shared key still works for the guest-mode synthetic id', async () => {
  const app = buildTestApp(async () => null);
  const res = await app.request('/whoami', {
    headers: {
      authorization: 'Bearer test-shared-key',
      'x-dev-user-id': GUEST_USER_ID,
    },
  });
  assert.equal(res.status, 200);
  const body = (await res.json()) as { userId: string };
  assert.equal(body.userId, GUEST_USER_ID);
});

test('shared key with no X-Dev-User-Id header falls back to DEV_USER_ID', async () => {
  const app = buildTestApp(async () => null);
  const res = await app.request('/whoami', {
    headers: { authorization: 'Bearer test-shared-key' },
  });
  assert.equal(res.status, 200);
  const body = (await res.json()) as { userId: string };
  assert.equal(body.userId, 'user-1');
});

test('rejects an invalid/unverifiable bearer token', async () => {
  const app = buildTestApp(async () => null);
  const res = await app.request('/whoami', {
    headers: { authorization: 'Bearer garbage-token' },
  });
  assert.equal(res.status, 401);
});

test('accepts a verified Supabase JWT and derives userId from the verified token, not any header', async () => {
  const app = buildTestApp(async (token) => {
    if (token === 'valid-jwt') return { userId: 'real-student-abc' };
    return null;
  });
  const res = await app.request('/whoami', {
    headers: {
      authorization: 'Bearer valid-jwt',
      // Even if a caller also sends a header trying to claim a different
      // identity, the verified token's userId must win.
      'x-dev-user-id': 'someone-else',
    },
  });
  assert.equal(res.status, 200);
  const body = (await res.json()) as { userId: string };
  assert.equal(body.userId, 'real-student-abc');
});

test('rejects a Supabase JWT that fails verification', async () => {
  const app = buildTestApp(async () => null);
  const res = await app.request('/whoami', {
    headers: { authorization: 'Bearer expired-or-forged-jwt' },
  });
  assert.equal(res.status, 401);
});
