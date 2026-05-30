# Chronos Privacy Policy

_Last updated: 2026-05-28_

Chronos is a study-scheduling app for high school students. We take privacy seriously
because our users are young and because the data we touch — assignments, grades,
schedules — is personal.

This policy explains what we collect, why we collect it, who we share it with,
and how you can ask us to delete it.

---

## 1. Who we are

Chronos is operated by **Chronos Labs, Inc.** ("Chronos," "we," "us"). You can reach us
at **privacy@chronos-app.com**.

## 2. What we collect

### Account information
- Your name, email address, and grade level (from sign-in or onboarding).
- Your school's name (if you connect a class platform).
- Your Apple, Google, or email-OTP authentication identifier.

### Schedule and assignment data
- Assignments pulled from your connected Google Classroom or Canvas account.
- Fixed events you add (classes, sports, meals, sleep).
- Time you spend on tasks and your feedback on Chronos's estimates.

### Onboarding answers
- Your subjects, confidence per subject, extracurriculars, preferred study
  window, and bedtime guardrail. We use this to schedule your week.

### Technical data
- Device type, OS version, and app version (used to diagnose crashes).
- A push-notification token (so we can send you reminders).
- Approximate IP-derived region (from network requests; not stored).

### What we do NOT collect
- We do not collect your precise location.
- We do not access your contacts, photos library, microphone, calendar, or
  health data.
- We do not use advertising identifiers (IDFA) or run any third-party
  advertising or analytics SDKs.

## 3. How we use your data

We use your data only to:
1. Run the app for you — pull assignments, schedule your week, send reminders.
2. Improve our scheduling — anonymized aggregates of "estimated vs. actual"
   time spent help us tune the engine.
3. Respond to support requests you send us.

We do **not** sell your data. We do **not** share it with advertisers.

## 4. AI processing

When Chronos grades the difficulty of an assignment or you chat with the copilot,
the relevant text is sent to one of our AI providers (Google Gemini, Anthropic
Claude). These providers process the data on our behalf under their respective
data-processing agreements and **do not** use it to train models.

Photos you take of paper assignments are sent to Google Gemini Vision for OCR
and discarded after the structured result is returned to your device.

## 5. Who we share data with

We share data only with these processors, each under a contract that restricts
its use to operating Chronos:

| Processor | Purpose |
|---|---|
| Supabase (database, auth, storage) | Account storage, sync |
| Trigger.dev (background jobs) | Daily assignment pulls |
| Google (Classroom API, Gemini, Apple/Google sign-in) | Class data sync, AI grading, auth |
| Anthropic (Claude) | Conversational copilot |
| Expo / Apple Push Notification service | Push notifications |

We will share data with law enforcement only when legally required.

## 6. Children's privacy (COPPA)

Chronos is intended for users aged **13 and older**. We do not knowingly collect
personal information from anyone under 13. If you are a parent and believe
your child under 13 has created an account, email privacy@chronos-app.com and we
will delete the account and associated data.

## 7. Your rights

You can, at any time:
- See everything Chronos knows about you (Settings → Chronos's brain).
- Disconnect any class platform (Settings → Connections).
- Sign out (Settings → Sign out) — your local credentials are wiped immediately.
- Request full account deletion by emailing **privacy@chronos-app.com**. We will
  delete your data within 30 days.

If you used Sign in with Apple, you can also revoke access from your iPhone:
Settings → Apple ID → Sign-In & Security → Sign in with Apple → Chronos.

## 8. Data retention

- Active account data: kept while your account is active.
- After account deletion: removed within 30 days, except where law requires
  longer retention (e.g. fraud or financial records, which we do not currently
  hold for student users).
- Aggregate, anonymized analytics may be retained indefinitely.

## 9. Security

We encrypt data in transit (TLS 1.2+) and at rest (Supabase Postgres + AES).
OAuth and Canvas access tokens are encrypted column-side with keys held only
by our backend.

No system is perfectly secure. If we ever experience a breach affecting your
data, we will notify you within 72 hours.

## 10. Changes to this policy

We will post any material changes here and notify you via in-app banner
before the change takes effect.

---

**Questions?** privacy@chronos-app.com

This policy is intended to satisfy Apple App Store Guideline 5.1.1 and
California's CCPA. It is not legal advice; consult a lawyer before launch.
