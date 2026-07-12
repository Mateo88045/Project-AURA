'use client';

import { motion } from 'framer-motion';
import FadeUp from './FadeUp';
import WaitlistForm from './WaitlistForm';

export default function CTA() {
  return (
    <section className="section-y px-6 relative overflow-hidden">
      <motion.div
        className="bloom-mist"
        style={{
          width: 820,
          height: 820,
          top: '20%',
          left: '50%',
          x: '-50%',
          background:
            'radial-gradient(circle, rgba(168,218,220,0.18) 0%, rgba(168,218,220,0) 70%)',
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.7, 0.55] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="bloom-mist"
        style={{
          width: 620,
          height: 620,
          top: '40%',
          left: '50%',
          x: '-50%',
          background:
            'radial-gradient(circle, rgba(69,123,157,0.22) 0%, rgba(69,123,157,0) 70%)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.8, 0.55] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto text-center">
        <FadeUp>
          <div className="flex justify-center">
            <div className="eyebrow">The Invitation</div>
          </div>
        </FadeUp>
        <FadeUp delay={0.1} blur>
          <h2
            className="font-serif-i mx-auto text-[44px] sm:text-[68px] max-w-[820px] mt-4"
            style={{ lineHeight: 1.0, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}
          >
            Your calendar should do the homework. Now it can.
          </h2>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p
            className="mx-auto max-w-[560px] mt-6 text-secondary"
            style={{ fontWeight: 300, fontSize: 18, lineHeight: 1.55 }}
          >
            Join the waitlist for early access. Founding members get priority
            access and a discount at launch.
          </p>
        </FadeUp>
        <FadeUp delay={0.3}>
          <div className="mt-9 flex justify-center">
            <WaitlistForm />
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
