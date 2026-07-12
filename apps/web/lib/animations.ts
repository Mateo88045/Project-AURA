// Skill-compliant animation tokens — from /animate skill golden rules.
// Use these in the /animate route to keep timing/easing disciplined.

export const EASE = {
  outQuint: [0.23, 1, 0.32, 1] as const,
  inOutCubic: [0.645, 0.045, 0.355, 1] as const,
  outCubic: [0.33, 1, 0.68, 1] as const,
};

export const DUR = {
  // Skill rule: 200–300ms sweet spot. Exits ~75% of enter.
  enter: 0.28,
  exit: 0.2,
  hover: 0.15,
  press: 0.1,
  // Reserved longer durations for hero-level moments only.
  hero: 0.5,
};

export const STAGGER = 0.08; // skill default

export const SPRING_SOFT = { type: 'spring' as const, stiffness: 260, damping: 30 };
export const SPRING_SNAPPY = { type: 'spring' as const, stiffness: 400, damping: 30 };
