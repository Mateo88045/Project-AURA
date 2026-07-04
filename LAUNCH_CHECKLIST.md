# Chronos — Launch Checklist (App Store)

This is the handoff for everything that must happen **outside the codebase** to ship
Chronos to App Store review. The app itself is wired and typechecks clean; the
items below require accounts, secrets, money, or Apple/cloud dashboards that can't
be done from code.

Legend: 🔴 blocker for submission · 🟡 strongly recommended · 🟢 nice-to-have

---

## 1. Apple Developer & App Store Connect 🔴

- [ ] Enroll in the **Apple Developer Program** ($99/yr) → https://developer.apple.com/programs/
- [ ] Sign the **Paid Apps Agreement** in App Store Connect → Business (required for subscriptions; the app **cannot** sell IAPs until this is active).
- [ ] Add your bank account + tax forms (Agreements, Tax, and Banking) — see §6.
- [ ] Create the app record in App Store Connect with bundle id **`com.chronos.app`**.
- [ ] Fill App Privacy ("nutrition label"): you collect email, name, grade, school
      platform data, and usage. Declare data types and link them to **Account** /
      **App Functionality**. Be honest — minors' data raises scrutiny (see §7).

## 2. In-App Purchases + RevenueCat 🔴

The paywall is built and compliant (trial disclosure, Terms/Privacy, Restore).
It runs in **PREVIEW mode** (no real charge) until RevenueCat is wired —
see `apps/mobile/services/purchases.ts`.

- [ ] In **App Store Connect → Subscriptions**, create an auto-renewable subscription
      group "Chronos Pro" with these products (IDs must match `purchases.ts`):
  | Product ID | Price | Notes |
  |---|---|---|
  | `chronos_early_monthly` | $8.00/mo | early-access launch price |
  | `chronos_early_annual`  | $79.00/yr | early-access launch price (~18% under monthly, drives annual) |
  | `chronos_standard_monthly` | $12.00/mo | for after early access ends |
  | `chronos_standard_annual`  | $100.00/yr | for after early access ends |
  - Add a **7-day free trial** introductory offer to the early products (the paywall advertises it).
  - "Early access" is modeled as the *current* live price with the standard price shown struck-through. When early access ends, switch the displayed products to the standard SKUs (one-line change in `purchases.ts`).
- [ ] Create a **RevenueCat** account → add the iOS app → create an **Offering** containing the two early packages → entitlement id **`pro`**.
- [ ] Put the RevenueCat **public iOS SDK key** in `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.
- [ ] `pnpm --filter @chronos/mobile add react-native-purchases`, then un-comment the
      `REVENUECAT:` blocks in `purchases.ts` (every step is stubbed and labelled).
- [ ] Rebuild the dev client / EAS build (native module — Expo Go can't run it).
- [ ] Test a sandbox purchase + **Restore** before submitting.

**Lapse enforcement ("frozen" mode) — code is in, three things still need a human:**
- What ships in this pass: `supabase/migrations/20260703_000000_subscription_status.sql`
  (adds `users.subscription_status`, locked to service-role writes only),
  `apps/api/src/routes/revenuecat.ts` (webhook → maps RevenueCat event types to
  `active`/`frozen`, tested in `revenuecat.test.ts`), and mobile enforcement
  (`services/subscriptionStatus.ts`, `hooks/useSubscriptionStatus.ts`) that blocks
  `triggerDailySyncJob` / `requestShadowSchedule` with a clear error when frozen —
  existing tasks/schedule stay fully visible, nothing is deleted.
- [ ] Apply the new migration (`supabase db push` or the SQL editor) — the app
      code already assumes the column exists.
- [ ] In the RevenueCat dashboard → **Integrations → Webhooks**, point a webhook at
      `https://<your-api>/webhooks/revenuecat` with a shared **Authorization header
      value** — set that same value as `REVENUECAT_WEBHOOK_SECRET` on `apps/api`.
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` on `apps/api` (Supabase → Project Settings →
      API → `service_role` secret — **not** the anon/publishable key, never ship it
      to the mobile app).
- [ ] After applying the migration, regenerate
      `packages/shared/supabase/database.types.ts` via
      `supabase gen types typescript --project-id bvwumzzuvubiacueftbz` (it was
      hand-edited ahead of the real schema so the code typechecks now).
- Still stubbed / not enforced: the native RevenueCat SDK itself (blocked on the
  EAS dev-client build, see §5 below) — so today there's no real purchase flow to
  ever *trigger* an EXPIRATION/BILLING_ISSUE event. The webhook and enforcement
  are ready and unit-tested, but can't be exercised end-to-end until the SDK is
  live. You can hand-test the enforcement path today by flipping a test user's
  `subscription_status` to `'frozen'` directly in Supabase and confirming Sync
  Now / shadow-replan refuse with the lapsed message.

## 3. Deploy the AI backend (`apps/api`) 🔴 (for AI features)

The copilot chat, photo OCR, and job triggers call this server. Without it those
features return a graceful error instead of working — which Apple may flag.

- [ ] Deploy `apps/api` to Render / Fly.io / Railway (Node 18+, `pnpm --filter @chronos/api start`).
- [ ] Set its env from `apps/api/.env.example`:
  - `GOOGLE_GENERATIVE_AI_API_KEY` (required for OCR + Gemini router)
  - `OPENROUTER_API_KEY` **or** `ANTHROPIC_API_KEY` (copilot chat)
  - `AURA_API_KEY` (any strong random string)
- [ ] Set the same `AURA_API_KEY` as `EXPO_PUBLIC_AURA_API_KEY`, and the deployed
      URL as `EXPO_PUBLIC_AURA_API_URL` (or `extra.auraApiUrl` in `app.json`).
- [ ] Hit `https://<your-api>/health` → should return `{ "ok": true }`.

## 4. Supabase 🔴

- [ ] Apply the migrations in `supabase/migrations/` to the project (`bvwumzzuvubiacueftbz`).
- [ ] Confirm the `users` table has an **`onboarding_step`** column (the gate now uses 0–6).
- [ ] Verify Row Level Security policies exist for `tasks`, `scheduled_blocks`,
      `guardrails`, `conversations`, `users` (the app reads/writes these as the signed-in user).
- [ ] Deploy edge functions in `supabase/functions/` and set their secrets (Gemini key, etc.) if you use the nightly pipeline.
- [ ] Sign in with Apple is enabled (`usesAppleSignIn: true`) → enable the Apple provider in Supabase Auth and add the Service ID / key.

## 5. Build & submit 🔴

- [ ] Set a real **EAS `projectId`** in `app.json` (`extra.eas.projectId`) → `eas init`.
- [ ] App icon + splash are real (not placeholders) at 1024×1024.
- [ ] `eas build -p ios --profile production` then `eas submit -p ios`.
- [ ] Provide a **demo account** (or note guest mode) in App Review notes, and explain the AI/subscription so the reviewer can exercise them.

## 6. Business banking 🟡 (see chat for the full answer)

- [ ] Form an LLC (or sole-prop to start) and get an **EIN**.
- [ ] Open a **business checking account** + a dedicated **debit/credit card** used only for
      AI + infra subscriptions (OpenRouter/Anthropic, Google AI, Supabase, RevenueCat, Apple).
- [ ] Apple pays out subscription revenue (after its 15–30% cut) to the business bank account.

## 7. Compliance notes specific to Chronos 🟡

- **Minors (Apple 1.3 / 5.1.4):** target users are 9–12th graders (under 18, some under 16).
  - Set the age rating accordingly and avoid behavioral ad tracking.
  - You currently request no tracking — keep it that way (no IDFA / ATT prompt needed).
  - Privacy policy must address minors and parental considerations (COPPA applies under 13; most HS students are 13+, but be explicit).
- **Account deletion (Apple 5.1.1(v)):** apps with account creation must offer in-app
  account deletion. Add a "Delete account" action in Settings → Account before submitting. 🔴
- **Permissions:** camera + photo library strings are set in `app.json` for the scan feature. Notifications string is set. Good.

---

## Security & Stub Audit — 2026-07-03

Scoped `/cso` pass on `apps/api`'s auth middleware, requested after the June audit
flagged it as trusting a client-supplied header. **Still true in current code.**
No code changes made — this is a report only.

### 🔴 1. Auth middleware still trusts an unverified client header — CRITICAL, confidence 9/10

`apps/api/src/middleware/auth.ts:19,28`:
```ts
c.set('userId', c.req.header('x-dev-user-id') ?? env.devUserId);
```
There is no session, cookie, or JWT check anywhere in this file — `userId` is
whatever string the caller puts in `X-Dev-User-Id`. The only gate in front of it
is a single static shared secret (`env.auraApiKey`, line 24), and that secret is
**not actually secret**: `apps/mobile/services/auraClient.ts:22` reads it from
`EXPO_PUBLIC_AURA_API_KEY` / `app.json extra.auraApiKey`, i.e. it ships baked into
every install of the app binary, identical for every user, never rotated per
account. Anyone who pulls it once (bundle inspection, or just proxying their own
device's traffic) has a permanent skeleton key.

**Blast radius today** — every route under `/v1` depends on this middleware
(`apps/api/src/index.ts:17`, `v1.use('/*', devAuth)`), which covers `/v1/chat`,
`/v1/ocr`, and all three job routes in `apps/api/src/routes/jobs.ts`
(`/daily-sync`, `/shadow-replan`, `/sunday-briefing`). `apps/api` does **not**
talk to Supabase yet (no `supabase` import anywhere in `apps/api/src`), so the
concrete exploit right now is: swap `X-Dev-User-Id` to another student's UUID
and (a) burn their daily Claude copilot quota and read/send chat "as" them —
`rateLimit.ts` buckets key only on this spoofable `userId` — (b) call `/v1/ocr`
as them, (c) fire `daily-sync` / `shadow-replan` / `sunday-briefing` with their
forged identity as the job payload (the job *handlers* in
`packages/trigger/src/jobs/*.ts` are still plain stub functions, not registered
Trigger.dev tasks, so nothing executes server-side yet — but the API accepts
and would forward the forged identity the moment Trigger.dev is wired).

**Why this is the top-priority item, not a someday-fix:** this exact header is
what item #4 below ("Supabase — verify RLS policies") is designed to protect
against. RLS policies scope `tasks`, `scheduled_blocks`, `guardrails`,
`conversations` by `auth.uid()` from a *verified* Supabase JWT. This backend has
no verified JWT anywhere. The natural, fastest way to fill in the `// TODO:
Supabase` comments already in the codebase is `supabase.from('tasks').select()
.eq('user_id', c.get('userId'))` — and the moment that lands, this becomes a
full cross-student IDOR: read or write any other student's assignments,
schedule, guardrails, and copilot history by changing one header. **Fix this
before, not after, wiring real Supabase queries into `apps/api`.**

**Minimal fix (proposed, not implemented):**
1. Add `@supabase/supabase-js` to `apps/api` (already a dep of `packages/shared`).
2. In `auth.ts`, read `Authorization: Bearer <token>`, verify it via
   `supabase.auth.getUser(token)` (or local JWT-secret verification to skip the
   round trip), and set `userId` from the verified token's `sub` — never from a
   header.
3. Transition safety for the Expo Go client currently under test: keep the old
   static-key + `X-Dev-User-Id` path alive as a fallback *only* when no valid
   Supabase JWT is present and `NODE_ENV !== 'production'`. Nothing on the
   mobile side breaks mid-migration.
4. Mobile already holds a real Supabase session —
   `apps/mobile/hooks/useAuth.ts` calls `supabase.auth.getSession()` — so
   `session.access_token` exists today with no new client-side auth work.
   Update `getAuraApiHeaders()` in `apps/mobile/services/auraClient.ts` to send
   `Authorization: Bearer ${session.access_token}`, threading it through
   `chatApi.ts` / `jobs.ts` call sites (which currently take a plain `userId`
   string param).
5. Decide guest mode explicitly: `GUEST_USER_ID` (`apps/mobile/lib/guest.ts`)
   has no Supabase session, so decide whether guests get a scoped anonymous
   Supabase session or are blocked server-side from `/v1/jobs`, `/v1/chat`,
   `/v1/ocr` once verification lands.
6. Ship the `apps/api` change first (additive/backward-compatible in dev),
   verify against the Expo Go client, *then* remove the fallback before the
   App Store build.

### 🟡 2. "Sync Now" button — still no backend job, confirmed

`apps/mobile/app/settings/connections.tsx:444-452` (`handleSync`) only shows a
toast and a fake `setTimeout` spinner — there's a `// TODO: Trigger.dev` comment
and no `fetch` call. The wired job client
(`apps/mobile/services/jobs.ts` — `triggerDailySyncJob`, `requestShadowSchedule`,
`requestSundayBriefing`) exists and is called from `settings.tsx:465`, but only
for `requestSundayBriefing`. No UI element calls `triggerDailySyncJob`. "Sync
Now" specifically still does nothing real.

### 🟡 3. CopilotAction — parsed server-side, dropped client-side, confirmed

`apps/api/src/lib/claudeCopilot.ts` (`tryParseCopilotJson`) extracts a structured
`action` out of Claude's JSON reply and returns it on `CopilotResponse.action`.
On the client, `apps/mobile/app/(tabs)/ai/chat.tsx:345-348` only reads
`res.message` to render the chat bubble — `res.action` is never read anywhere
else in `apps/mobile` (the `CopilotAction` type is imported into
`services/chatApi.ts` but never consumed downstream). Pipeline C (Blueprint
§6.2) stops at "confirm + display" and never reaches "write to DB".

### Prioritized fix order
1. 🔴 Auth middleware — verify Supabase JWT instead of trusting `X-Dev-User-Id` (must land *before* Supabase queries are wired into `apps/api`, not after — see reasoning above)
2. 🔴 Decide the guest-mode auth story (blocks #1's fallback design)
3. 🟡 Wire `CopilotAction` execution client-side (do this *after* #1 — executing actions under a spoofable identity compounds the impact)
4. 🟡 Wire "Sync Now" to `triggerDailySyncJob`

No code has been changed as part of this audit — awaiting go-ahead before implementing any of the above.

---

## What was changed in the app (for reference)
- Fixed the dependency tree (missing `expo-linear-gradient`/`expo-blur`/`expo-glass-effect`, stale `@aura/shared` link) — this was the cause of the Week screen "error loading".
- Wired every dead button to a working destination; replaced "AURA" branding with "Chronos".
- Built the onboarding **questionnaire** → **paywall** flow (gate steps 5 & 6).
- Built the camera **Scan assignment** screen (OCR with manual fallback).
- Consolidated the AI backend into `apps/api` (chat + jobs + new `/v1/ocr`).
- Added Supabase/AI env fallbacks via `app.json` so the app connects out of the box.
- **Cost controls:** Claude copilot system prompt is now prompt-cached (Anthropic +
  OpenRouter paths); a soft per-user daily message cap (`COPILOT_DAILY_MESSAGE_CAP`,
  default 40) protects against runaway Sonnet spend and surfaces a friendly limit
  message in chat. Early annual lowered $85 → **$79** to widen the annual discount.
