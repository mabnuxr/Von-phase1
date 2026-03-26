import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { chartThemes, type ChartThemeId, type ChartThemePalette } from './chartTheme';
import { DashboardCustomizationContext } from './DashboardCustomizationContext';

// ── State shape ─────────────────────────────────────────────────

export interface DashboardCustomizationState {
  /** Active color theme id */
  colorTheme: ChartThemeId;
  /** Resolved palette for the active theme (null when 'default' — use backend colors) */
  palette: ChartThemePalette | null;
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

  // Sync internal state when the parent provides a new defaultColorTheme (e.g.
  // when the preview pane shows a different dashboard without unmounting).
  // Bypass the change-callback by pre-updating prevColorThemeRef so the effect
  // above treats this as a non-user-initiated change.
  const prevDefaultColorThemeRef = useRef(defaultColorTheme);
  useEffect(() => {
    if (prevDefaultColorThemeRef.current === defaultColorTheme) return;
    prevDefaultColorThemeRef.current = defaultColorTheme;
    prevColorThemeRef.current = defaultColorTheme;
    setColorTheme(defaultColorTheme);
  }, [defaultColorTheme]);

  const palette = useMemo(
    () => (colorTheme === 'default' ? null : chartThemes[colorTheme]),
    [colorTheme]
  );

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
