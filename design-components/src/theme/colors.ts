/**
 * Apple-inspired color palette for the design system
 * Based on Apple's public website design system
 */

export const colors = {
  // Primary Apple blue colors
  primary: {
    50: '#e6f2ff',
    100: '#cce5ff',
    200: '#99ccff',
    300: '#66b3ff',
    400: '#3399ff',
    500: '#0071e3', // Apple's primary blue
    600: '#0066cc', // Apple's link blue
    700: '#0055aa',
    800: '#004488',
    900: '#003366',
  },

  // Apple gray scale
  secondary: {
    50: '#fbfbfd', // Apple's lightest background
    100: '#f5f5f7', // Apple's light gray background
    200: '#e8e8ed',
    300: '#d2d2d7',
    400: '#86868b', // Apple's tertiary text
    500: '#6e6e73', // Apple's secondary text
    600: '#515154',
    700: '#3a3a3c',
    800: '#1d1d1f', // Apple's primary text
    900: '#000000',
  },

  // Apple's neutral whites and grays
  neutral: {
    50: '#ffffff',
    100: '#fbfbfd',
    200: '#f5f5f7',
    300: '#e8e8ed',
    400: '#d2d2d7',
    500: '#86868b',
    600: '#6e6e73',
    700: '#515154',
    800: '#1d1d1f',
    900: '#000000',
  },

  // Success colors (Apple green)
  success: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#30d158', // Apple green
    600: '#2bc450',
    700: '#26a641',
    800: '#218838',
    900: '#1c6a2f',
  },

  // Warning colors (Apple orange)
  warning: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9500', // Apple orange
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
  },

  // Error/Danger colors (Apple red)
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#ff3b30', // Apple red
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },

  // Info colors (Apple teal/cyan)
  info: {
    50: '#e0f7fa',
    100: '#b2ebf2',
    200: '#80deea',
    300: '#4dd0e1',
    400: '#26c6da',
    500: '#00c7be', // Apple teal
    600: '#00acc1',
    700: '#0097a7',
    800: '#00838f',
    900: '#006064',
  },

  // Product accent colors (for variety)
  accent: {
    purple: '#bf5af2',
    pink: '#ff375f',
    indigo: '#5e5ce6',
    mint: '#00c7be',
    yellow: '#ffd60a',
  },

  // Common colors
  common: {
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  },
} as const;

/**
 * Semantic color mappings for common use cases
 * Following Apple's design principles
 */
export const semanticColors = {
  text: {
    primary: '#1d1d1f', // Apple's primary text
    secondary: '#6e6e73', // Apple's secondary text
    tertiary: '#86868b', // Apple's tertiary text
    disabled: '#d2d2d7',
    inverse: colors.common.white,
    link: '#06c', // Apple's link color
    linkHover: '#0071e3', // Apple's link hover
  },
  background: {
    primary: colors.common.white,
    secondary: '#f5f5f7', // Apple's light gray
    elevated: '#fbfbfd', // Apple's elevated surface
    disabled: '#e8e8ed',
    inverse: '#1d1d1f',
  },
  border: {
    default: '#d2d2d7',
    hover: '#86868b',
    focus: '#0071e3', // Apple blue
    error: colors.error[500],
  },
  surface: {
    white: '#ffffff',
    lightGray: '#f5f5f7',
    veryLightGray: '#fbfbfd',
    nearBlack: '#1d1d1f',
  },
} as const;

export type ColorPalette = typeof colors;
export type SemanticColors = typeof semanticColors;
