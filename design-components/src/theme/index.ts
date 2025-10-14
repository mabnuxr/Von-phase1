/**
 * Design system theme
 * Central export for all design tokens
 *
 * @deprecated This theme system is being migrated to Tailwind CSS.
 * For new components, use Tailwind utility classes instead of importing from this file.
 *
 * Migration status (as of Oct 2024):
 * - ✅ Chat components (Chat, ChatHeader, ChatInput, ChatMessage, ChatEmptyState)
 * - ⏳ Pending: Avatar, Box, Button, Container, Dropdown, Header, Input, Menu, Stack, TabPill, Text, TopBar, etc.
 *
 * See: /design-components/src/index.css for Tailwind configuration
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
