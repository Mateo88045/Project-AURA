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
