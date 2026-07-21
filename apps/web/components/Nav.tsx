'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollToWaitlist() {
    const el = document.getElementById('waitlist-hero');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 transition-colors"
      style={{
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
        background: scrolled ? 'rgba(10,17,24,0.85)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.25" stroke="var(--mist)" strokeWidth="1.25" />
            <line x1="9" y1="2" x2="9" y2="4.25" stroke="var(--mist)" strokeWidth="1.25" />
          </svg>
          <span
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16 }}
          >
            Chronos
          </span>
        </div>
        <button
          onClick={scrollToWaitlist}
          className="btn-cta rounded-full px-5 py-2.5 text-[13.5px] min-h-[44px] inline-flex items-center"
        >
          Join Waitlist
        </button>
      </div>
    </motion.nav>
  );
}
