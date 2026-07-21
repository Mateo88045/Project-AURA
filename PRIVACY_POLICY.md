# Chronos Privacy Policy

_Last updated: 2026-07-12_

Chronos is a study-scheduling app for high school students. We take privacy seriously
because our users are young and because the data we touch — assignments, grades,
schedules — is personal.

This policy explains what we collect, why we collect it, who we share it with,
how long we keep it, and how you (or your parent/guardian) can access, correct,
or delete it.

**This policy is not legal advice.** Chronos Labs, Inc. should have this document
reviewed by counsel licensed in its state of incorporation before the app leaves
beta, and again before Chronos operates in any school district that requires a
data-sharing or DPA agreement.

---

## 1. Who we are

Chronos is operated by **Chronos Labs, Inc.** ("Chronos," "we," "us," "our"), a
New Jersey corporation. You can reach us, our Data Protection contact, or our
COPPA-designated contact at **privacy@chronos-app.com**.

If Chronos is used within a school or district's managed Google Workspace or
Canvas environment, the school or district — not the student — may be the
party responsible for authorizing Chronos's access under its own agreements
with Google/Instructure. Contact your school's IT or privacy office if you are
unsure whether your account is personal or district-managed.

## 2. Who can use Chronos

Chronos is intended for users **13 years of age or older**. Chronos does not
independently verify a user's age or grade level at account creation — grade
level is self-reported during onboarding and is used for scheduling defaults
only, not as an age-verification mechanism. **We rely on the accuracy of the
information you provide at sign-up.**

If you are under 13, do not create a Chronos account. If you are 13–17, you
represent that you have your parent or legal guardian's permission to use
Chronos and, where Chronos offers a paid subscription, to authorize any
associated charges. Parents/guardians of a minor may exercise every right in
Section 9 (Your Rights) on the minor's behalf.

See Section 6 for what happens if we learn an account belongs to a child
under 13.

## 3. What we collect

### Account information
- Your name, email address, and grade level (from sign-in or onboarding).
- Your school's name (if you connect a class platform).
- Your Apple or Google authentication identifier.

### Schedule and assignment data
- Assignments pulled from your connected Google Classroom or Canvas account,
  which may qualify as **education records** under FERPA if your account is
  managed by your school (see Section 7).
- Fixed events you add (classes, sports, meals, sleep windows).
- Time you spend on tasks and your feedback on Chronos's estimates.

### Onboarding answers
- Your subjects, confidence per subject, extracurriculars, preferred study
  window, and bedtime guardrail. We use this to schedule your week. Some of
  this data (e.g., sleep windows, workload stress signals) can indirectly
  suggest health- or wellness-related inferences; we do not use it for any
  purpose beyond scheduling and do not sell or share it for advertising.

### Billing and subscription data
- If you start a trial or subscribe to Chronos Pro, our payment processor
  (RevenueCat, and in turn the Apple App Store / Google Play Store) handles
  your actual payment method. **Chronos never receives or stores your full
  card number.** We receive subscription status, product identifiers,
  purchase/renewal/cancellation events, and a RevenueCat-generated app user ID.

### Technical data
- Device type, OS version, and app version (used to diagnose crashes).
- A push-notification token (so we can send you reminders).
- Approximate IP-derived region (from network requests; not stored).
- Crash and error diagnostics collected by our error-monitoring provider,
  Sentry, so we can diagnose and fix problems (see Section 8). These reports
  are configured to exclude the content of your assignments, chats, and
  personal profile.

### What we do NOT collect
- We do not collect your precise (GPS) location.
- We do not access your contacts, photos library (beyond a photo you
  deliberately submit for OCR), microphone, device calendar, or health app data.
- We do not use advertising identifiers (IDFA/AAID) or run any third-party
  advertising SDK.
- We do not knowingly collect Social Security numbers, government ID numbers,
  or financial account numbers.

## 4. How we use your data

We use your data only to:
1. Run the app for you — pull assignments, schedule your week, send reminders.
2. Process your subscription — start/renew/cancel trials and paid plans.
3. Improve our scheduling — anonymized, aggregated "estimated vs. actual"
   time-spent data helps us tune the engine. Aggregated data cannot be used
   to re-identify you.
4. Maintain and secure the service — detect abuse, debug crashes, prevent
   fraud.
5. Respond to support requests you send us.
6. Comply with legal obligations (e.g., responding to a valid subpoena, or a
   parent/guardian deletion request under COPPA).

We do **not** sell your personal information. We do **not** share it with
data brokers or advertisers, and we do not use it to build advertising
profiles. We do not use your data to train third-party AI models (see
Section 5).

We will not use your data for a materially different purpose than what is
described here without first getting your (or, if you are under 18 and the
new use is not obviously part of running Chronos, your parent's) affirmative
consent.

## 5. AI processing

When Chronos grades the difficulty of an assignment or you chat with the
copilot, the relevant assignment text (not your full account profile) is sent
to one of our AI sub-processors — Google (Gemini) for bulk grading and photo
OCR, Anthropic (Claude) for the conversational copilot. These providers:

- Process data only on our instructions, under a data-processing agreement.
- Do **not** use the content of your requests to train their general models.
- Retain request data only as long as needed for abuse monitoring, per their
  respective API data-retention terms.

Photos you take of paper assignments are sent to Google Gemini Vision for OCR
and discarded after the structured result is returned to your device; we do
not retain a copy of the original photo server-side beyond the processing
window needed to return the result.

The schedule you see is **not** generated by an AI model — task placement is
computed by a deterministic algorithm running on our servers. AI is used only
for difficulty grading, OCR, and conversational chat, never to decide when
your assignments are due.

## 6. Children's privacy (COPPA)

Chronos is intended for users aged **13 and older** and is not directed to
children under 13. We do not knowingly collect personal information from
anyone under 13.

Because we do not verify age at sign-up, it is possible a user under 13
could create an account by misrepresenting their age. If we learn — through
a report, a parent, a school, or our own review — that we have collected
personal information from a child under 13 without verifiable parental
consent, we will:

1. Suspend the account's access to the app within a reasonable time.
2. Delete the associated account and personal information within 30 days,
   except data we are legally required to retain.
3. Notify the parent/guardian who contacted us that deletion is complete.

**Parents:** if you believe your child under 13 has created an account,
email **privacy@chronos-app.com** with the account's email address or
username. We will not require you to prove your identity beyond what is
reasonably necessary to verify you are the parent making the request.

We do not condition a child's participation in an activity on disclosing
more personal information than is reasonably necessary for that activity.

## 7. School data and FERPA

If you connect Google Classroom or Canvas using a **school-managed**
account, the assignment, grade, and roster data Chronos pulls may be an
"education record" under the Family Educational Rights and Privacy Act
(FERPA). In that case:

- Chronos acts as a **school official with a legitimate educational
  interest** only where a school or district has authorized that role under
  a written agreement with Chronos (a data-sharing agreement or its
  functional equivalent). Where no such agreement exists, we rely on the
  student's own OAuth-based authorization to connect their personal Google
  Classroom or Canvas account, and we do not treat that data as covered by
  a school's FERPA-official designation.
- We use education-record data only to power scheduling for that student —
  never for advertising, profiling unrelated to scheduling, or resale.
- Schools or districts with a signed data-sharing agreement with Chronos may
  request an audit of how their students' data is handled, and may request
  deletion of their students' data upon leaving the agreement.
- If your state has a student-data-privacy law (for example, California's
  Student Online Personal Information Protection Act, SOPIPA, or a similar
  law in your state), Chronos does not use covered information to engage in
  targeted advertising, build a non-educational profile, sell the
  information, or disclose it except as permitted by that law.

If you are a school administrator and need a data-sharing agreement in
place before your students use Chronos, contact **privacy@chronos-app.com**.

## 8. Who we share data with

We share data only with these sub-processors, each under a contract that
restricts its use to operating Chronos on our behalf:

| Processor | Purpose | Data involved |
|---|---|---|
| Supabase (database, auth, storage) | Account storage, sync | All account, schedule, and task data |
| Trigger.dev (background jobs) | Nightly assignment pulls, batch grading | Assignment/task data |
| Google (Classroom API, Gemini, Sign in with Google) | Class data sync, AI grading/OCR, auth | Assignment text, photos (OCR), auth identifier |
| Anthropic (Claude) | Conversational copilot | Chat messages, relevant schedule context |
| Apple (Sign in with Apple, APNs) | Auth, push notifications | Auth identifier, push token |
| Expo (push notification delivery) | Routing push notifications to APNs/FCM | Push token, device/app version |
| Sentry (Functional Software, Inc.) | Crash and error diagnostics | Device model, OS/app version, crash stack traces, and a coarse IP address used only to correlate an error to a session — not stored as location |
| RevenueCat | Subscription management, entitlement status | Purchase/renewal events, app user ID, subscription status — **not** your card number |
| Apple App Store / Google Play Store | Payment processing | Payment method (held by Apple/Google, never by us) |

We do not permit any sub-processor to use Chronos user data for its own
advertising or model-training purposes.

### Google API Services Limited Use

Chronos's use and transfer to any other app of information received from
Google APIs (including Google Classroom course and coursework data) will
adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the **Limited Use** requirements. Specifically:

- We use Google user data **only** to provide and improve the scheduling
  features you see in Chronos.
- We do **not** transfer or sell Google user data to third parties for
  advertising, and we do **not** use it for advertising of any kind.
- We do **not** allow humans to read your Google user data unless (a) you
  give explicit consent for specific data, (b) it is necessary for security
  purposes (e.g., investigating abuse), (c) it is necessary to comply with
  applicable law, or (d) the data is aggregated and de-identified.
- We do **not** use Google user data to train generalized or third-party AI
  models. Where an assignment's text is sent to our AI sub-processors for
  difficulty grading, it is processed only to return a result to you and is
  not used to train their models.

You can revoke Chronos's access to your Google account at any time in
Settings → Connections, or via your
[Google Account permissions](https://myaccount.google.com/permissions) page.

**Business transfers.** If Chronos is acquired, merges, or sells substantially
all of its assets, your information may be transferred as part of that
transaction. We will notify you (via in-app notice or email) before your
data becomes subject to a different privacy policy.

**Legal disclosure.** We will share data with law enforcement or in response
to legal process (subpoena, court order) only when we believe in good faith
that disclosure is legally required, and we will notify the affected user
before disclosure unless prohibited by law or in a genuine emergency
involving risk of harm to a minor.

## 9. Your rights

Regardless of where you live, you can at any time:
- See everything Chronos knows about you (Settings → Chronos's Brain).
- Disconnect any class platform (Settings → Connections).
- Sign out (Settings → Sign out) — your local credentials are wiped immediately.
- Correct inaccurate account information directly in Settings, or by emailing us.
- Request full account deletion by emailing **privacy@chronos-app.com**. We
  will delete your data within 30 days of a verified request.
- Request a copy of your data in a portable, machine-readable format by
  emailing **privacy@chronos-app.com**; we will provide it within 30 days of
  a verified request.
- Withdraw consent for AI-based grading or OCR by disconnecting your class
  platforms and declining photo grading — Chronos will fall back to manual
  task and difficulty entry. (If a dedicated in-app AI toggle is not present
  in your version, email us and we will disable AI grading on your account.)

If you used Sign in with Apple, you can also revoke access from your iPhone:
Settings → Apple ID → Sign-In & Security → Sign in with Apple → Chronos.

### If you are a California resident (CCPA/CPRA)
You have the right to know what personal information we collect, to request
deletion, to correct inaccurate information, and to opt out of the "sale" or
"sharing" of personal information (as those terms are defined by California
law). **We do not sell or share personal information for cross-context
behavioral advertising, so there is nothing to opt out of.** We do not use
automated decision-making that produces legal or similarly significant
effects. We will not discriminate against you for exercising these rights.

### If you are a resident of another U.S. state with a comprehensive privacy law (e.g., Virginia, Colorado, Connecticut, Utah, Oregon)

You have substantially similar rights to access, correct, delete, and obtain
a copy of your data, and to appeal a denied request by emailing
**privacy@chronos-app.com** with "Privacy Appeal" in the subject line.

## 10. Data retention

- **Active account data:** kept while your account is active.
- **After account deletion:** removed within 30 days, except:
  - Data we must retain to comply with law (e.g., tax/financial records
    related to a subscription, which we do not currently hold beyond what
    Apple/Google/RevenueCat retain as payment processors).
  - Backups, which age out and are overwritten on a rolling basis within 90
    days.
- **Chat/copilot history:** retained for as long as your account is active
  so the copilot has context; deleted on account deletion.
- **Crash and diagnostic logs:** retained for up to 90 days, then purged.
- **Aggregate, de-identified analytics** (e.g., "average estimation error
  across all users") may be retained indefinitely because it cannot be
  linked back to an individual.

## 11. Security

We encrypt data in transit (TLS 1.2+) and at rest (Supabase Postgres + AES).
OAuth and Canvas access tokens are encrypted column-side with keys held only
by our backend, and are never exposed to the client app in plaintext.
Access to production data is limited to engineers who need it, and is logged.

No system is perfectly secure. If we experience a breach that compromises
your personal information, we will notify affected users and, where legally
required, the relevant state Attorney General or regulator, within the time
required by applicable law (commonly as fast as 30–72 hours for
COPPA-covered incidents, and per each state's breach-notification statute
otherwise). We will describe what happened, what data was involved, and
what steps we've taken.

## 12. International use

Chronos is designed for U.S. high school students and our servers and
sub-processors operate primarily in the United States. If you access Chronos
from outside the U.S., your data will be transferred to and processed in the
U.S., where privacy laws may differ from those of your country. By using
Chronos from outside the U.S., you consent to this transfer.

## 13. Changes to this policy

We will post any material changes here, update the "Last updated" date, and
notify you via in-app banner before the change takes effect. If a change
would allow us to use previously collected data in a materially different
way, we will ask for renewed consent before applying it to data collected
under the old policy.

---

**Questions, corrections, or deletion requests?** privacy@chronos-app.com

This policy is intended to help satisfy Apple App Store Guideline 5.1.1,
COPPA, CCPA/CPRA, and FERPA's school-official disclosure norms. **It is not
a substitute for review by a licensed attorney**, and it does not by itself
create a data-sharing agreement with any school or district — that requires
a separate signed agreement.
