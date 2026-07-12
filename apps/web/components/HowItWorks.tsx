'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import FadeUp from './FadeUp';

const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    n: 1,
    title: 'Connect Classroom or Canvas',
    body: 'Sign in once. Chronos pulls your assignments automatically from then on — no manual entry, no re-checking every class page.',
  },
  {
    n: 2,
    title: 'Add your fixed events',
    body: 'Classes, practice, sports, meals, sleep. Tell Chronos once what your week already looks like — it schedules homework around it.',
  },
  {
    n: 3,
    title: 'Get a working night, every night',
    body: 'Chronos grades each assignment and slots it into real free time. Re-plans automatically as new homework comes in.',
  },
];

function Step({ s, i }: { s: (typeof STEPS)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, delay: 0.15 + i * 0.12, ease: EASE }}
    >
      <div className="h-[110px] relative">
        <motion.span
          className="font-serif-i absolute"
          style={{
            fontSize: 132,
            color: 'var(--mist)',
            top: -8,
            left: 0,
            lineHeight: 1,
          }}
          initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
          animate={inView ? { opacity: 0.16, y: 0, filter: 'blur(0px)' } : undefined}
          transition={{ duration: 1.1, delay: 0.2 + i * 0.12, ease: EASE }}
        >
          {s.n}
        </motion.span>
        <motion.span
          className="eyebrow absolute"
          style={{ bottom: 4, left: 0, color: 'var(--mist)' }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.6, delay: 0.55 + i * 0.12 }}
        >
          Step {s.n}
        </motion.span>
      </div>
      <h3
        className="mt-2"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {s.title}
      </h3>
      <p className="mt-3 text-[15px] text-secondary max-w-[340px]" style={{ lineHeight: 1.65 }}>
        {s.body}
      </p>
    </motion.div>
  );
}

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section className="section-y px-6">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="eyebrow">How It Works</div>
        </FadeUp>
        <FadeUp delay={0.1} blur>
          <h2
            className="font-serif-u mt-4 text-[40px] sm:text-[56px]"
            style={{ lineHeight: 1.05, color: 'var(--text-primary)' }}
          >
            Three steps. Then it runs every night.
          </h2>
        </FadeUp>

        <div ref={containerRef} className="relative mt-16">
          {/* Connecting line on md+ */}
          <motion.div
            className="hidden md:block absolute pointer-events-none"
            style={{
              top: 30,
              left: '8%',
              right: '8%',
              height: 1,
              background:
                'linear-gradient(90deg, transparent, rgba(168,218,220,0.45), transparent)',
              transformOrigin: 'left',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={inView ? { scaleX: 1, opacity: 1 } : undefined}
            transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
            {STEPS.map((s, i) => (
              <Step key={s.n} s={s} i={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
