/**
 * Design system theme
 * Central export for all design tokens
 */

import { colors as colorsImport, semanticColors as semanticColorsImport } from './colors';
import { spacing as spacingImport, componentSpacing as componentSpacingImport } from './spacing';
import {
  fontFamily as fontFamilyImport,
  fontWeight as fontWeightImport,
  fontSize as fontSizeImport,
  headingStyles as headingStylesImport,
  textStyles as textStylesImport,
} from './typography';

// Re-export all tokens
export { colors, semanticColors } from './colors';
export type { ColorPalette, SemanticColors } from './colors';

export { spacing, componentSpacing } from './spacing';
export type { Spacing, ComponentSpacing } from './spacing';

export { fontFamily, fontWeight, fontSize, headingStyles, textStyles } from './typography';
export type { FontFamily, FontWeight, FontSize, HeadingStyles, TextStyles } from './typography';

/**
 * Complete theme object
 */
export const theme = {
  colors: colorsImport,
  semanticColors: semanticColorsImport,
  spacing: spacingImport,
  componentSpacing: componentSpacingImport,
  fontFamily: fontFamilyImport,
  fontWeight: fontWeightImport,
  fontSize: fontSizeImport,
  headingStyles: headingStylesImport,
  textStyles: textStylesImport,
} as const;

export type Theme = typeof theme;
