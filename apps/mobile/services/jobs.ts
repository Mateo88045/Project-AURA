import { getAuraApiBaseUrl, getAuraApiHeaders } from './auraClient';
import { assertSchedulingAllowed } from './subscriptionStatus';

export type JobTriggerResponse = {
  ok: true;
  runId: string;
  userId: string;
  day?: string;
};

async function postJob(
  userId: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<JobTriggerResponse> {
  const base = getAuraApiBaseUrl().replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: await getAuraApiHeaders(userId),
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json().catch(() => null)) as
    | JobTriggerResponse
    | { error?: string }
    | null;

  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && 'error' in json && json.error
        ? String(json.error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (!json || typeof json !== 'object' || !('runId' in json)) {
    throw new Error('Invalid job response');
  }

  return json as JobTriggerResponse;
}

/**
 * POST /v1/jobs/daily-sync — Trigger.dev task `daily-assignment-trigger`.
 * Creates new scheduled work, so it's blocked while the subscription is
 * frozen (throws SubscriptionFrozenError) — existing data stays untouched.
 */
export async function triggerDailySyncJob(userId: string): Promise<JobTriggerResponse> {
  await assertSchedulingAllowed(userId);
  return postJob(userId, '/v1/jobs/daily-sync');
}

/**
 * POST /v1/jobs/shadow-replan — Trigger.dev task `shadow-replan`. Regenerates
 * the schedule, so it's blocked while frozen for the same reason as above.
 */
export async function requestShadowSchedule(
  userId: string,
  day: string,
): Promise<JobTriggerResponse> {
  await assertSchedulingAllowed(userId);
  return postJob(userId, '/v1/jobs/shadow-replan', { day });
}

/**
 * POST /v1/jobs/sunday-briefing — a read-only digest of the existing
 * schedule, not new scheduled work, so it's intentionally NOT gated: a
 * frozen user should still get their weekly summary of what's already there.
 */
export async function requestSundayBriefing(
  userId: string,
): Promise<JobTriggerResponse> {
  return postJob(userId, '/v1/jobs/sunday-briefing');
}
