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
    blue: string;      // primary action (Dusk: steel)
    sky: string;       // secondary accent (Dusk: mist)
    violet: string;    // legacy key, mapped to mist — no violet in Dusk
    emerald: string;
    amber: string;
    coral: string;
    steel: string;
    steelDeep: string; // active tab, strong steel text
    mist: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    warn: string;      // amber that passes contrast as text
    onAccent: string;  // text on steel fills
  };
  border: {
    subtle: string;
    glass: string;
    accent: string;
  };
  timeline: {
    homework: string;     // homework block fill
    homeworkText: string;
    hatch: string;        // stripe color for fixed events
    hatchBorder: string;
    nowLine: string;
    hairline: string;
  };
  difficulty: Record<1 | 2 | 3 | 4 | 5, string>;
}

// ---------------------------------------------------------------------------
// DUSK DARK — deep ink canvas, steel + mist accents.
// ---------------------------------------------------------------------------

export const darkColors: ThemeColors = {
  background: {
    primary:  '#0A1118',
    elevated: '#111B24',
    surface:  '#16232E',
  },

  glass: {
    light:  'rgba(238, 243, 242, 0.06)',
    medium: 'rgba(168, 218, 220, 0.08)',
    accent: 'rgba(111, 163, 199, 0.14)',
  },

  accent: {
    blue:      '#6FA3C7',
    sky:       '#A8DADC',
    violet:    '#A8DADC',
    emerald:   '#4CC38A',
    amber:     '#F4A261',
    coral:     '#E76F6F',
    steel:     '#6FA3C7',
    steelDeep: '#8FBCDB',
    mist:      '#A8DADC',
  },

  text: {
    primary:   '#EEF3F2',
    secondary: '#9DB0BA',
    tertiary:  '#7A8E9A',
    inverse:   '#0A1118',
    warn:      '#F4A261',
    onAccent:  '#0A1118',
  },

  border: {
    subtle: 'rgba(238, 243, 242, 0.07)',
    glass:  'rgba(238, 243, 242, 0.12)',
    accent: 'rgba(111, 163, 199, 0.35)',
  },

  timeline: {
    homework:     'rgba(168, 218, 220, 0.22)',
    homeworkText: '#D6EEEF',
    hatch:        'rgba(238, 243, 242, 0.10)',
    hatchBorder:  'rgba(238, 243, 242, 0.22)',
    nowLine:      '#E76F6F',
    hairline:     'rgba(238, 243, 242, 0.07)',
  },

  difficulty: {
    1: '#4CC38A',
    2: '#A8DADC',
    3: '#F4A261',
    4: '#EE8A5F',
    5: '#E76F6F',
  },
};

// ---------------------------------------------------------------------------
// DUSK LIGHT — honeydew paper, ink text, steel actions, mist blocks.
// ---------------------------------------------------------------------------

export const lightColors: ThemeColors = {
  background: {
    primary:  '#F1FAEE',
    elevated: '#FAFDF8',
    surface:  '#FFFFFF',
  },

  glass: {
    light:  'rgba(16, 32, 43, 0.04)',
    medium: 'rgba(69, 123, 157, 0.06)',
    accent: 'rgba(69, 123, 157, 0.10)',
  },

  accent: {
    blue:      '#457B9D',
    sky:       '#A8DADC',
    violet:    '#A8DADC',
    emerald:   '#3BA06E',
    amber:     '#F4A261',
    coral:     '#D05050',
    steel:     '#457B9D',
    steelDeep: '#2F5F7D',
    mist:      '#A8DADC',
  },

  text: {
    primary:   '#10202B',
    secondary: '#4F6370',
    tertiary:  '#627582',
    inverse:   '#FAFDF8',
    warn:      '#B4561A',
    onAccent:  '#FFFFFF',
  },

  border: {
    subtle: 'rgba(16, 32, 43, 0.07)',
    glass:  'rgba(16, 32, 43, 0.12)',
    accent: 'rgba(69, 123, 157, 0.28)',
  },

  timeline: {
    homework:     '#A8DADC',
    homeworkText: '#10202B',
    hatch:        'rgba(16, 32, 43, 0.10)',
    hatchBorder:  'rgba(16, 32, 43, 0.22)',
    nowLine:      '#E76F6F',
    hairline:     'rgba(16, 32, 43, 0.07)',
  },

  difficulty: {
    1: '#3BA06E',
    2: '#6FB7A0',
    3: '#F4A261',
    4: '#E5844F',
    5: '#D05050',
  },
};

// ---------------------------------------------------------------------------
// Default export — light palette for existing `import { colors }` sites.
// New code should use useTheme().colors which responds to mode switching.
// ---------------------------------------------------------------------------

export const colors = lightColors;
