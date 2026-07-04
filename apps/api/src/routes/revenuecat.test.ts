import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.REVENUECAT_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const { createRevenueCatRouter, resolveSubscriptionStatus } = await import('./revenuecat.js');

function buildTestApp(writes: Array<{ userId: string; status: 'active' | 'frozen' }>) {
  return createRevenueCatRouter(async (userId, status) => {
    writes.push({ userId, status });
    return { error: null };
  });
}

test('resolveSubscriptionStatus maps lapse events to frozen and reactivation events to active', () => {
  assert.equal(resolveSubscriptionStatus('EXPIRATION'), 'frozen');
  assert.equal(resolveSubscriptionStatus('BILLING_ISSUE'), 'frozen');
  assert.equal(resolveSubscriptionStatus('INITIAL_PURCHASE'), 'active');
  assert.equal(resolveSubscriptionStatus('RENEWAL'), 'active');
  assert.equal(resolveSubscriptionStatus('UNCANCELLATION'), 'active');
  // CANCELLATION only disables auto-renew — access continues until EXPIRATION.
  assert.equal(resolveSubscriptionStatus('CANCELLATION'), null);
  assert.equal(resolveSubscriptionStatus('SUBSCRIPTION_PAUSED'), null);
});

test('rejects a webhook call without the shared secret', async () => {
  const writes: Array<{ userId: string; status: 'active' | 'frozen' }> = [];
  const app = buildTestApp(writes);
  const res = await app.request('/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event: { type: 'EXPIRATION', app_user_id: 'abc' } }),
  });
  assert.equal(res.status, 401);
  assert.equal(writes.length, 0);
});

test('rejects a webhook call with the wrong secret', async () => {
  const writes: Array<{ userId: string; status: 'active' | 'frozen' }> = [];
  const app = buildTestApp(writes);
  const res = await app.request('/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer wrong-secret',
    },
    body: JSON.stringify({ event: { type: 'EXPIRATION', app_user_id: 'abc' } }),
  });
  assert.equal(res.status, 401);
  assert.equal(writes.length, 0);
});

test('an EXPIRATION event freezes the correct user', async () => {
  const writes: Array<{ userId: string; status: 'active' | 'frozen' }> = [];
  const app = buildTestApp(writes);
  const res = await app.request('/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer test-webhook-secret',
    },
    body: JSON.stringify({
      event: { type: 'EXPIRATION', app_user_id: 'student-123' },
    }),
  });
  assert.equal(res.status, 200);
  assert.deepEqual(writes, [{ userId: 'student-123', status: 'frozen' }]);
});

test('a RENEWAL event reactivates the correct user', async () => {
  const writes: Array<{ userId: string; status: 'active' | 'frozen' }> = [];
  const app = buildTestApp(writes);
  const res = await app.request('/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer test-webhook-secret',
    },
    body: JSON.stringify({
      event: { type: 'RENEWAL', app_user_id: 'student-123' },
    }),
  });
  assert.equal(res.status, 200);
  assert.deepEqual(writes, [{ userId: 'student-123', status: 'active' }]);
});

test('a CANCELLATION event is a no-op (access continues until EXPIRATION)', async () => {
  const writes: Array<{ userId: string; status: 'active' | 'frozen' }> = [];
  const app = buildTestApp(writes);
  const res = await app.request('/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer test-webhook-secret',
    },
    body: JSON.stringify({
      event: { type: 'CANCELLATION', app_user_id: 'student-123' },
    }),
  });
  assert.equal(res.status, 200);
  const json = (await res.json()) as { skipped?: boolean };
  assert.equal(json.skipped, true);
  assert.equal(writes.length, 0);
});

test('rejects a malformed event body', async () => {
  const writes: Array<{ userId: string; status: 'active' | 'frozen' }> = [];
  const app = buildTestApp(writes);
  const res = await app.request('/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer test-webhook-secret',
    },
    body: JSON.stringify({ event: { type: 'EXPIRATION' } }),
  });
  assert.equal(res.status, 400);
  assert.equal(writes.length, 0);
});
