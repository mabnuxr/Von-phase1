/**
 * Apple-inspired typography system
 * Based on Apple's SF Pro font family and design principles
 */

/**
 * Font families
 * SF Pro is Apple's system font. We use -apple-system and BlinkMacSystemFont for automatic SF Pro on Apple devices
 */
export const fontFamily = {
  // SF Pro Display - for larger headings and display text
  display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',

  // SF Pro Text - for body text and smaller UI elements
  text: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',

  // SF Pro - general purpose (auto-switches between Display and Text based on size)
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro", "Helvetica Neue", Arial, sans-serif',

  // New York - Apple's serif font for editorial content
  serif: '"New York", "Times New Roman", Georgia, serif',

  // SF Mono - Apple's monospace font
  mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
} as const;

/**
 * Font weights
 * Apple uses precise font weights for SF Pro
 */
export const fontWeight = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800, // For extra emphasis (Apple style)
} as const;

/**
 * Font sizes with corresponding line heights
 * Based on Apple's typography scale with generous line heights
 */
export const fontSize = {
  xs: {
    size: '0.75rem', // 12px
    lineHeight: '1.33334', // 16px (tight for small text)
  },
  sm: {
    size: '0.875rem', // 14px
    lineHeight: '1.42858', // 20px
  },
  base: {
    size: '1.0625rem', // 17px (Apple's preferred body size)
    lineHeight: '1.47059', // 25px
  },
  lg: {
    size: '1.1875rem', // 19px
    lineHeight: '1.42106', // 27px
  },
  xl: {
    size: '1.3125rem', // 21px
    lineHeight: '1.38096', // 29px
  },
  '2xl': {
    size: '1.5rem', // 24px
    lineHeight: '1.33334', // 32px
  },
  '3xl': {
    size: '1.75rem', // 28px
    lineHeight: '1.28572', // 36px
  },
  '4xl': {
    size: '2rem', // 32px
    lineHeight: '1.25', // 40px
  },
  '5xl': {
    size: '2.5rem', // 40px
    lineHeight: '1.1', // 44px
  },
  '6xl': {
    size: '3rem', // 48px
    lineHeight: '1.08334', // 52px
  },
  '7xl': {
    size: '3.5rem', // 56px
    lineHeight: '1.07143', // 60px
  },
  '8xl': {
    size: '4.5rem', // 72px
    lineHeight: '1.05556', // 76px
  },
} as const;

/**
 * Heading styles (H1-H6)
 * Apple-style headings with SF Pro Display for larger sizes
 */
export const headingStyles = {
  h1: {
    fontSize: fontSize['6xl'].size,
    lineHeight: fontSize['6xl'].lineHeight,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.display,
    letterSpacing: '-0.015em', // Tight tracking for large text
  },
  h2: {
    fontSize: fontSize['5xl'].size,
    lineHeight: fontSize['5xl'].lineHeight,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.display,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: fontSize['4xl'].size,
    lineHeight: fontSize['4xl'].lineHeight,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.display,
    letterSpacing: '-0.01em',
  },
  h4: {
    fontSize: fontSize['2xl'].size,
    lineHeight: fontSize['2xl'].lineHeight,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.text,
  },
  h5: {
    fontSize: fontSize.xl.size,
    lineHeight: fontSize.xl.lineHeight,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.text,
  },
  h6: {
    fontSize: fontSize.lg.size,
    lineHeight: fontSize.lg.lineHeight,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.text,
  },
} as const;

/**
 * Text variant styles
 * Apple-style body text using SF Pro Text
 */
export const textStyles = {
  body: {
    fontSize: fontSize.base.size, // 17px - Apple's preferred body size
    lineHeight: fontSize.base.lineHeight,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily.text,
  },
  bodyLarge: {
    fontSize: fontSize.lg.size, // 19px
    lineHeight: fontSize.lg.lineHeight,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily.text,
  },
  bodySmall: {
    fontSize: fontSize.sm.size, // 14px
    lineHeight: fontSize.sm.lineHeight,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily.text,
  },
  caption: {
    fontSize: fontSize.xs.size, // 12px
    lineHeight: fontSize.xs.lineHeight,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily.text,
  },
  label: {
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.text,
  },
  labelLarge: {
    fontSize: fontSize.base.size,
    lineHeight: fontSize.base.lineHeight,
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.text,
  },
  // Apple often uses this for subheadlines
  subhead: {
    fontSize: fontSize.xl.size,
    lineHeight: fontSize.xl.lineHeight,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily.text,
  },
} as const;

export type FontFamily = typeof fontFamily;
export type FontWeight = typeof fontWeight;
export type FontSize = typeof fontSize;
export type HeadingStyles = typeof headingStyles;
export type TextStyles = typeof textStyles;
