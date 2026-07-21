'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Brain, Shield, Wand2, Sparkles, LucideIcon } from 'lucide-react';
import FadeUp from './FadeUp';

const EASE = [0.22, 1, 0.36, 1] as const;

const FEATURES: { icon: LucideIcon; title: string; body: string; span: string }[] = [
  {
    icon: Brain,
    title: 'Pulls your assignments automatically',
    body: 'Chronos connects to Google Classroom and Canvas, so new homework enters your schedule the moment it’s posted — no manual entry.',
    span: 'md:col-span-3',
  },
  {
    icon: Shield,
    title: 'Grades the real difficulty',
    body: 'Not every assignment is the same size. Chronos estimates how long each one actually takes, so your night reflects reality.',
    span: 'md:col-span-2',
  },
  {
    icon: Wand2,
    title: 'Fits around your life',
    body: 'Classes, practice, sports, meals, sleep — Chronos schedules homework into the time that’s actually free.',
    span: 'md:col-span-2',
  },
  {
    icon: Sparkles,
    title: 'Re-plans every night',
    body: 'New assignments show up while you sleep. Chronos re-plans your week each night so you always start the day with a working schedule.',
    span: 'md:col-span-3',
  },
];

function FeatureCard({ feature, delay }: { feature: (typeof FEATURES)[number]; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, delay, ease: EASE }}
      whileHover={{ y: -4 }}
      className={`glass rounded-2xl p-7 sm:p-8 relative overflow-hidden group ${feature.span}`}
    >
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background:
            'radial-gradient(600px circle at 30% 0%, rgba(168,218,220,0.08), transparent 50%)',
          opacity: 0,
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
      />
      <motion.div
        className="inline-flex items-center justify-center rounded-lg relative z-10"
        style={{
          width: 40,
          height: 40,
          background: 'rgba(168,218,220,0.08)',
          border: '1px solid rgba(168,218,220,0.20)',
        }}
        whileHover={{
          background: 'rgba(168,218,220,0.14)',
          borderColor: 'rgba(168,218,220,0.40)',
          rotate: -4,
          scale: 1.05,
        }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <Icon size={20} strokeWidth={1.5} className="text-mist" />
      </motion.div>
      <h3
        className="mt-6 relative z-10"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: 19,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {feature.title}
      </h3>
      <p
        className="mt-3 text-[15px] text-secondary relative z-10"
        style={{ lineHeight: 1.65 }}
      >
        {feature.body}
      </p>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section className="section-y px-6">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="eyebrow">The System</div>
        </FadeUp>
        <FadeUp delay={0.1} blur>
          <h2
            className="font-serif-u mt-4 text-[40px] sm:text-[56px]"
            style={{ lineHeight: 1.05, color: 'var(--text-primary)' }}
          >
            Built to run your week, not just log it.
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-5 mt-14">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
