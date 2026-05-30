// ---------------------------------------------------------------------------
// Aura spacing & radius tokens
//
// Anti-slop rules enforced here:
// - screenPadding is 28 EVERYWHERE. Never 16, never 20.
// - cardPadding is 20 (Aura surface), not the 16-on-everything default.
// - radius scale matches the spec exactly: button 8, card 14, hero 22.
// - radius.full is reserved for the navigation pill (GlassTabBar) only.
//   Do not use it for buttons or chips — pills are banned outside the nav layer.
// ---------------------------------------------------------------------------

export const spacing = {
  // Layout
  screenPadding: 28,    // Horizontal screen padding. Always.
  cardPadding:   20,    // Standard surface inner padding (Aura: 20, not 16)
  sectionGap:    32,    // Space between major sections
  itemGap:       10,    // Space between siblings in a list

  // Base scale
  xs:  4,
  sm:  8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  /** Buttons, badges, tags, chips. */
  sm: 8,
  /** Containers, cards, modals, group rows. */
  md: 14,
  /** Hero cards, large surfaces. */
  lg: 22,
  /** Sheets and large hero surfaces (alias of lg). */
  xl: 22,
  /** Reserved for the navigation pill ONLY. Never use on buttons/chips. */
  full: 999,
} as const;
