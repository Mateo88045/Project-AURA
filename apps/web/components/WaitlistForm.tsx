'use client';

import { useState, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';

type State = 'idle' | 'submitting' | 'success' | 'error';

type Props = { align?: 'center' | 'left' };

const EASE = [0.22, 1, 0.36, 1] as const;

export default function WaitlistForm({ align = 'center' }: Props) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState('submitting');
    setError(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setState('error');
        return;
      }
      setState('success');
    } catch {
      setError('Network error. Try again?');
      setState('error');
    }
  }

  const alignClass = align === 'left' ? '' : 'mx-auto';

  return (
    <div className={`w-full max-w-[520px] ${alignClass}`}>
      <AnimatePresence mode="wait">
        {state === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="glass rounded-xl px-6 py-5 flex items-center gap-3"
          >
            <span
              className="inline-flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: '1px solid var(--mist)',
              }}
            >
              <Check size={14} strokeWidth={2.5} className="text-mist" />
            </span>
            <span className="text-[15px]" style={{ color: 'var(--text-primary)' }}>
              You&apos;re on the list. We&apos;ll be in touch before launch.
            </span>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
            onSubmit={onSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field flex-1 rounded-lg px-5 py-3.5 text-[15px]"
              disabled={state === 'submitting'}
            />
            <button
              type="submit"
              disabled={state === 'submitting'}
              className="btn-cta rounded-lg px-7 py-3.5 text-[15px] whitespace-nowrap"
            >
              {state === 'submitting' ? 'Joining…' : 'Join Waitlist'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      {error && state === 'error' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-[13px]"
          style={{ color: '#E76F6F' }}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
