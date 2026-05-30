import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  darkColors,
  lightColors,
  type ThemeColors,
} from '@chronos/shared/theme';

// ---------------------------------------------------------------------------
// Theme modes
//
// - 'light'  : always use the light palette
// - 'dark'   : always use the dark palette
// - 'auto'   : resolve by local time. 7:00 AM – 6:59 PM → light, else dark.
//              Re-resolves on AppState → active and on an internal timer so
//              the app flips as the day passes without a relaunch.
// ---------------------------------------------------------------------------

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ResolvedMode = 'light' | 'dark';

const LIGHT_START_HOUR = 7;  // 7:00 AM
const LIGHT_END_HOUR = 19;   // 7:00 PM (exclusive)

/**
 * Pure time-based resolution. Extracted so tests and the auto-mode tick can
 * both call it without touching state.
 */
export function resolveAutoMode(date: Date = new Date()): ResolvedMode {
  const h = date.getHours();
  return h >= LIGHT_START_HOUR && h < LIGHT_END_HOUR ? 'light' : 'dark';
}

/**
 * Resolve a user-facing mode selection into the concrete palette to render.
 */
export function resolveMode(mode: ThemeMode): ResolvedMode {
  if (mode === 'auto') return resolveAutoMode();
  return mode;
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  /** The user-selected mode (what to show in the settings picker). */
  mode: ThemeMode;
  /** The currently-rendered palette ('light' or 'dark'). */
  resolvedMode: ResolvedMode;
  /** The active color palette. */
  colors: ThemeColors;
  /** Change the selected mode. */
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ---------------------------------------------------------------------------
// In-memory mode persistence
//
// Holds the user's selection across re-renders and navigations within a
// single app session. Survives Fast Refresh but not full relaunches.
//
// TODO: persist across launches via @react-native-async-storage/async-storage
//       (not currently a dependency). Read on mount → setModeState, write on
//       every setMode call.
// ---------------------------------------------------------------------------

let cachedMode: ThemeMode = 'dark';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(cachedMode);
  const [autoResolved, setAutoResolved] = useState<ResolvedMode>(() =>
    resolveAutoMode(),
  );

  // Auto-mode refresh: re-evaluate time on AppState → active and every 5
  // minutes while foregrounded. Cheap — just reads the clock.
  useEffect(() => {
    if (mode !== 'auto') return;

    const tick = () => {
      const next = resolveAutoMode();
      setAutoResolved((prev) => (prev === next ? prev : next));
    };

    tick();
    const interval = setInterval(tick, 5 * 60 * 1000);
    const sub = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        if (status === 'active') tick();
      },
    );
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    cachedMode = next;
    setModeState(next);
  }, []);

  const resolvedMode: ResolvedMode = mode === 'auto' ? autoResolved : mode;
  const palette = resolvedMode === 'light' ? lightColors : darkColors;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      colors: palette,
      setMode,
    }),
    [mode, resolvedMode, palette, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}
