// /packages/shared/constants/typography.ts
// Font: SF Pro Display (iOS system font — use fontFamily: undefined on iOS)

export const Typography = {
  // Weights
  thin: '300' as const, // Greeting prefixes: "Hey,", "This"
  regular: '400' as const, // Body text, fixed event names
  medium: '500' as const, // Labels, timestamps, secondary info
  semibold: '600' as const, // AI task titles, CTA button text
  bold: '700' as const, // User's name, today's date, key words

  // Tracking (letterSpacing)
  tightXL: -1.2, // Large display text (≥32px)
  tight: -0.5, // Medium display (≥20px)
  normal: 0,
  wideSmall: 1.5, // Small uppercase labels
  wideXS: 2.5, // Tiny caps / tags
} as const;
