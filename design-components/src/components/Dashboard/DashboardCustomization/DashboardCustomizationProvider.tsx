import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { chartThemes, type ChartThemeId, type ChartThemePalette } from './chartTheme';
import { DashboardCustomizationContext } from './DashboardCustomizationContext';

// ── State shape ─────────────────────────────────────────────────

export interface DashboardCustomizationState {
  /** Active color theme id */
  colorTheme: ChartThemeId;
  /** Resolved palette for the active theme */
  palette: ChartThemePalette;
  /** Update the color theme */
  setColorTheme: (theme: ChartThemeId) => void;
  /** Dashboard mode */
  mode: 'edit' | 'preview';
  /** Update the mode */
  setMode: (mode: 'edit' | 'preview') => void;
}

// ── Provider ────────────────────────────────────────────────────

export interface DashboardCustomizationProviderProps {
  children: React.ReactNode;
  /** Initial color theme (default: 'teal') */
  defaultColorTheme?: ChartThemeId;
  /** Initial mode (default: 'preview') */
  defaultMode?: 'edit' | 'preview';
  /** Called when the user changes the color theme (not on initial mount) */
  onColorThemeChange?: (themeId: ChartThemeId) => void;
}

export const DashboardCustomizationProvider: React.FC<DashboardCustomizationProviderProps> = ({
  children,
  defaultColorTheme = 'teal',
  defaultMode = 'preview',
  onColorThemeChange,
}) => {
  const [colorTheme, setColorTheme] = useState<ChartThemeId>(defaultColorTheme);
  const [mode, setMode] = useState<'edit' | 'preview'>(defaultMode);

  // Fire callback on user-initiated color changes (skip initial mount).
  // Use a ref for the callback to avoid re-triggering the effect when the
  // parent re-renders with a new function reference (e.g. after query invalidation).
  const onChangeRef = useRef(onColorThemeChange);
  onChangeRef.current = onColorThemeChange;

  const prevColorThemeRef = useRef(colorTheme);
  useEffect(() => {
    if (prevColorThemeRef.current === colorTheme) return;
    prevColorThemeRef.current = colorTheme;
    onChangeRef.current?.(colorTheme);
  }, [colorTheme]);

  const palette = useMemo(() => chartThemes[colorTheme], [colorTheme]);

  const stableSetColorTheme = useCallback((t: ChartThemeId) => setColorTheme(t), []);
  const stableSetMode = useCallback((m: 'edit' | 'preview') => setMode(m), []);

  const value = useMemo<DashboardCustomizationState>(
    () => ({
      colorTheme,
      palette,
      setColorTheme: stableSetColorTheme,
      mode,
      setMode: stableSetMode,
    }),
    [colorTheme, palette, stableSetColorTheme, mode, stableSetMode]
  );

  return (
    <DashboardCustomizationContext.Provider value={value}>
      {children}
    </DashboardCustomizationContext.Provider>
  );
};
