import type { Config } from 'tailwindcss';

// ---------------------------------------------------------------------------
// Tailwind tokens — mirror /packages/shared/theme.
//
// Anti-slop:
// - No violet, indigo, or 'AI purple' anywhere.
// - Background is Deep Ocean (#0A1118), not near-black.
// - Light bg is Cream (#F1FAEE), not clinical white.
// - Accent palette is Steel + Mist + warm difficulty stops.
// ---------------------------------------------------------------------------

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary': '#0A1118',   // Deep Ocean
        'bg-elevated': '#0F1820',
        'bg-surface': '#13212B',
        // Glass tints (Mist / Steel based)
        'glass-light': 'rgba(168, 218, 220, 0.06)',
        'glass-medium': 'rgba(168, 218, 220, 0.10)',
        'glass-accent': 'rgba(69, 123, 157, 0.14)',
        // Accents — Steel & Mist, never violet
        'accent-blue': '#457B9D',     // Steel
        'accent-sky': '#A8DADC',      // Mist
        'accent-violet': '#A8DADC',   // Mist (back-compat token, NOT violet)
        'accent-emerald': '#7ECFA0',
        'accent-amber': '#F4A261',
        'accent-coral': '#E76F6F',
        // Text
        'text-primary': '#F1FAEE',                    // Cream
        'text-secondary': 'rgba(241, 250, 238, 0.65)',
        'text-tertiary': 'rgba(241, 250, 238, 0.35)',
        'text-inverse': '#0A1118',
      },
      borderRadius: {
        sm: '8px',     // buttons, badges, chips
        md: '14px',    // containers, cards
        lg: '22px',    // hero cards
        xl: '22px',    // sheets / hero (alias)
      },
      fontSize: {
        'display-lg': ['34px', { lineHeight: '40px', letterSpacing: '-1.2px' }],
        'display-md': ['28px', { lineHeight: '34px', letterSpacing: '-0.8px' }],
        'title1': ['22px', { lineHeight: '28px', letterSpacing: '-0.4px' }],
        'title2': ['18px', { lineHeight: '24px', letterSpacing: '-0.2px' }],
        'headline': ['16px', { lineHeight: '22px', letterSpacing: '-0.1px' }],
        'body': ['15px', { lineHeight: '22px', letterSpacing: '0px' }],
        'callout': ['13px', { lineHeight: '18px', letterSpacing: '0.1px' }],
        'caption': ['11px', { lineHeight: '14px', letterSpacing: '0.8px' }],
        'micro': ['10px', { lineHeight: '12px', letterSpacing: '1.2px' }],
      },
      spacing: {
        // 28px screen padding — Aura's only horizontal padding value.
        'screen': '28px',
      },
    },
  },
  plugins: [],
} satisfies Config;
