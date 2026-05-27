// /packages/shared/constants/colors.ts
// Aura color palette — "Atmospheric Minimalism"
// Never hardcode hex values in components — always import from here.

export const Colors = {
  // Backgrounds
  bgDark: '#0A1118', // Deep ocean — dark mode background
  bgLight: '#F1FAEE', // Cream — light mode background

  // Primary accents
  mist: '#A8DADC', // Soft accent, river line, AI task glow
  steel: '#457B9D', // CTA buttons, active nav states, bold accent

  // Semantic
  green: '#7ECFA0', // On track, easy difficulty (dark mode)
  greenLight: '#3BA06E', // On track, easy difficulty (light mode)
  amber: '#F4A261', // Moderate difficulty, context-switch transitions
  red: '#E76F6F', // Hard difficulty, deadline urgency (dark mode)
  redLight: '#D05050', // Hard difficulty, deadline urgency (light mode)

  // Text
  textPrimary: '#F1FAEE', // Primary text on dark bg
  textSecondary: '#8EAFC2', // Secondary/muted text

  // Utility
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',  // For shadows and camera overlays — not for UI backgrounds
} as const;

/** Maps difficulty level (1–5) to the appropriate color */
export function difficultyColor(level: 1 | 2 | 3 | 4 | 5): string {
  if (level <= 2) return Colors.green;
  if (level === 3) return Colors.amber;
  return Colors.red;
}
