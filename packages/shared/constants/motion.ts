// /packages/shared/constants/motion.ts
// Spring animation configs for Reanimated 3
// All positional/scale/rotation animations MUST use withSpring with one of these.
// withTiming is reserved exclusively for opacity and color transitions.

import type { WithSpringConfig } from 'react-native-reanimated';

export const Springs = {
  /** Buttons, cards, sheets — natural deceleration */
  gentle: { damping: 18, stiffness: 180, mass: 1 } satisfies WithSpringConfig,

  /** Toggles, chips, dots — playful overshoot */
  bouncy: { damping: 12, stiffness: 220, mass: 0.9 } satisfies WithSpringConfig,

  /** Hero transitions, large sheets — slow settle */
  smooth: { damping: 22, stiffness: 140, mass: 1.1 } satisfies WithSpringConfig,

  /** Dismissals — fast exit, minimal bounce */
  exit: { damping: 28, stiffness: 200, mass: 1 } satisfies WithSpringConfig,
} as const;

/** Spring configs for gesture-driven interactions (pan/swipe/drag) */
export const GestureSprings = {
  /** Snap-back after partial swipe — fast and crisp */
  snap:    { damping: 40, stiffness: 400, mass: 1 } satisfies WithSpringConfig,
  /** Sheet drag-to-dismiss — smooth exit with minimal bounce */
  dismiss: { damping: 28, stiffness: 200, mass: 1 } satisfies WithSpringConfig,
} as const;

/** Stagger delay between child animations on screen mount (ms) */
export const STAGGER_DELAY = 40;

/** Standard opacity transition duration (ms) — used with withTiming */
export const OPACITY_DURATION = 250;

/** Maximum animation duration before it's considered a UX violation (ms) */
export const MAX_ANIMATION_MS = 600;
