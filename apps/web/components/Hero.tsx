'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import WaitlistForm from './WaitlistForm';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bloomY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const bloomY2 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-[92vh] flex items-center justify-center px-6 pt-28 sm:pt-32 pb-24 overflow-hidden"
    >
      <motion.div
        style={{ y: bloomY }}
        className="bloom-mist"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          style={{
            width: 900,
            height: 900,
            position: 'absolute',
            top: '-12%',
            left: '-18%',
            background:
              'radial-gradient(circle, rgba(168,218,220,0.18) 0%, rgba(168,218,220,0) 70%)',
          }}
        />
      </motion.div>
      <motion.div
        style={{ y: bloomY2 }}
        className="bloom-mist"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <div
          style={{
            width: 760,
            height: 760,
            position: 'absolute',
            top: '5%',
            right: '-28%',
            background:
              'radial-gradient(circle, rgba(69,123,157,0.22) 0%, rgba(69,123,157,0) 70%)',
          }}
        />
      </motion.div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, transparent 50%, var(--bg) 78%)',
        }}
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 w-full max-w-[780px] flex flex-col items-center text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
          className="eyebrow"
        >
          For high schoolers · Now in development
        </motion.div>

        <motion.h1
          aria-label="Stop doing your homework’s scheduling."
          className="font-serif-i mt-5 text-[52px] sm:text-[80px] md:text-[100px] leading-[0.95]"
          style={{ letterSpacing: '-0.04em', color: 'var(--text-primary)' }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
          }}
        >
          <span aria-hidden="true">
            {'Stop doing your homework’s scheduling.'.split(' ').map((word, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    transition: { duration: 0.9, ease: EASE },
                  },
                }}
                style={{ display: 'inline-block', marginRight: '0.22em' }}
              >
                {word}
              </motion.span>
            ))}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
          className="mt-6 sm:mt-7 max-w-[560px] text-secondary"
          style={{ fontWeight: 300, fontSize: 19, lineHeight: 1.55 }}
        >
          Chronos connects to Google Classroom and Canvas, grades how hard each
          assignment is, and builds it into your week automatically — around
          practice, sports, and sleep.
        </motion.p>

        <motion.div
          id="waitlist-hero"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8, ease: EASE }}
          className="mt-9 w-full flex justify-center"
        >
          <WaitlistForm />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 1.05, ease: EASE }}
          className="mt-5"
        >
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] text-muted2"
            style={{ border: '1px solid var(--border)', cursor: 'default', opacity: 0.7 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.55C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.5 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.02.07-.42 1.44-1.38 2.82zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Coming to the App Store
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 6, 0] }}
          transition={{
            opacity: { duration: 1, delay: 1.4 },
            y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 1.4 },
          }}
          className="mt-14 text-mist"
          style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}
        >
          ↓ scroll
        </motion.div>
      </motion.div>
    </section>
  );
}
