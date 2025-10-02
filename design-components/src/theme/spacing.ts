/**
 * Spacing scale for the design system
 * Based on a consistent 4px baseline grid
 */

export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
  40: '10rem', // 160px
  48: '12rem', // 192px
  56: '14rem', // 224px
  64: '16rem', // 256px
} as const;

/**
 * Component-specific spacing tokens
 */
export const componentSpacing = {
  button: {
    paddingX: spacing[4],
    paddingY: spacing[2],
    gap: spacing[2],
  },
  input: {
    paddingX: spacing[3],
    paddingY: spacing[2],
  },
  container: {
    paddingX: {
      mobile: spacing[4],
      tablet: spacing[6],
      desktop: spacing[8],
    },
  },
  stack: {
    gap: {
      xs: spacing[1],
      sm: spacing[2],
      md: spacing[4],
      lg: spacing[6],
      xl: spacing[8],
    },
  },
} as const;

export type Spacing = typeof spacing;
export type ComponentSpacing = typeof componentSpacing;
