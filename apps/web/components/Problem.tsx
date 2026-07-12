import FadeUp from './FadeUp';

const POINTS = [
  {
    title: 'Assignments land at 9pm',
    body: 'Google Classroom and Canvas drip-feed homework all night. By the time you check, it’s already due tomorrow.',
  },
  {
    title: 'Every assignment looks the same size',
    body: 'A 5-question worksheet and a full essay both just say "due Friday." Nothing tells you which one actually needs three hours.',
  },
  {
    title: 'Your calendar doesn’t know about practice',
    body: 'Sports, clubs, and family dinner already fill your week. Homework has to fit around them — not the other way around.',
  },
];

export default function Problem() {
  return (
    <section className="section-y px-6">
      <div className="max-w-[1100px] mx-auto">
        <FadeUp>
          <div className="eyebrow">The Problem</div>
        </FadeUp>
        <FadeUp delay={0.1} blur>
          <p
            className="font-serif-i mt-7 max-w-[820px] text-[32px] sm:text-[44px]"
            style={{ lineHeight: 1.15, color: 'var(--text-primary)' }}
          >
            Every to-do app assumes you already know what to do and when.
            Homework doesn&apos;t work like that.
          </p>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="mt-6 text-[14px] text-secondary">
            — The assumption every planner app is built on. Chronos is built on the opposite.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div className="divider mt-16 sm:mt-20" />
        </FadeUp>

        <div
          className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x mt-12 gap-y-10 sm:gap-y-0"
          style={{ borderColor: 'var(--border)' }}
        >
          {POINTS.map((p, i) => (
            <FadeUp key={p.title} delay={0.4 + i * 0.12}>
              <div className="px-0 sm:px-8 first:pl-0">
                <div
                  className="font-serif-i text-mist text-[22px] sm:text-[26px]"
                  style={{ letterSpacing: '-0.01em', lineHeight: 1.2 }}
                >
                  {p.title}
                </div>
                <div className="mt-3 text-[14px] text-secondary max-w-[280px]">{p.body}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>

      <style>{`
        .sm\\:divide-x > * + * { border-left-width: 1px; border-color: var(--border); }
        @media (max-width: 639px) {
          .sm\\:divide-x > * + * { border-left-width: 0; }
        }
      `}</style>
    </section>
  );
}
