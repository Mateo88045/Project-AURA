'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import FadeUp from './FadeUp';

const EASE = [0.22, 1, 0.36, 1] as const;

type Cell = '✓' | '✗' | '~';

const ROWS: { label: string; chronos: Cell; google: Cell; reclaim: Cell; motion: Cell }[] = [
  { label: 'Pulls assignments from Classroom/Canvas automatically', chronos: '✓', google: '✗', reclaim: '✗', motion: '✗' },
  { label: 'Grades how hard each assignment actually is', chronos: '✓', google: '✗', reclaim: '✗', motion: '✗' },
  { label: 'Schedules around classes, practice, and sleep', chronos: '✓', google: '~', reclaim: '✗', motion: '✗' },
  { label: 'Re-plans automatically as new homework comes in', chronos: '✓', google: '✗', reclaim: '✗', motion: '✗' },
  { label: 'Snap a photo of a paper assignment to schedule it', chronos: '✓', google: '✗', reclaim: '✗', motion: '✗' },
  { label: 'Free to try', chronos: '✓', google: '✓', reclaim: '~', motion: '✗' },
];

function Mark({ value, highlight = false }: { value: Cell; highlight?: boolean }) {
  if (value === '✓')
    return (
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          display: 'inline-block',
          color: highlight ? 'var(--mist)' : 'var(--text-secondary)',
          fontSize: 18,
          fontWeight: 500,
        }}
      >
        ✓
      </motion.span>
    );
  if (value === '~')
    return (
      <span className="text-secondary text-[13px]" style={{ fontStyle: 'italic' }}>
        partial
      </span>
    );
  return <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>✗</span>;
}

export default function Comparison() {
  const tableRef = useRef<HTMLDivElement>(null);
  const inView = useInView(tableRef, { once: true, margin: '-80px' });

  return (
    <section className="section-y px-6">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="eyebrow">Vs. The Alternatives</div>
        </FadeUp>
        <FadeUp delay={0.1} blur>
          <h2
            className="font-serif-u mt-4 text-[40px] sm:text-[56px]"
            style={{ lineHeight: 1.05, color: 'var(--text-primary)' }}
          >
            A to-do list tells you what's due. Chronos tells you when.
          </h2>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div ref={tableRef} className="glass rounded-3xl p-4 sm:p-8 mt-12 overflow-x-auto">
            <table className="w-full" style={{ minWidth: 680, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th />
                  <th
                    className="text-center pb-5"
                    style={{
                      color: 'var(--mist)',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      borderLeft: '1px solid rgba(168,218,220,0.30)',
                      borderRight: '1px solid rgba(168,218,220,0.30)',
                      background: 'rgba(168,218,220,0.03)',
                      boxShadow: 'inset 0 0 30px -10px rgba(168,218,220,0.32)',
                    }}
                  >
                    <motion.span
                      initial={{ opacity: 0, y: -6 }}
                      animate={inView ? { opacity: 1, y: 0 } : undefined}
                      transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
                      style={{ display: 'inline-block' }}
                    >
                      Chronos
                    </motion.span>
                  </th>
                  {['Google Calendar alone', 'A to-do list app', 'A paper planner'].map((c, i) => (
                    <th
                      key={c}
                      className="text-center pb-5 text-secondary"
                      style={{ fontWeight: 500, fontSize: 14 }}
                    >
                      <motion.span
                        initial={{ opacity: 0, y: -6 }}
                        animate={inView ? { opacity: 1, y: 0 } : undefined}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: EASE }}
                        style={{ display: 'inline-block' }}
                      >
                        {c}
                      </motion.span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <motion.tr
                    key={row.label}
                    style={{ borderTop: '1px solid var(--border)' }}
                    initial={{ opacity: 0, x: -12 }}
                    animate={inView ? { opacity: 1, x: 0 } : undefined}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.07, ease: EASE }}
                  >
                    <td className="py-4 pr-4 text-[14.5px] text-secondary" style={{ minWidth: 280 }}>
                      {row.label}
                    </td>
                    <td
                      className="text-center py-4"
                      style={{
                        borderLeft: '1px solid rgba(168,218,220,0.20)',
                        borderRight: '1px solid rgba(168,218,220,0.20)',
                        background: 'rgba(168,218,220,0.03)',
                      }}
                    >
                      <Mark value={row.chronos} highlight />
                    </td>
                    <td className="text-center py-4">
                      <Mark value={row.google} />
                    </td>
                    <td className="text-center py-4">
                      <Mark value={row.reclaim} />
                    </td>
                    <td className="text-center py-4">
                      <Mark value={row.motion} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p
            className="font-serif-i text-[15px] text-secondary text-center mt-8 max-w-[640px] mx-auto"
            style={{ fontStyle: 'normal' }}
          >
            A planner only works if you keep updating it. Chronos updates itself — every
            night, automatically.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
