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
    primary:  '#07090F',   // Near-black with blue undertone. The canvas.
    elevated: '#0D1117',   // Lifted surfaces — modals, sheets
    surface:  '#111827',   // Cards that sit above the background
  },

  glass: {
    light:  'rgba(255, 255, 255, 0.06)',
    medium: 'rgba(100, 149, 237, 0.08)',
    accent: 'rgba(91, 138, 240, 0.10)',
  },

  accent: {
    blue:    '#5B8AF0',    // Primary CTA, active states, AI blocks
    sky:     '#7ECDE8',    // Secondary accent, river line
    violet:  '#A78BFA',    // AI-scheduled tasks, copilot bubbles
    emerald: '#34D399',    // On track, easy difficulty, approved
    amber:   '#F59E0B',    // Moderate difficulty, warnings
    coral:   '#F87171',    // Hard difficulty, deadline urgency
  },

  text: {
    primary:   '#F1F5F9',  // Main readable text
    secondary: '#94A3B8',  // Labels, timestamps, secondary info
    tertiary:  '#475569',  // Placeholders, disabled, ghost text
    inverse:   '#07090F',  // Text on light/accent backgrounds
  },

  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    glass:  'rgba(255, 255, 255, 0.12)',
    accent: 'rgba(91, 138, 240, 0.3)',
  },

  difficulty: {
    1: '#34D399',
    2: '#6EE7B7',
    3: '#F59E0B',
    4: '#FB923C',
    5: '#F87171',
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
