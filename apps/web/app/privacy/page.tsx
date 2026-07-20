import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — Chronos',
  description: 'How Chronos collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <LegalNav />

      <main className="px-6 pt-32 pb-20">
        <article className="max-w-3xl mx-auto legal-prose">
          <h1 className="font-serif-i" style={{ fontSize: 40, lineHeight: 1.1, marginBottom: 12 }}>
            Chronos Privacy Policy
          </h1>
          <p className="text-secondary" style={{ fontStyle: 'italic', marginBottom: 32 }}>
            Last updated: 2026-07-12
          </p>

          <p>
            Chronos is a study-scheduling app for high school students. We take privacy seriously
            because our users are young and because the data we touch — assignments, grades,
            schedules — is personal.
          </p>
          <p>
            This policy explains what we collect, why we collect it, who we share it with, how
            long we keep it, and how you (or your parent/guardian) can access, correct, or delete
            it.
          </p>
          <p>
            <strong>This policy is not legal advice.</strong> Chronos Labs, Inc. should have this
            document reviewed by counsel licensed in its state of incorporation before the app
            leaves beta, and again before Chronos operates in any school district that requires a
            data-sharing or DPA agreement.
          </p>

          <hr />

          <h2>1. Who we are</h2>
          <p>
            Chronos is operated by <strong>Chronos Labs, Inc.</strong> (&ldquo;Chronos,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;), a New Jersey corporation. You
            can reach us, our Data Protection contact, or our COPPA-designated contact at{' '}
            <a href="mailto:privacy@chronos-app.com">
              <strong>privacy@chronos-app.com</strong>
            </a>
            .
          </p>
          <p>
            If Chronos is used within a school or district&rsquo;s managed Google Workspace or
            Canvas environment, the school or district — not the student — may be the party
            responsible for authorizing Chronos&rsquo;s access under its own agreements with
            Google/Instructure. Contact your school&rsquo;s IT or privacy office if you are unsure
            whether your account is personal or district-managed.
          </p>

          <h2>2. Who can use Chronos</h2>
          <p>
            Chronos is intended for users <strong>13 years of age or older</strong>. Chronos does
            not independently verify a user&rsquo;s age or grade level at account creation — grade
            level is self-reported during onboarding and is used for scheduling defaults only, not
            as an age-verification mechanism.{' '}
            <strong>We rely on the accuracy of the information you provide at sign-up.</strong>
          </p>
          <p>
            If you are under 13, do not create a Chronos account. If you are 13–17, you represent
            that you have your parent or legal guardian&rsquo;s permission to use Chronos and,
            where Chronos offers a paid subscription, to authorize any associated charges.
            Parents/guardians of a minor may exercise every right in Section 9 (Your Rights) on
            the minor&rsquo;s behalf.
          </p>
          <p>
            See Section 6 for what happens if we learn an account belongs to a child under 13.
          </p>

          <h2>3. What we collect</h2>

          <h3>Account information</h3>
          <ul>
            <li>Your name, email address, and grade level (from sign-in or onboarding).</li>
            <li>Your school&rsquo;s name (if you connect a class platform).</li>
            <li>Your Apple or Google authentication identifier.</li>
          </ul>

          <h3>Schedule and assignment data</h3>
          <ul>
            <li>
              Assignments pulled from your connected Google Classroom or Canvas account, which may
              qualify as <strong>education records</strong> under FERPA if your account is managed
              by your school (see Section 7).
            </li>
            <li>Fixed events you add (classes, sports, meals, sleep windows).</li>
            <li>Time you spend on tasks and your feedback on Chronos&rsquo;s estimates.</li>
          </ul>

          <h3>Onboarding answers</h3>
          <ul>
            <li>
              Your subjects, confidence per subject, extracurriculars, preferred study window, and
              bedtime guardrail. We use this to schedule your week. Some of this data (e.g., sleep
              windows, workload stress signals) can indirectly suggest health- or wellness-related
              inferences; we do not use it for any purpose beyond scheduling and do not sell or
              share it for advertising.
            </li>
          </ul>

          <h3>Billing and subscription data</h3>
          <ul>
            <li>
              If you start a trial or subscribe to Chronos Pro, our payment processor (RevenueCat,
              and in turn the Apple App Store / Google Play Store) handles your actual payment
              method.{' '}
              <strong>Chronos never receives or stores your full card number.</strong> We receive
              subscription status, product identifiers, purchase/renewal/cancellation events, and
              a RevenueCat-generated app user ID.
            </li>
          </ul>

          <h3>Technical data</h3>
          <ul>
            <li>Device type, OS version, and app version (used to diagnose crashes).</li>
            <li>A push-notification token (so we can send you reminders).</li>
            <li>Approximate IP-derived region (from network requests; not stored).</li>
            <li>
              Crash and error diagnostics collected by our error-monitoring provider, Sentry, so
              we can diagnose and fix problems (see Section 8). These reports are configured to
              exclude the content of your assignments, chats, and personal profile.
            </li>
          </ul>

          <h3>What we do NOT collect</h3>
          <ul>
            <li>We do not collect your precise (GPS) location.</li>
            <li>
              We do not access your contacts, photos library (beyond a photo you deliberately
              submit for OCR), microphone, device calendar, or health app data.
            </li>
            <li>
              We do not use advertising identifiers (IDFA/AAID) or run any third-party advertising
              SDK.
            </li>
            <li>
              We do not knowingly collect Social Security numbers, government ID numbers, or
              financial account numbers.
            </li>
          </ul>

          <h2>4. How we use your data</h2>
          <p>We use your data only to:</p>
          <ol>
            <li>Run the app for you — pull assignments, schedule your week, send reminders.</li>
            <li>Process your subscription — start/renew/cancel trials and paid plans.</li>
            <li>
              Improve our scheduling — anonymized, aggregated &ldquo;estimated vs. actual&rdquo;
              time-spent data helps us tune the engine. Aggregated data cannot be used to
              re-identify you.
            </li>
            <li>Maintain and secure the service — detect abuse, debug crashes, prevent fraud.</li>
            <li>Respond to support requests you send us.</li>
            <li>
              Comply with legal obligations (e.g., responding to a valid subpoena, or a
              parent/guardian deletion request under COPPA).
            </li>
          </ol>
          <p>
            We do <strong>not</strong> sell your personal information. We do <strong>not</strong>{' '}
            share it with data brokers or advertisers, and we do not use it to build advertising
            profiles. We do not use your data to train third-party AI models (see Section 5).
          </p>
          <p>
            We will not use your data for a materially different purpose than what is described
            here without first getting your (or, if you are under 18 and the new use is not
            obviously part of running Chronos, your parent&rsquo;s) affirmative consent.
          </p>

          <h2>5. AI processing</h2>
          <p>
            When Chronos grades the difficulty of an assignment or you chat with the copilot, the
            relevant assignment text (not your full account profile) is sent to one of our AI
            sub-processors — Google (Gemini) for bulk grading and photo OCR, Anthropic (Claude)
            for the conversational copilot. These providers:
          </p>
          <ul>
            <li>Process data only on our instructions, under a data-processing agreement.</li>
            <li>
              Do <strong>not</strong> use the content of your requests to train their general
              models.
            </li>
            <li>
              Retain request data only as long as needed for abuse monitoring, per their
              respective API data-retention terms.
            </li>
          </ul>
          <p>
            Photos you take of paper assignments are sent to Google Gemini Vision for OCR and
            discarded after the structured result is returned to your device; we do not retain a
            copy of the original photo server-side beyond the processing window needed to return
            the result.
          </p>
          <p>
            The schedule you see is <strong>not</strong> generated by an AI model — task placement
            is computed by a deterministic algorithm running on our servers. AI is used only for
            difficulty grading, OCR, and conversational chat, never to decide when your
            assignments are due.
          </p>

          <h2>6. Children&rsquo;s privacy (COPPA)</h2>
          <p>
            Chronos is intended for users aged <strong>13 and older</strong> and is not directed
            to children under 13. We do not knowingly collect personal information from anyone
            under 13.
          </p>
          <p>
            Because we do not verify age at sign-up, it is possible a user under 13 could create
            an account by misrepresenting their age. If we learn — through a report, a parent, a
            school, or our own review — that we have collected personal information from a child
            under 13 without verifiable parental consent, we will:
          </p>
          <ol>
            <li>Suspend the account&rsquo;s access to the app within a reasonable time.</li>
            <li>
              Delete the associated account and personal information within 30 days, except data
              we are legally required to retain.
            </li>
            <li>Notify the parent/guardian who contacted us that deletion is complete.</li>
          </ol>
          <p>
            <strong>Parents:</strong> if you believe your child under 13 has created an account,
            email{' '}
            <a href="mailto:privacy@chronos-app.com">
              <strong>privacy@chronos-app.com</strong>
            </a>{' '}
            with the account&rsquo;s email address or username. We will not require you to prove
            your identity beyond what is reasonably necessary to verify you are the parent making
            the request.
          </p>
          <p>
            We do not condition a child&rsquo;s participation in an activity on disclosing more
            personal information than is reasonably necessary for that activity.
          </p>

          <h2>7. School data and FERPA</h2>
          <p>
            If you connect Google Classroom or Canvas using a <strong>school-managed</strong>{' '}
            account, the assignment, grade, and roster data Chronos pulls may be an
            &ldquo;education record&rdquo; under the Family Educational Rights and Privacy Act
            (FERPA). In that case:
          </p>
          <ul>
            <li>
              Chronos acts as a{' '}
              <strong>school official with a legitimate educational interest</strong> only where a
              school or district has authorized that role under a written agreement with Chronos
              (a data-sharing agreement or its functional equivalent). Where no such agreement
              exists, we rely on the student&rsquo;s own OAuth-based authorization to connect
              their personal Google Classroom or Canvas account, and we do not treat that data as
              covered by a school&rsquo;s FERPA-official designation.
            </li>
            <li>
              We use education-record data only to power scheduling for that student — never for
              advertising, profiling unrelated to scheduling, or resale.
            </li>
            <li>
              Schools or districts with a signed data-sharing agreement with Chronos may request
              an audit of how their students&rsquo; data is handled, and may request deletion of
              their students&rsquo; data upon leaving the agreement.
            </li>
            <li>
              If your state has a student-data-privacy law (for example, California&rsquo;s
              Student Online Personal Information Protection Act, SOPIPA, or a similar law in
              your state), Chronos does not use covered information to engage in targeted
              advertising, build a non-educational profile, sell the information, or disclose it
              except as permitted by that law.
            </li>
          </ul>
          <p>
            If you are a school administrator and need a data-sharing agreement in place before
            your students use Chronos, contact{' '}
            <a href="mailto:privacy@chronos-app.com">
              <strong>privacy@chronos-app.com</strong>
            </a>
            .
          </p>

          <h2>8. Who we share data with</h2>
          <p>
            We share data only with these sub-processors, each under a contract that restricts its
            use to operating Chronos on our behalf:
          </p>
          <div className="legal-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Processor</th>
                  <th>Purpose</th>
                  <th>Data involved</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Supabase (database, auth, storage)</td>
                  <td>Account storage, sync</td>
                  <td>All account, schedule, and task data</td>
                </tr>
                <tr>
                  <td>Trigger.dev (background jobs)</td>
                  <td>Nightly assignment pulls, batch grading</td>
                  <td>Assignment/task data</td>
                </tr>
                <tr>
                  <td>Google (Classroom API, Gemini, Sign in with Google)</td>
                  <td>Class data sync, AI grading/OCR, auth</td>
                  <td>Assignment text, photos (OCR), auth identifier</td>
                </tr>
                <tr>
                  <td>Anthropic (Claude)</td>
                  <td>Conversational copilot</td>
                  <td>Chat messages, relevant schedule context</td>
                </tr>
                <tr>
                  <td>Apple (Sign in with Apple, APNs)</td>
                  <td>Auth, push notifications</td>
                  <td>Auth identifier, push token</td>
                </tr>
                <tr>
                  <td>Expo (push notification delivery)</td>
                  <td>Routing push notifications to APNs/FCM</td>
                  <td>Push token, device/app version</td>
                </tr>
                <tr>
                  <td>Sentry (Functional Software, Inc.)</td>
                  <td>Crash and error diagnostics</td>
                  <td>
                    Device model, OS/app version, crash stack traces, and a coarse IP address used
                    only to correlate an error to a session — not stored as location
                  </td>
                </tr>
                <tr>
                  <td>RevenueCat</td>
                  <td>Subscription management, entitlement status</td>
                  <td>
                    Purchase/renewal events, app user ID, subscription status —{' '}
                    <strong>not</strong> your card number
                  </td>
                </tr>
                <tr>
                  <td>Apple App Store / Google Play Store</td>
                  <td>Payment processing</td>
                  <td>Payment method (held by Apple/Google, never by us)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            We do not permit any sub-processor to use Chronos user data for its own advertising or
            model-training purposes.
          </p>

          <h3>Google API Services Limited Use</h3>
          <p>
            Chronos&rsquo;s use and transfer to any other app of information received from Google
            APIs (including Google Classroom course and coursework data) will adhere to the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy">
              Google API Services User Data Policy
            </a>
            , including the <strong>Limited Use</strong> requirements. Specifically:
          </p>
          <ul>
            <li>
              We use Google user data <strong>only</strong> to provide and improve the scheduling
              features you see in Chronos.
            </li>
            <li>
              We do <strong>not</strong> transfer or sell Google user data to third parties for
              advertising, and we do <strong>not</strong> use it for advertising of any kind.
            </li>
            <li>
              We do <strong>not</strong> allow humans to read your Google user data unless (a) you
              give explicit consent for specific data, (b) it is necessary for security purposes
              (e.g., investigating abuse), (c) it is necessary to comply with applicable law, or
              (d) the data is aggregated and de-identified.
            </li>
            <li>
              We do <strong>not</strong> use Google user data to train generalized or third-party
              AI models. Where an assignment&rsquo;s text is sent to our AI sub-processors for
              difficulty grading, it is processed only to return a result to you and is not used
              to train their models.
            </li>
          </ul>
          <p>
            You can revoke Chronos&rsquo;s access to your Google account at any time in Settings →
            Connections, or via your{' '}
            <a href="https://myaccount.google.com/permissions">Google Account permissions</a>{' '}
            page.
          </p>
          <p>
            <strong>Business transfers.</strong> If Chronos is acquired, merges, or sells
            substantially all of its assets, your information may be transferred as part of that
            transaction. We will notify you (via in-app notice or email) before your data becomes
            subject to a different privacy policy.
          </p>
          <p>
            <strong>Legal disclosure.</strong> We will share data with law enforcement or in
            response to legal process (subpoena, court order) only when we believe in good faith
            that disclosure is legally required, and we will notify the affected user before
            disclosure unless prohibited by law or in a genuine emergency involving risk of harm
            to a minor.
          </p>

          <h2>9. Your rights</h2>
          <p>Regardless of where you live, you can at any time:</p>
          <ul>
            <li>See everything Chronos knows about you (Settings → Chronos&rsquo;s Brain).</li>
            <li>Disconnect any class platform (Settings → Connections).</li>
            <li>
              Sign out (Settings → Sign out) — your local credentials are wiped immediately.
            </li>
            <li>
              Correct inaccurate account information directly in Settings, or by emailing us.
            </li>
            <li>
              Request full account deletion by emailing{' '}
              <a href="mailto:privacy@chronos-app.com">
                <strong>privacy@chronos-app.com</strong>
              </a>
              . We will delete your data within 30 days of a verified request.
            </li>
            <li>
              Request a copy of your data in a portable, machine-readable format by emailing{' '}
              <a href="mailto:privacy@chronos-app.com">
                <strong>privacy@chronos-app.com</strong>
              </a>
              ; we will provide it within 30 days of a verified request.
            </li>
            <li>
              Withdraw consent for AI-based grading or OCR by disconnecting your class platforms
              and declining photo grading — Chronos will fall back to manual task and difficulty
              entry. (If a dedicated in-app AI toggle is not present in your version, email us and
              we will disable AI grading on your account.)
            </li>
          </ul>
          <p>
            If you used Sign in with Apple, you can also revoke access from your iPhone: Settings
            → Apple ID → Sign-In &amp; Security → Sign in with Apple → Chronos.
          </p>

          <h3>If you are a California resident (CCPA/CPRA)</h3>
          <p>
            You have the right to know what personal information we collect, to request deletion,
            to correct inaccurate information, and to opt out of the &ldquo;sale&rdquo; or
            &ldquo;sharing&rdquo; of personal information (as those terms are defined by
            California law).{' '}
            <strong>
              We do not sell or share personal information for cross-context behavioral
              advertising, so there is nothing to opt out of.
            </strong>{' '}
            We do not use automated decision-making that produces legal or similarly significant
            effects. We will not discriminate against you for exercising these rights.
          </p>

          <h3>
            If you are a resident of another U.S. state with a comprehensive privacy law (e.g.,
            Virginia, Colorado, Connecticut, Utah, Oregon)
          </h3>
          <p>
            You have substantially similar rights to access, correct, delete, and obtain a copy of
            your data, and to appeal a denied request by emailing{' '}
            <a href="mailto:privacy@chronos-app.com">
              <strong>privacy@chronos-app.com</strong>
            </a>{' '}
            with &ldquo;Privacy Appeal&rdquo; in the subject line.
          </p>

          <h2>10. Data retention</h2>
          <ul>
            <li>
              <strong>Active account data:</strong> kept while your account is active.
            </li>
            <li>
              <strong>After account deletion:</strong> removed within 30 days, except:
              <ul>
                <li>
                  Data we must retain to comply with law (e.g., tax/financial records related to a
                  subscription, which we do not currently hold beyond what
                  Apple/Google/RevenueCat retain as payment processors).
                </li>
                <li>
                  Backups, which age out and are overwritten on a rolling basis within 90 days.
                </li>
              </ul>
            </li>
            <li>
              <strong>Chat/copilot history:</strong> retained for as long as your account is
              active so the copilot has context; deleted on account deletion.
            </li>
            <li>
              <strong>Crash and diagnostic logs:</strong> retained for up to 90 days, then purged.
            </li>
            <li>
              <strong>Aggregate, de-identified analytics</strong> (e.g., &ldquo;average estimation
              error across all users&rdquo;) may be retained indefinitely because it cannot be
              linked back to an individual.
            </li>
          </ul>

          <h2>11. Security</h2>
          <p>
            We encrypt data in transit (TLS 1.2+) and at rest (Supabase Postgres + AES). OAuth and
            Canvas access tokens are encrypted column-side with keys held only by our backend, and
            are never exposed to the client app in plaintext. Access to production data is limited
            to engineers who need it, and is logged.
          </p>
          <p>
            No system is perfectly secure. If we experience a breach that compromises your
            personal information, we will notify affected users and, where legally required, the
            relevant state Attorney General or regulator, within the time required by applicable
            law (commonly as fast as 30–72 hours for COPPA-covered incidents, and per each
            state&rsquo;s breach-notification statute otherwise). We will describe what happened,
            what data was involved, and what steps we&rsquo;ve taken.
          </p>

          <h2>12. International use</h2>
          <p>
            Chronos is designed for U.S. high school students and our servers and sub-processors
            operate primarily in the United States. If you access Chronos from outside the U.S.,
            your data will be transferred to and processed in the U.S., where privacy laws may
            differ from those of your country. By using Chronos from outside the U.S., you consent
            to this transfer.
          </p>

          <h2>13. Changes to this policy</h2>
          <p>
            We will post any material changes here, update the &ldquo;Last updated&rdquo; date,
            and notify you via in-app banner before the change takes effect. If a change would
            allow us to use previously collected data in a materially different way, we will ask
            for renewed consent before applying it to data collected under the old policy.
          </p>

          <hr />

          <p>
            <strong>Questions, corrections, or deletion requests?</strong>{' '}
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a>
          </p>

          <p className="text-secondary" style={{ fontSize: 13, marginTop: 24 }}>
            This policy is intended to help satisfy Apple App Store Guideline 5.1.1, COPPA,
            CCPA/CPRA, and FERPA&rsquo;s school-official disclosure norms.{' '}
            <strong>It is not a substitute for review by a licensed attorney</strong>, and it does
            not by itself create a data-sharing agreement with any school or district — that
            requires a separate signed agreement.
          </p>
        </article>
      </main>

      <Footer />
    </div>
  );
}

function LegalNav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        background: 'rgba(10,17,24,0.85)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.25" stroke="var(--mist)" strokeWidth="1.25" />
            <line x1="9" y1="2" x2="9" y2="4.25" stroke="var(--mist)" strokeWidth="1.25" />
          </svg>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: 16,
              color: 'var(--text-primary)',
            }}
          >
            Chronos
          </span>
        </Link>
        <Link
          href="/"
          className="btn-cta rounded-full px-5 py-2.5 text-[13.5px]"
          style={{ textDecoration: 'none', color: 'var(--text-primary)' }}
        >
          Join Waitlist
        </Link>
      </div>
    </nav>
  );
}
