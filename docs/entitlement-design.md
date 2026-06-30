# Entitlement Enforcement Design — Lapsed Users

**Status:** Decided (2026-06-30). Option A — "frozen."
**Owners:** Backend (Trigger.dev jobs + RevenueCat webhook), Frontend (read-only UI).

---

## The question

When a user's subscription lapses (`EntitlementStatus = 'lapsed'`), what should
happen to their schedule on the **server**? The client already gates UI via
`lib/entitlement.ts`, but until now nothing on the backend has checked
entitlement status. The daily Trigger.dev jobs (`daily-trigger`,
`batch-grader`, `shadow-replan`) would happily keep grading assignments and
re-flowing schedules for non-paying users.

Two options were on the table:

- **Option A — frozen.** The schedule freezes as of the lapse timestamp.
  Trigger.dev jobs early-return for `status='lapsed'` users; no new ingest,
  no AI grading, no scheduling pass. Existing `scheduled_blocks` stay
  visible in read-only mode.
- **Option B — re-flowing.** Scheduler keeps running silently; only the UI
  is read-only. The user sees a "live" schedule they cannot touch.

## Decision: Option A.

## Why

1. **The scheduler IS the paid feature.** Per Blueprint §6.2, Pipeline A
   (fetch → grade → schedule → notify) is the autonomous engine Chronos
   sells. Option B would keep running that engine — including paid Gemini
   grading calls and Trigger.dev minutes — for users who stopped paying.
   That defeats the gate.
2. **One-line enforcement.** A single early-return at the top of each job
   (`if (user.entitlement_status === 'lapsed') return`) is hard to regress.
   Option B requires threading "is this a paid operation?" checks through
   scheduler internals, which will rot.
3. **Cost.** Every Option-B run burns Gemini tokens and Trigger.dev compute
   on a non-paying user. At scale this is meaningful.
4. **UX is defensible.** Lapsed user sees their last schedule with a
   "Resume Chronos" CTA. New Classroom/Canvas assignments accumulate as
   `pending` tasks (ingest is also gated — see below), un-graded and
   un-scheduled, until they resubscribe.
5. **Trivial recovery.** RevenueCat webhook flips status back to `pro` →
   next daily-trigger tick picks the user up automatically and re-flows
   everything. No backfill code needed.

## What "frozen" means concretely

| Subsystem | Behavior when `entitlement_status = 'lapsed'` |
|---|---|
| `daily-trigger` Trigger.dev job | Early return. No fetch, no grade, no schedule. |
| `batch-grader` Trigger.dev job | Early return. No Gemini calls. |
| `shadow-replan` Trigger.dev job | Early return. No re-flow. |
| `sunday-briefing` Trigger.dev job | Early return. No Claude calls. |
| Canvas / Classroom ingest (when added) | Early return at the top of the ingest function. |
| Copilot API (`/v1/chat`) | Already gated client-side; add a server-side guard for completeness. |
| OCR API (`/v1/ocr`) | Same — server-side guard. |
| Existing `scheduled_blocks` | Untouched. Visible client-side as read-only. |
| Existing `tasks` | Untouched. New ingest will not flow in until status flips. |

## What "frozen" does NOT mean

- It does **not** mean we delete data. All blocks, tasks, and conversations
  stay in place so resubscribe is a no-op restore.
- It does **not** mean the user is logged out or loses access to the app.
  They can still open Chronos and see what they had.
- It does **not** block delete-account, settings reads, or push-token
  refresh — only the paid-tier pipelines.

## Source of truth

- The RevenueCat webhook (Step 2) writes the canonical status to
  `public.users.entitlement_status` (new column, see migration
  `20260520_000005_users_entitlement_status.sql`).
- Trigger.dev jobs read that column at the start of each run. **No job
  trusts a client-passed entitlement value.**
- The shared `EntitlementStatus` type in `packages/shared/types/index.ts`
  remains the canonical TypeScript shape.

## Out of scope for this doc

- Grace periods (e.g. 3-day soft lapse before hard freeze). Not in scope
  for MVP; revisit if churn data motivates it.
- Partial-feature tiers (e.g. "lite" plan that gets grading but not
  scheduling). Not in scope; current plan is binary pro / not-pro.

## Cross-references

- `packages/shared/types/index.ts` — `EntitlementStatus`, `Entitlement`.
- `apps/mobile/lib/entitlement.tsx` — client-side gating.
- `apps/mobile/lib/requirePro.ts` — client-side route guards.
- `apps/api/src/routes/` — server-side guards to be added.
- `packages/trigger/src/jobs/` — early-return guards to be added.
