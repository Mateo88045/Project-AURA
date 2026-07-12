import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service — Chronos',
  description: 'Chronos Terms of Service.',
};

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <LegalNav />

      <main className="px-6 pt-32 pb-20">
        <article className="max-w-3xl mx-auto legal-prose">
          <h1 className="font-serif-i" style={{ fontSize: 40, lineHeight: 1.1, marginBottom: 12 }}>
            Chronos Terms of Service
          </h1>
          <p className="text-secondary" style={{ fontStyle: 'italic', marginBottom: 32 }}>
            Effective date: 2026-05-28
          </p>

          <p>
            These Terms of Service (&ldquo;<strong>Terms</strong>&rdquo;) form a binding legal
            agreement between you and <strong>Project Aura Studios</strong>, a New Jersey company
            (&ldquo;<strong>Project Aura Studios</strong>,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo;), governing your access to and use of the
            Chronos mobile application, website, and related services (collectively, the
            &ldquo;<strong>Service</strong>&rdquo;).
          </p>
          <p>
            <strong>
              PLEASE READ THESE TERMS CAREFULLY. THEY CONTAIN A BINDING ARBITRATION AGREEMENT, A
              CLASS-ACTION WAIVER, LIMITATIONS ON OUR LIABILITY, AND YOUR ASSUMPTION OF ALL RISK
              ARISING FROM YOUR USE OF THE SERVICE. BY USING CHRONOS, YOU AGREE TO BE BOUND BY
              THESE TERMS.
            </strong>
          </p>
          <p>
            Operated by Project Aura Studios —{' '}
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a> —{' '}
            <a href="https://chronos-app.com">chronos-app.com</a>
          </p>

          <hr />

          <h2>1. Acceptance of Terms</h2>
          <p>
            By downloading, installing, accessing, or using the Service, you agree to these
            Terms, our <Link href="/privacy">Privacy Policy</Link>, and any additional
            guidelines, policies, or supplemental terms we publish. If you do not agree, do not
            access or use the Service. Your only remedy if you are dissatisfied with the Service
            or these Terms is to stop using the Service.
          </p>

          <h2>2. Eligibility &amp; Parental Consent</h2>
          <p>
            The Service is intended for users aged <strong>13 and older</strong>. Users under 13
            may not create accounts or use the Service. If you are between 13 and 17 years old,
            you represent and warrant that your parent or legal guardian has reviewed and agreed
            to these Terms on your behalf and consents to your use of the Service, and that your
            parent or legal guardian agrees to be bound by these Terms (including the arbitration
            agreement, class-action waiver, and liability limitations) as your legal
            representative.
          </p>
          <p>
            We do not knowingly collect data from children under 13. If we discover we have, we
            will delete the account immediately. Contact{' '}
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a> if you believe a
            child under 13 has created an account.
          </p>

          <h2>3. Account Registration &amp; Security</h2>
          <p>
            You must provide accurate, current, and complete information when creating an
            account and keep it updated. You are responsible for safeguarding your credentials
            and for all activity that occurs under your account, whether or not authorized by
            you. You agree to notify us immediately at{' '}
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a> of any actual or
            suspected unauthorized access. We are not liable for any loss or damage arising from
            your failure to safeguard your credentials.
          </p>

          <h2>4. What Chronos Does — AI Scheduling Disclosure &amp; Assumption of Risk</h2>
          <p>
            Chronos is an AI-powered study scheduler. Once you connect your accounts and complete
            onboarding, Chronos autonomously builds and adjusts your weekly study schedule —
            creating time blocks, setting task priorities, sending reminders, and otherwise
            taking automated action — without requiring your approval for each individual
            decision. You expressly authorize Chronos to take these actions on your behalf.
          </p>
          <p>
            <strong>You acknowledge, understand, and agree that:</strong>
          </p>
          <ul>
            <li>
              AI scheduling and grading decisions are probabilistic, may contain errors, and may
              produce inaccurate, incomplete, biased, or inappropriate output;
            </li>
            <li>
              the Service is <strong>not</strong> a substitute for your own judgment,
              calendaring, academic planning, or professional advice;
            </li>
            <li>
              you remain solely responsible for reviewing your schedule, verifying due dates,
              completing assignments, and meeting all academic, parental, and other obligations;
            </li>
            <li>
              <strong>
                you assume all risk arising from your use of, or reliance on, the Service,
                including any AI output, schedule, reminder, estimate, or recommendation it
                generates;
              </strong>{' '}
              and
            </li>
            <li>
              we are not liable for missed assignments, missed deadlines, lower grades, academic
              consequences, scheduling conflicts, data inaccuracies, delays, or any other
              consequence of your use of the Service.
            </li>
          </ul>

          <h2>5. Connected Platforms (Google Classroom, Canvas, and Others)</h2>
          <p>
            By connecting Google Classroom, Canvas, or any other third-party platform, you
            authorize Chronos to read your assignments, due dates, and course information from
            those platforms. Your use of those platforms is governed by the third party&rsquo;s
            own terms and privacy policy. We do not control, are not responsible for, and make
            no warranties regarding any third-party service, content, availability, accuracy, or
            data practices. You may disconnect any platform at any time via Settings →
            Connections. We are not liable for any loss, damage, or claim arising from a
            third-party platform&rsquo;s outage, error, change, or termination.
          </p>

          <h2>6. Acceptable Use</h2>
          <p>You agree not to, and not to attempt to:</p>
          <ul>
            <li>use the Service for any unlawful, harmful, fraudulent, or infringing purpose;</li>
            <li>reverse engineer, decompile, disassemble, or extract source code from the Service;</li>
            <li>use automated tools, bots, scrapers, or crawlers to access or interact with the Service;</li>
            <li>impersonate any person or entity or misrepresent your affiliation;</li>
            <li>
              gain unauthorized access to any account, system, network, or data associated with
              the Service;
            </li>
            <li>upload, transmit, or introduce malicious code, viruses, or harmful content;</li>
            <li>
              interfere with, disrupt, overburden, or degrade the Service or any related
              infrastructure;
            </li>
            <li>
              use the Service to harass, threaten, defame, or harm any person, or to violate any
              third party&rsquo;s rights;
            </li>
            <li>
              resell, sublicense, lease, or otherwise exploit the Service for commercial purposes
              not expressly authorized by us; or
            </li>
            <li>circumvent any technical or access-control measure.</li>
          </ul>
          <p>
            We reserve the right to investigate and take appropriate action against any violation,
            including suspending or terminating accounts and reporting conduct to law enforcement.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            The Service, including all software, source code, design, algorithms, models,
            content, trademarks, logos, and branding (the &ldquo;<strong>Chronos IP</strong>&rdquo;),
            is owned by Project Aura Studios or its licensors and is protected by U.S. and
            international intellectual-property and other laws. Subject to your compliance with
            these Terms, we grant you a limited, personal, non-exclusive, non-transferable,
            non-sublicensable, revocable license to access and use the Service for your
            personal, non-commercial use. All rights not expressly granted are reserved.
          </p>
          <p>
            You retain ownership of personal data you submit to Chronos (assignments, schedules,
            notes — &ldquo;<strong>Your Content</strong>&rdquo;). You grant Project Aura Studios
            a worldwide, royalty-free, sublicensable license to host, store, reproduce, modify,
            adapt, transmit, process, and display Your Content solely to provide, maintain,
            improve, and develop the Service, including for security, compliance, and
            anonymized-aggregate analytics purposes.
          </p>
          <p>
            If you submit feedback, comments, ideas, or suggestions (&ldquo;
            <strong>Feedback</strong>&rdquo;), you grant Project Aura Studios a perpetual,
            irrevocable, worldwide, royalty-free, fully paid-up, sublicensable, transferable
            license to use, reproduce, modify, distribute, and exploit the Feedback for any
            purpose, without obligation, credit, or compensation to you.
          </p>

          <h2>8. Subscriptions, Billing &amp; Refunds</h2>
          <p>
            Chronos offers a free tier and a paid Pro subscription. Paid subscriptions are
            processed and billed through the Apple App Store on a recurring basis (monthly or
            annual, as selected). Subscriptions automatically renew at the then-current price at
            the end of each billing period unless cancelled at least 24 hours before the renewal
            date. You may manage or cancel your subscription in your Apple ID settings. Except
            as required by Apple&rsquo;s policies or applicable law, all fees are
            <strong> non-refundable</strong>, including for partial periods, unused features, or
            account terminations for cause. We may change pricing, plan features, or
            subscription terms with notice; continued use after the effective date constitutes
            acceptance.
          </p>

          <h2>9. Privacy</h2>
          <p>
            Your use of the Service is governed by our{' '}
            <Link href="/privacy">Privacy Policy</Link>, which is incorporated by reference. We
            do <strong>not</strong> sell your personal information.
          </p>

          <h2>10. Beta &amp; Experimental Features</h2>
          <p>
            We may, from time to time, offer beta, preview, or experimental features
            (&ldquo;<strong>Beta Features</strong>&rdquo;). Beta Features are provided
            &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo;, may be unstable or unreliable,
            and may be modified or discontinued at any time without notice. Your use of Beta
            Features is at your sole risk.
          </p>

          <h2>11. No Professional Advice; No Reliance</h2>
          <p>
            The Service does not provide medical, mental-health, educational, academic,
            financial, legal, or other professional advice. Nothing in the Service should be
            relied upon as such. You should consult a qualified professional for any decision
            that warrants professional judgment. You agree not to rely on the Service for any
            decision affecting your health, safety, finances, or academic standing without
            independent verification.
          </p>

          <h2>12. Disclaimers</h2>
          <p>
            <strong>
              THE SERVICE, INCLUDING ALL CONTENT, FEATURES, AI OUTPUTS, AND THIRD-PARTY
              INTEGRATIONS, IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;,
              WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR
              STATUTORY, TO THE FULLEST EXTENT PERMITTED BY LAW.
            </strong>{' '}
            PROJECT AURA STUDIOS AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND
            LICENSORS (COLLECTIVELY, THE &ldquo;<strong>CHRONOS PARTIES</strong>&rdquo;) HEREBY
            DISCLAIM ALL WARRANTIES, INCLUDING WITHOUT LIMITATION IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY,
            QUIET ENJOYMENT, AND ANY WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF TRADE.
          </p>
          <p>
            THE CHRONOS PARTIES DO NOT WARRANT THAT: (a) THE SERVICE WILL MEET YOUR REQUIREMENTS;
            (b) THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE; (c) AI OUTPUTS,
            SCHEDULES, OR REMINDERS WILL BE ACCURATE, COMPLETE, OR RELIABLE; (d) DEFECTS WILL BE
            CORRECTED; OR (e) THE SERVICE OR ANY SERVER USED IS FREE OF VIRUSES OR HARMFUL
            COMPONENTS. <strong>USE OF THE SERVICE IS AT YOUR SOLE RISK.</strong>
          </p>

          <h2>13. Limitation of Liability</h2>
          <p>
            <strong>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL THE CHRONOS PARTIES BE
              LIABLE TO YOU FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR
              PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, ACADEMIC
              STANDING, GRADES, OPPORTUNITIES, OR OTHER INTANGIBLE LOSSES, WHETHER ARISING IN
              CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR OTHERWISE, EVEN IF ADVISED OF
              THE POSSIBILITY OF SUCH DAMAGES.
            </strong>
          </p>
          <p>
            <strong>
              IN NO EVENT WILL THE AGGREGATE LIABILITY OF THE CHRONOS PARTIES ARISING OUT OF OR
              RELATING TO THESE TERMS OR THE SERVICE EXCEED THE GREATER OF (i) THE AMOUNT YOU
              PAID PROJECT AURA STUDIOS IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING
              RISE TO THE CLAIM, OR (ii) ONE HUNDRED U.S. DOLLARS (US$100).
            </strong>
          </p>
          <p>
            The limitations in this Section apply to all claims, in the aggregate, by you and
            anyone claiming through you, and apply regardless of the failure of any limited
            remedy of its essential purpose. Some jurisdictions do not allow the exclusion or
            limitation of certain damages; in such jurisdictions, the Chronos Parties&rsquo;
            liability is limited to the maximum extent permitted by law.
          </p>

          <h2>14. Assumption of Risk</h2>
          <p>
            You expressly assume all risk arising from your access to or use of the Service,
            including but not limited to: AI errors; missed deadlines or assignments; incorrect
            scheduling, prioritization, or reminders; data loss or corruption; unauthorized
            access to your account caused by your own conduct; outages or errors of third-party
            platforms (including Google Classroom, Canvas, Apple, Google, Anthropic, Supabase,
            Trigger.dev, Expo); and any other consequence of use or non-use of the Service.
          </p>

          <h2>15. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless the Chronos Parties from and
            against any and all claims, demands, actions, liabilities, damages, losses, costs,
            and expenses (including reasonable attorneys&rsquo; fees and court costs) arising
            out of or relating to: (a) your access to or use of the Service; (b) Your Content;
            (c) your violation of these Terms; (d) your violation of any law or third-party
            right (including intellectual-property, privacy, or publicity rights); or (e) any
            misuse of your account. We reserve the right, at our own expense, to assume the
            exclusive defense and control of any matter otherwise subject to indemnification by
            you, in which event you agree to cooperate with our defense.
          </p>

          <h2>16. Termination &amp; Suspension</h2>
          <p>
            You may delete your account and terminate these Terms at any time via Settings →
            Delete Account, or by contacting{' '}
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a>. We may
            suspend, restrict, or terminate your access to all or part of the Service at any
            time, with or without notice, for any reason or no reason, including for any
            violation (or suspected violation) of these Terms, applicable law, or our policies.
          </p>
          <p>
            Upon termination, your license to use the Service ends immediately. Sections that by
            their nature should survive termination will survive, including Sections 4 (AI
            Assumption of Risk), 7 (Intellectual Property), 8 (Billing — for accrued amounts),
            9 (Privacy), 11–15 (No Reliance, Disclaimers, Limitation of Liability, Assumption of
            Risk, Indemnification), and 17–22 (Disputes, Governing Law, and General).
          </p>

          <h2>17. Force Majeure</h2>
          <p>
            We will not be liable for any failure or delay in performance to the extent caused
            by events or circumstances beyond our reasonable control, including acts of God,
            natural disasters, fire, flood, war, terrorism, civil unrest, pandemic, government
            action, labor disputes, internet or telecommunications failure, third-party service
            outages (including Apple, Google, Anthropic, Supabase, Trigger.dev, Expo, Canvas, or
            similar), cyberattacks, or any other force majeure event.
          </p>

          <h2>18. Dispute Resolution — Binding Arbitration &amp; Class-Action Waiver</h2>
          <p>
            <strong>Please read this Section carefully. It affects your legal rights.</strong>
          </p>
          <p>
            <strong>(a) Informal resolution.</strong> Before initiating arbitration, you agree to
            attempt to resolve any dispute, claim, or controversy arising out of or relating to
            these Terms or the Service (&ldquo;<strong>Dispute</strong>&rdquo;) informally by
            emailing{' '}
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a> with a written
            description and a proposed resolution. The parties shall negotiate in good faith for
            at least thirty (30) days before commencing arbitration.
          </p>
          <p>
            <strong>(b) Binding arbitration.</strong> All Disputes that are not resolved
            informally shall be resolved exclusively by final and binding individual arbitration
            administered by JAMS under its Comprehensive (or, where applicable, Streamlined)
            Arbitration Rules then in effect. The arbitration shall be conducted by a single
            arbitrator in New Jersey, or by telephone or video at your election. The arbitrator
            shall have exclusive authority to resolve all issues, including issues of
            arbitrability, the scope or enforceability of this agreement to arbitrate, and
            whether any claim is within its scope. Judgment on the award may be entered in any
            court of competent jurisdiction.
          </p>
          <p>
            <strong>(c) Class-action waiver.</strong>{' '}
            <strong>
              YOU AND PROJECT AURA STUDIOS AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER
              ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN
              ANY PURPORTED CLASS, COLLECTIVE, CONSOLIDATED, OR REPRESENTATIVE ACTION.
            </strong>{' '}
            The arbitrator may not consolidate more than one person&rsquo;s claims or preside
            over any form of representative or class proceeding. If this class-action waiver is
            found unenforceable, then the entirety of this Section 18 shall be null and void,
            and the Dispute shall proceed in court subject to Section 19 (Governing Law and
            Venue).
          </p>
          <p>
            <strong>(d) Exceptions.</strong> Either party may bring an individual action in
            small-claims court, and either party may seek injunctive or other equitable relief
            in court to prevent actual or threatened infringement, misappropriation, or
            violation of intellectual-property rights.
          </p>
          <p>
            <strong>(e) Opt-out.</strong> You may opt out of this arbitration agreement by
            sending written notice to{' '}
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a> within thirty
            (30) days of first accepting these Terms, including your name, account email, and a
            clear statement that you wish to opt out of arbitration. Opting out will not affect
            any other provision of these Terms.
          </p>
          <p>
            <strong>(f) Statute of limitations.</strong> Any Dispute must be filed within one
            (1) year after the cause of action arises; otherwise it is permanently barred, to
            the extent permitted by applicable law.
          </p>

          <h2>19. Governing Law &amp; Venue</h2>
          <p>
            These Terms and any Dispute are governed by the laws of the State of{' '}
            <strong>New Jersey</strong> and applicable U.S. federal law, without regard to its
            conflict-of-law principles. Subject to Section 18, the exclusive venue for any
            action permitted to be brought in court shall be the state and federal courts located
            in New Jersey, and you and Project Aura Studios each consent to personal jurisdiction
            in those courts and waive any objection based on inconvenient forum.
          </p>

          <h2>20. Changes to These Terms</h2>
          <p>
            We may update these Terms at any time. Material changes will be communicated via
            in-app notification, push, or email at least seven (7) days before they take
            effect. Continued use of the Service after the effective date constitutes your
            acceptance of the updated Terms. If you do not agree to the updated Terms, your sole
            remedy is to stop using the Service.
          </p>

          <h2>21. Apple App Store Terms</h2>
          <p>
            The following additional terms apply if you access the Service through an iOS device:
            (a) these Terms are between you and Project Aura Studios only, not with Apple Inc.
            (&ldquo;Apple&rdquo;); (b) Project Aura Studios, not Apple, is solely responsible for
            the Service and its content; (c) Apple has no obligation to provide maintenance or
            support for the Service; (d) in the event of any failure of the Service to conform to
            an applicable warranty, you may notify Apple, and Apple will refund the purchase
            price (if any); to the maximum extent permitted by law, Apple has no other warranty
            obligation whatsoever; (e) Apple is not responsible for addressing any claims by you
            or any third party relating to the Service; (f) Apple is not responsible for the
            investigation, defense, settlement, or discharge of any third-party intellectual-
            property claim; (g) you represent that you are not located in a country subject to a
            U.S.-government embargo or designated as &ldquo;terrorist-supporting,&rdquo; and that
            you are not on any U.S.-government list of prohibited or restricted parties; and (h)
            Apple and its subsidiaries are third-party beneficiaries of these Terms and, upon
            your acceptance, will have the right to enforce these Terms against you.
          </p>

          <h2>22. General</h2>
          <p>
            <strong>Entire agreement.</strong> These Terms, together with the Privacy Policy,
            constitute the entire agreement between you and Project Aura Studios regarding the
            Service and supersede all prior agreements.
          </p>
          <p>
            <strong>Severability.</strong> If any provision of these Terms is found
            unenforceable, that provision shall be enforced to the maximum extent permissible,
            and the remaining provisions shall remain in full force and effect.
          </p>
          <p>
            <strong>No waiver.</strong> Our failure to enforce any right or provision of these
            Terms is not a waiver of that right or provision.
          </p>
          <p>
            <strong>Assignment.</strong> You may not assign or transfer these Terms or your
            rights hereunder without our prior written consent. We may assign these Terms at any
            time without notice or consent.
          </p>
          <p>
            <strong>Notices.</strong> We may provide notices to you via the Service, push
            notification, or the email associated with your account. You consent to receive
            communications electronically. Notices to us must be sent to{' '}
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a>.
          </p>
          <p>
            <strong>Relationship.</strong> No agency, partnership, joint venture, or employment
            is created by these Terms.
          </p>
          <p>
            <strong>Export control.</strong> You agree to comply with all applicable export and
            re-export restrictions and regulations.
          </p>
          <p>
            <strong>Headings.</strong> Section headings are for convenience only and have no
            legal effect.
          </p>

          <h2>23. Contact</h2>
          <p>
            <strong>Project Aura Studios</strong>
            <br />
            State of incorporation: New Jersey
            <br />
            <a href="mailto:privacy@chronos-app.com">privacy@chronos-app.com</a>
            <br />
            <a href="https://chronos-app.com">chronos-app.com</a>
          </p>

          <hr />

          <p className="text-secondary" style={{ fontSize: 13, marginTop: 24 }}>
            These Terms are intended to satisfy Apple App Store Guidelines and applicable U.S.
            consumer-protection law. They are provided for informational purposes and do not
            constitute legal advice. You should consult an attorney regarding your specific
            obligations.
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
