'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FadeUp from './FadeUp';

const EASE = [0.22, 1, 0.36, 1] as const;

const ITEMS = [
  {
    q: 'When is Chronos launching?',
    a: 'We’re still in development — the app isn’t on the App Store yet. Everyone on the waitlist gets an email the moment early access opens.',
  },
  {
    q: 'Do I need to connect Google Classroom or Canvas?',
    a: 'That’s how Chronos gets your assignments — it connects to Google Classroom and/or Canvas, pulls what’s due, and schedules it around your classes, practice, and other commitments automatically. You can also add assignments manually or by photo. See our Privacy Policy for exactly what we access and why.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Your account is protected by row-level security so your schedule and assignments are isolated to you. We never sell your data or share it with advertisers. Full details, including how we handle school/education data, are in our Privacy Policy.',
  },
  {
    q: 'How is this different from a normal to-do list?',
    a: 'A to-do list tells you what’s due. Chronos decides when you’ll actually do it — grading how hard each assignment is, then finding real time for it around the rest of your week.',
  },
  {
    q: 'Is Chronos free?',
    a: 'Chronos offers a free trial, with a paid plan after that. Exact pricing will be confirmed closer to launch — waitlist members will be the first to know.',
  },
  {
    q: 'Who is Chronos for?',
    a: 'U.S. high schoolers (grades 9–12) who get assignments through Google Classroom or Canvas. Chronos is intended for users 13 and older — see our Privacy Policy for details.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section-y px-6">
      <div className="max-w-3xl mx-auto">
        <FadeUp>
          <div className="eyebrow">Questions</div>
        </FadeUp>
        <FadeUp delay={0.1} blur>
          <h2
            className="font-serif-u mt-4 text-[44px] sm:text-[64px]"
            style={{ lineHeight: 1.0, color: 'var(--text-primary)' }}
          >
            Answered.
          </h2>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="mt-12">
            {ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <motion.div
                  key={item.q}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.07, ease: EASE }}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full py-6 flex justify-between items-center text-left gap-6"
                  >
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: 17,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {item.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="text-mist"
                      style={{ fontSize: 22, lineHeight: 1, display: 'inline-block' }}
                    >
                      +
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p
                          className="pb-7 pl-5 pr-2 text-secondary"
                          style={{ fontSize: 15.5, lineHeight: 1.75, maxWidth: 680 }}
                        >
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
