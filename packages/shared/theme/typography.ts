// Typography tokens — font size, weight, and letter spacing only.
// Color is owned by the theme (ThemeColors.text.*) and applied at the call
// site. Never hardcode a color here; it would leak one palette into the other.

export const typography = {
  // Hero / splash headlines
  largeTitle: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1.5, lineHeight: 46 },

  // Screen-level titles
  displayLarge:  { fontSize: 34, fontWeight: '700' as const, letterSpacing: -1.2 },
  displayMedium: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.8 },

  // Section headers, day labels
  title1: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.4 },
  title2: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2 },

  // Task titles, card headers
  headline: { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.1 },

  // Body text, descriptions
  body:       { fontSize: 15, fontWeight: '400' as const, letterSpacing: 0 },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, letterSpacing: 0 },

  // Labels, metadata, timestamps
  callout: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.1 },

  // Uppercase section tags
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },

  // Tiny metadata labels
  micro: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;
