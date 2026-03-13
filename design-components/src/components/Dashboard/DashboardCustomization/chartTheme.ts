/**
 * Dashboard color theme system.
 *
 * Provides hand-crafted palettes that widgets consume via the
 * DashboardCustomization context. Each palette supplies:
 * - primary accent color (KPI arrows, progress bars)
 * - ordered chart series colors
 * - hatch pattern pairs for bar/column fills
 * - dot pattern pairs for donut fills
 */

export type ChartThemeId = 'teal' | 'purple' | 'orange' | 'blue' | 'multi';

export interface ChartThemePalette {
  id: ChartThemeId;
  label: string;
  /** Preview swatch color for selector UI */
  swatch: string;
  /** Primary accent — KPI arrows, progress bars, line colors */
  primary: string;
  /** Ordered shades for chart series */
  chartColors: string[];
  /** [lightBase, darkStroke] pairs for bar/column hatching */
  hatchPairs: [string, string][];
  /** [darkBase, lightDot, borderColor] triples for donut dot patterns */
  dotPairs: [string, string, string][];
}

// ── Palettes ──────────────────────────────────────────────────────

const tealPalette: ChartThemePalette = {
  id: 'teal',
  label: 'Teal',
  swatch: '#29a395',
  primary: '#29a395',
  chartColors: ['#29a395', '#6ed8c8', '#1e857c', '#a4eadc', '#1c6962'],
  hatchPairs: [
    ['#b4ede2', '#6ec5b8'],
    ['#c5f0e8', '#7ecfc2'],
    ['#a0ddd0', '#5eb8aa'],
    ['#d2f4ee', '#8ed9cc'],
    ['#b8e8de', '#6ec5b8'],
  ],
  dotPairs: [
    ['#1e857c', 'rgba(164,234,220,0.35)', '#176b64'],
    ['#29a395', 'rgba(180,237,226,0.35)', '#1e857c'],
    ['#1c6962', 'rgba(142,217,204,0.35)', '#15534d'],
    ['#40bfae', 'rgba(210,244,238,0.35)', '#2e9a8d'],
    ['#29a395', 'rgba(197,240,232,0.35)', '#1e857c'],
    ['#1e857c', 'rgba(184,232,222,0.35)', '#176b64'],
  ],
};

const purplePalette: ChartThemePalette = {
  id: 'purple',
  label: 'Purple',
  swatch: '#7b68af',
  primary: '#7b68af',
  chartColors: ['#7b68af', '#b8a6da', '#5d4b8e', '#d4c7eb', '#493b74'],
  hatchPairs: [
    ['#ddd3ef', '#a392ca'],
    ['#e6dff0', '#afa1d1'],
    ['#cfc1e5', '#9382bd'],
    ['#ece8f4', '#baafd9'],
    ['#d8cfeb', '#a392ca'],
  ],
  dotPairs: [
    ['#5d4b8e', 'rgba(212,199,235,0.35)', '#493b74'],
    ['#7b68af', 'rgba(221,211,239,0.35)', '#5d4b8e'],
    ['#493b74', 'rgba(196,181,221,0.35)', '#392f5d'],
    ['#9986c6', 'rgba(236,232,244,0.35)', '#7b68af'],
    ['#7b68af', 'rgba(226,219,241,0.35)', '#5d4b8e'],
    ['#5d4b8e', 'rgba(216,207,235,0.35)', '#493b74'],
  ],
};

const orangePalette: ChartThemePalette = {
  id: 'orange',
  label: 'Orange',
  swatch: '#c88546',
  primary: '#c88546',
  chartColors: ['#c88546', '#e3b885', '#a36a31', '#f0d5b2', '#895827'],
  hatchPairs: [
    ['#f3dfc7', '#d7a875'],
    ['#f6e8d3', '#ddb485'],
    ['#edd2b2', '#cb9a65'],
    ['#f9eedf', '#e2be96'],
    ['#f1dcc3', '#d7a875'],
  ],
  dotPairs: [
    ['#a36a31', 'rgba(240,213,178,0.35)', '#895827'],
    ['#c88546', 'rgba(243,223,199,0.35)', '#a36a31'],
    ['#895827', 'rgba(230,200,166,0.35)', '#70481e'],
    ['#d7a067', 'rgba(249,238,223,0.35)', '#bb8a4f'],
    ['#c88546', 'rgba(246,232,211,0.35)', '#a36a31'],
    ['#a36a31', 'rgba(241,220,195,0.35)', '#895827'],
  ],
};

const bluePalette: ChartThemePalette = {
  id: 'blue',
  label: 'Blue',
  swatch: '#578ab0',
  primary: '#578ab0',
  chartColors: ['#578ab0', '#90bfda', '#406a8e', '#bbd8eb', '#345874'],
  hatchPairs: [
    ['#c7dce9', '#80b1cc'],
    ['#d3e4ef', '#8ebdd2'],
    ['#b7d0e1', '#70a3be'],
    ['#dfecf5', '#9ec9da'],
    ['#cbe0eb', '#80b1cc'],
  ],
  dotPairs: [
    ['#406a8e', 'rgba(187,216,235,0.35)', '#345874'],
    ['#578ab0', 'rgba(199,220,233,0.35)', '#406a8e'],
    ['#345874', 'rgba(170,204,226,0.35)', '#284862'],
    ['#72a4c7', 'rgba(223,236,245,0.35)', '#578ab0'],
    ['#578ab0', 'rgba(211,228,239,0.35)', '#406a8e'],
    ['#406a8e', 'rgba(203,224,235,0.35)', '#345874'],
  ],
};

const multiPalette: ChartThemePalette = {
  id: 'multi',
  label: 'Multi',
  swatch: 'multi',
  primary: orangePalette.primary,
  chartColors: bluePalette.chartColors,
  hatchPairs: tealPalette.hatchPairs,
  dotPairs: purplePalette.dotPairs,
};

// ── Registry ──────────────────────────────────────────────────────

export const chartThemes: Record<ChartThemeId, ChartThemePalette> = {
  teal: tealPalette,
  purple: purplePalette,
  orange: orangePalette,
  blue: bluePalette,
  multi: multiPalette,
};

export const chartThemeIds: ChartThemeId[] = ['teal', 'purple', 'orange', 'blue', 'multi'];

/** Swatch colors for the multi-theme preview (4 quadrants) */
export const multiSwatchColors = [
  tealPalette.swatch,
  purplePalette.swatch,
  orangePalette.swatch,
  bluePalette.swatch,
];
