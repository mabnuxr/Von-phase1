import { useState, useMemo, useCallback } from 'react';
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
}

export const DashboardCustomizationProvider: React.FC<DashboardCustomizationProviderProps> = ({
  children,
  defaultColorTheme = 'teal',
  defaultMode = 'preview',
}) => {
  const [colorTheme, setColorTheme] = useState<ChartThemeId>(defaultColorTheme);
  const [mode, setMode] = useState<'edit' | 'preview'>(defaultMode);

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
