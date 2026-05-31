/**
 * Soft per-user daily message cap for the copilot — a cost guardrail so a single
 * heavy chatter can't run up the Claude Sonnet bill.
 *
 * This is an in-memory counter: simple, zero-dependency, and resets on restart
 * or per instance. That's fine as a soft cap for a single API instance at MVP
 * scale. For a durable, multi-instance cap, back this with Supabase (e.g. a
 * `check_ai_rate_limit` RPC) or Redis — the call site stays the same.
 */

type Bucket = { day: string; count: number };

const buckets = new Map<string, Bucket>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number; // remaining messages today (Infinity when uncapped)
  cap: number; // 0 = uncapped
}

/**
 * Records one copilot message for `userId` and reports whether it's within the
 * cap. `cap <= 0` means unlimited (the increment is skipped).
 */
export function consumeDailyMessage(userId: string, cap: number): RateLimitResult {
  if (!cap || cap <= 0) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, cap: 0 };
  }

  const day = today();
  const existing = buckets.get(userId);
  const bucket =
    existing && existing.day === day ? existing : { day, count: 0 };

  if (bucket.count >= cap) {
    buckets.set(userId, bucket);
    return { allowed: false, remaining: 0, cap };
  }

  bucket.count += 1;
  buckets.set(userId, bucket);
  return { allowed: true, remaining: Math.max(0, cap - bucket.count), cap };
}
