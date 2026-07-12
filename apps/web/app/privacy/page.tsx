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
            Last updated: 2026-05-28
          </p>

          <p>
            Chronos (&ldquo;Chronos,&rdquo; the &ldquo;Service&rdquo;) is a study-scheduling
            application operated by <strong>Project Aura Studios</strong> (&ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a New Jersey company. This Privacy Policy
            describes the information we collect, how we use and share it, the choices you have,
            and the limited rights granted to you. By accessing or using Chronos, you consent to
            the practices described in this Policy.
          </p>
          <p>
            This Policy is incorporated by reference into our{' '}
            <Link href="/terms">Terms of Service</Link>. Capitalized terms not defined here have
            the meaning given in the Terms.
          </p>

          <hr />

          <h2>1. Who we are</h2>
          <p>
            Chronos is operated by <strong>Project Aura Studios</strong>, a New Jersey company.
            For privacy questions, contact{' '}
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a>. Project Aura
            Studios is the data controller for the personal information described in this Policy.
          </p>

          <h2>2. Consent</h2>
          <p>
            By creating an account, connecting a third-party platform, or otherwise using
            Chronos, you expressly consent to the collection, use, processing, transfer, and
            disclosure of your personal information as described in this Policy. If you are
            between 13 and 17 years old, you represent that a parent or legal guardian has
            reviewed this Policy and consented on your behalf. If you do not agree, you must not
            use the Service.
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
            <li>Assignments pulled from your connected Google Classroom or Canvas account.</li>
            <li>Fixed events you add (classes, sports, meals, sleep).</li>
            <li>Time you spend on tasks and your feedback on Chronos&rsquo;s estimates.</li>
          </ul>

          <h3>Onboarding answers</h3>
          <ul>
            <li>
              Your subjects, confidence per subject, extracurriculars, preferred study window,
              and bedtime guardrail. We use this to schedule your week.
            </li>
          </ul>

          <h3>Technical data</h3>
          <ul>
            <li>Device type, OS version, and app version (used to diagnose crashes).</li>
            <li>A push-notification token (so we can send you reminders).</li>
            <li>Approximate IP-derived region (from network requests; not stored long-term).</li>
          </ul>

          <h3>What we do NOT collect</h3>
          <ul>
            <li>We do not collect your precise location.</li>
            <li>
              We do not access your contacts, photos library, microphone, calendar, or health
              data.
            </li>
            <li>
              We do not use advertising identifiers (IDFA) or run any third-party advertising or
              analytics SDKs.
            </li>
          </ul>

          <h2>4. How we use your data</h2>
          <p>We use your data to:</p>
          <ol>
            <li>Operate and provide the Service — pull assignments, schedule your week, send reminders.</li>
            <li>
              Improve the Service — anonymized and aggregated metrics of &ldquo;estimated vs.
              actual&rdquo; time spent help us tune the engine.
            </li>
            <li>Respond to support requests and communicate with you about the Service.</li>
            <li>
              Detect, prevent, and respond to fraud, abuse, security incidents, or violations of
              our Terms.
            </li>
            <li>Comply with applicable law and legal process.</li>
          </ol>
          <p>
            We do <strong>not</strong> sell your personal information. We do <strong>not</strong>{' '}
            share it with advertisers. We do <strong>not</strong> use your data to train
            third-party AI models.
          </p>

          <h2>5. AI processing</h2>
          <p>
            When Chronos grades the difficulty of an assignment or you chat with the copilot, the
            relevant text is sent to one of our AI sub-processors (currently Google Gemini and
            Anthropic Claude). These providers process the data on our behalf under their
            respective data-processing agreements and <strong>do not</strong> use it to train
            their models.
          </p>
          <p>
            Photos you take of paper assignments are sent to Google Gemini Vision for OCR and
            discarded after the structured result is returned to your device. We do not retain
            your photographs on our servers.
          </p>
          <p>
            <strong>You acknowledge that AI outputs may be inaccurate, incomplete, or
            inappropriate.</strong> You assume all risk arising from your reliance on AI-generated
            schedules, estimates, or suggestions, and you remain responsible for your own
            academic decisions.
          </p>

          <h2>6. Who we share data with</h2>
          <p>
            We share data only with the processors and recipients listed below, each under a
            contract that restricts use to operating Chronos:
          </p>
          <div className="legal-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Processor</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Supabase (database, auth, storage)</td>
                  <td>Account storage, sync</td>
                </tr>
                <tr>
                  <td>Trigger.dev (background jobs)</td>
                  <td>Daily assignment pulls</td>
                </tr>
                <tr>
                  <td>Google (Classroom API, Gemini, Apple/Google sign-in)</td>
                  <td>Class data sync, AI grading, auth</td>
                </tr>
                <tr>
                  <td>Anthropic (Claude)</td>
                  <td>Conversational copilot</td>
                </tr>
                <tr>
                  <td>Expo / Apple Push Notification service</td>
                  <td>Push notifications</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            We may also share data: (a) in response to lawful requests by public authorities,
            including to meet national-security or law-enforcement requirements; (b) to enforce
            our Terms; (c) to protect the rights, property, or safety of Project Aura Studios,
            our users, or others; or (d) in connection with a merger, acquisition, financing, or
            sale of all or part of our business, in which case personal information may be
            transferred to the successor entity.
          </p>

          <h2>7. Third-party platforms</h2>
          <p>
            When you connect Google Classroom, Canvas, or any other third-party service, that
            connection is governed by the third party&rsquo;s own terms and privacy policy. We do
            not control, and are not responsible for, the privacy practices of those third
            parties. You may revoke any connection at any time via Settings → Connections.
          </p>

          <h2>8. Children&rsquo;s privacy (COPPA)</h2>
          <p>
            Chronos is intended for users aged <strong>13 and older</strong>. We do not knowingly
            collect personal information from anyone under 13. If we learn that we have collected
            personal information from a child under 13 without verified parental consent, we will
            delete that information promptly. Parents who believe a child under 13 has created
            an account may contact{' '}
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a>.
          </p>

          <h2>9. Your rights</h2>
          <p>Subject to applicable law, you may:</p>
          <ul>
            <li>See the personal information Chronos holds about you (Settings → Chronos&rsquo;s brain).</li>
            <li>Disconnect any class platform (Settings → Connections).</li>
            <li>
              Sign out (Settings → Sign out) — your local credentials are wiped immediately.
            </li>
            <li>
              Request full account deletion by emailing{' '}
              <a href="mailto:privacy@chronos-app.com">
                <strong>privacy@chronos-app.com</strong>
              </a>
              . We will delete your data within 30 days, except where retention is required by
              law or for legitimate fraud-prevention, security, or recordkeeping purposes.
            </li>
          </ul>
          <p>
            Residents of certain U.S. states (including California, Colorado, Virginia, and
            Connecticut) may have additional rights under state privacy law, including the right
            to access, correct, delete, or port their data, and to opt out of certain processing.
            To exercise these rights, contact us at the email above. We will verify your request
            before responding. We will not discriminate against you for exercising any of these
            rights.
          </p>
          <p>
            If you used Sign in with Apple, you can also revoke access from your iPhone: Settings
            → Apple ID → Sign-In &amp; Security → Sign in with Apple → Chronos.
          </p>

          <h2>10. Data retention</h2>
          <ul>
            <li>Active account data: kept while your account is active.</li>
            <li>
              After account deletion: removed within 30 days, except where law or legitimate
              business purposes (fraud, security, financial records, legal claims) require longer
              retention.
            </li>
            <li>Aggregate, anonymized analytics may be retained indefinitely.</li>
          </ul>

          <h2>11. International data transfers</h2>
          <p>
            Chronos operates in the United States, and our sub-processors may process your data
            in the U.S. or other jurisdictions. If you access the Service from outside the U.S.,
            you consent to the transfer, storage, and processing of your data in the U.S., which
            may have data-protection laws different from those of your country.
          </p>

          <h2>12. Security</h2>
          <p>
            We use commercially reasonable administrative, technical, and physical safeguards to
            protect your data, including TLS 1.2+ in transit and AES at rest. OAuth and Canvas
            access tokens are encrypted column-side with keys held only by our backend.
          </p>
          <p>
            <strong>
              No method of transmission or storage is perfectly secure, and we cannot guarantee
              the absolute security of your data.
            </strong>{' '}
            You provide your information at your own risk. We are not liable for unauthorized
            access to or alteration of any data outside of our reasonable control. If we
            experience a security incident that affects your personal information, we will
            notify you and applicable authorities as required by law.
          </p>

          <h2>13. Do Not Track</h2>
          <p>
            Chronos does not currently respond to &ldquo;Do Not Track&rdquo; browser signals.
          </p>

          <h2>14. Changes to this Policy</h2>
          <p>
            We may update this Policy from time to time. Material changes will be communicated
            via in-app banner, push notification, or email before they take effect. Continued use
            of the Service after the effective date of any change constitutes your acceptance of
            the updated Policy.
          </p>

          <h2>15. Contact</h2>
          <p>
            <strong>Project Aura Studios</strong>
            <br />
            Attn: Privacy
            <br />
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a>
            <br />
            <a href="https://chronos-app.com">chronos-app.com</a>
          </p>

          <hr />

          <p className="text-secondary" style={{ fontSize: 13, marginTop: 24 }}>
            This Policy is intended to satisfy Apple App Store Guideline 5.1.1 and applicable U.S.
            privacy laws including the California Consumer Privacy Act (CCPA/CPRA) and COPPA. It
            is provided for informational purposes and does not constitute legal advice. You
            should consult an attorney regarding your specific obligations.
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
