// ---------------------------------------------------------------------------
// Aura color system — dual palettes (dark + light)
//
// The single source of truth for color in the app. Both palettes share the
// same shape so any component can swap between them by reading from
// ThemeContext.
// ---------------------------------------------------------------------------

export interface ThemeColors {
  background: {
    primary: string;
    elevated: string;
    surface: string;
    raised: string;
  };
  glass: {
    light: string;
    medium: string;
    accent: string;
  };
  accent: {
    blue: string;
    sky: string;
    violet: string;
    emerald: string;
    amber: string;
    coral: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  border: {
    subtle: string;
    glass: string;
    accent: string;
  };
  difficulty: Record<1 | 2 | 3 | 4 | 5, string>;
}

// ---------------------------------------------------------------------------
// DARK — near-black canvas, vibrant accent colors.
// These are the ORIGINAL values — do not replace with Mist/Steel desaturated.
// ---------------------------------------------------------------------------

export const darkColors: ThemeColors = {
  background: {
    primary:  '#0A1118',   // Dusk night. The canvas.
    elevated: '#0D1620',   // Tab bar, sheets
    surface:  '#111C26',   // Cards and inset lists
    raised:   '#1A2A36',   // Pressed rows, secondary buttons
  },

  glass: {
    light:  'rgba(168, 218, 220, 0.05)',
    medium: 'rgba(168, 218, 220, 0.08)',
    accent: 'rgba(69, 123, 157, 0.16)',
  },

  accent: {
    blue:    '#457B9D',    // Steel. Primary CTA, user bubbles
    sky:     '#A8DADC',    // Mist. Active tint, rail
    violet:  '#A8DADC',    // Mist (no purple in Dusk)
    emerald: '#7ECFA0',
    amber:   '#F4A261',
    coral:   '#E76F6F',
  },

  text: {
    primary:   '#EEF3F2',
    secondary: '#8FA3AD',
    tertiary:  '#6F848E',
    inverse:   '#0A1118',
  },

  border: {
    subtle: 'rgba(168, 218, 220, 0.08)',
    glass:  'rgba(168, 218, 220, 0.14)',
    accent: 'rgba(168, 218, 220, 0.30)',
  },

  difficulty: {
    1: '#7ECFA0',
    2: '#A8DADC',
    3: '#F4A261',
    4: '#EE8A68',
    5: '#E76F6F',
  },
};

// ---------------------------------------------------------------------------
// LIGHT — slate-tinted paper, same accent hues deepened for contrast.
//
// Accent colors are saturated slightly darker so they read clearly on the
// light background without feeling washed out.
// ---------------------------------------------------------------------------

export const lightColors: ThemeColors = {
  background: {
    primary:  '#F8FAFC',   // Slate-50 — soft paper
    elevated: '#FFFFFF',   // Pure white for modals, sheets
    surface:  '#F1F5F9',   // Slate-100 — cards
    raised:   '#E2E8F0',   // Slate-200 — pressed rows
  },

  glass: {
    light:  'rgba(15, 23, 42, 0.04)',
    medium: 'rgba(91, 138, 240, 0.06)',
    accent: 'rgba(91, 138, 240, 0.10)',
  },

  accent: {
    blue:    '#4A7CF5',    // Deepened blue for contrast on light
    sky:     '#38BDF8',    // Vivid sky
    violet:  '#8B5CF6',    // Deepened violet
    emerald: '#22C55E',    // Deeper emerald
    amber:   '#D97706',    // Burnt amber
    coral:   '#EF4444',    // Stronger coral
  },

  text: {
    primary:   '#0F172A',  // Slate-900 — ink
    secondary: '#64748B',  // Slate-500
    tertiary:  '#94A3B8',  // Slate-400
    inverse:   '#F8FAFC',  // Text on dark/accent backgrounds
  },

  border: {
    subtle: 'rgba(15, 23, 42, 0.06)',
    glass:  'rgba(15, 23, 42, 0.10)',
    accent: 'rgba(91, 138, 240, 0.2)',
  },

  difficulty: {
    1: '#22C55E',
    2: '#4ADE80',
    3: '#D97706',
    4: '#EA580C',
    5: '#EF4444',
  },
};

// ---------------------------------------------------------------------------
// Default export — dark palette for existing `import { colors }` sites.
// New code should use useTheme().colors which responds to mode switching.
// ---------------------------------------------------------------------------

export const colors = darkColors;
