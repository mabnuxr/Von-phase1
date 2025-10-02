# Design System Documentation

## Overview

This document describes the newly refactored design component library with a comprehensive design token system and foundational components.

## Design Tokens

### Colors (`src/theme/colors.ts`)

A complete color palette with semantic naming:

- **Primary**: Blue color scale (50-900)
- **Secondary**: Slate/Gray color scale (50-900)
- **Neutral**: Gray color scale (50-900)
- **Success**: Green color scale (50-900)
- **Warning**: Orange color scale (50-900)
- **Error**: Red color scale (50-900)
- **Info**: Cyan color scale (50-900)
- **Common**: White, Black, Transparent

#### Semantic Colors

Pre-defined semantic mappings for common use cases:

```typescript
semanticColors.text.primary      // Main text color
semanticColors.text.secondary    // Secondary/muted text
semanticColors.text.disabled     // Disabled state text
semanticColors.text.inverse      // Light text on dark backgrounds

semanticColors.background.primary    // Main background
semanticColors.background.secondary  // Secondary background
semanticColors.background.disabled   // Disabled backgrounds

semanticColors.border.default  // Default border color
semanticColors.border.hover    // Hover state borders
semanticColors.border.focus    // Focus state borders
semanticColors.border.error    // Error state borders
```

### Spacing (`src/theme/spacing.ts`)

Based on a 4px baseline grid:

```typescript
spacing[0]  = 0
spacing[1]  = 4px
spacing[2]  = 8px
spacing[3]  = 12px
spacing[4]  = 16px
spacing[5]  = 20px
spacing[6]  = 24px
spacing[8]  = 32px
spacing[10] = 40px
// ... up to spacing[64] = 256px
```

### Typography (`src/theme/typography.ts`)

Comprehensive typography system:

- **Font Families**: Sans-serif system stack, Monospace stack
- **Font Weights**: Light (300) to Bold (700)
- **Font Sizes**: xs to 6xl with corresponding line heights
- **Heading Styles**: H1-H6 with predefined sizes and weights
- **Text Styles**: Body, Body Small, Caption, Label, Label Large

## Components

### Button (`src/components/Button`)

Versatile button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger'
- `size`: 'small' | 'medium' | 'large'
- `disabled`: boolean
- `fullWidth`: boolean
- `onClick`: click handler
- `type`: 'button' | 'submit' | 'reset'

**Example:**
```tsx
<Button variant="primary" size="medium" onClick={handleClick}>
  Click Me
</Button>
```

### Text (`src/components/Text`)

Typography component for body text with semantic variants.

**Props:**
- `variant`: 'body' | 'bodySmall' | 'caption' | 'label' | 'labelLarge'
- `color`: 'primary' | 'secondary' | 'disabled' | 'inverse' | 'success' | 'warning' | 'error' | 'info'
- `align`: 'left' | 'center' | 'right' | 'justify'
- `weight`: 'light' | 'regular' | 'medium' | 'semibold' | 'bold'
- `italic`: boolean
- `underline`: boolean
- `as`: 'p' | 'span' | 'div' | 'label'

**Example:**
```tsx
<Text variant="body" color="primary">
  This is body text with primary color.
</Text>
```

### Heading (`src/components/Heading`)

Semantic heading component (H1-H6) with visual style overrides.

**Props:**
- `level`: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' (semantic level)
- `visualLevel`: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' (visual override)
- `color`: 'primary' | 'secondary' | 'inverse'
- `align`: 'left' | 'center' | 'right'

**Example:**
```tsx
<Heading level="h1" color="primary">
  Page Title
</Heading>
```

### Input (`src/components/Input`)

Form input component with multiple states and validation.

**Props:**
- `type`: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
- `label`: string
- `placeholder`: string
- `disabled`: boolean
- `readOnly`: boolean
- `required`: boolean
- `error`: boolean
- `errorMessage`: string
- `helperText`: string
- `size`: 'small' | 'medium' | 'large'
- `fullWidth`: boolean

**Example:**
```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  required
  error={hasError}
  errorMessage="Please enter a valid email"
/>
```

### Container (`src/components/Container`)

Max-width container for content layout.

**Props:**
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
- `disablePadding`: boolean
- `center`: boolean

**Example:**
```tsx
<Container maxWidth="lg">
  <YourContent />
</Container>
```

### Stack (`src/components/Stack`)

Flexible layout component for vertical or horizontal stacking.

**Props:**
- `direction`: 'vertical' | 'horizontal'
- `gap`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `align`: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
- `justify`: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
- `wrap`: boolean
- `fullWidth`: boolean
- `as`: 'div' | 'section' | 'nav' | 'aside' | 'header' | 'footer'

**Example:**
```tsx
<Stack direction="vertical" gap="md" align="center">
  <Item1 />
  <Item2 />
  <Item3 />
</Stack>
```

### Box (`src/components/Box`)

Generic container with spacing and styling utilities.

**Props:**
- Spacing: `padding`, `paddingX`, `paddingY`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`
- Spacing: `margin`, `marginX`, `marginY`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`
- `backgroundColor`: string
- `borderRadius`: 'none' | 'sm' | 'md' | 'lg' | 'full'
- `border`: boolean
- `borderColor`: string
- `as`: 'div' | 'section' | 'article' | 'aside' | 'nav' | 'header' | 'footer' | 'main'

**Example:**
```tsx
<Box padding={4} backgroundColor={colors.primary[50]} borderRadius="md">
  <Content />
</Box>
```

## Usage

### Importing Components

```typescript
import { Button, Text, Heading, Input, Container, Stack, Box } from 'design-components';
```

### Importing Theme Tokens

```typescript
import { colors, spacing, fontFamily, theme } from 'design-components';
```

### Using Theme Tokens

```typescript
// Direct usage
const myStyle = {
  color: colors.primary[500],
  padding: spacing[4],
  fontFamily: fontFamily.sans,
};

// Using semantic colors
const textStyle = {
  color: semanticColors.text.primary,
  borderColor: semanticColors.border.focus,
};
```

## Development

### Running Storybook

```bash
npm run storybook
```

View all components and their variants at `http://localhost:6006`

### Running Tests

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

### Building

```bash
npm run build              # Build the library
npm run build-storybook    # Build storybook static site
```

## Migration Guide

If you were using the old components, here's how to migrate:

### Old Way (Hardcoded Colors)
```tsx
<button style={{ backgroundColor: '#2563eb' }}>Click</button>
```

### New Way (Design Tokens)
```tsx
<Button variant="primary">Click</Button>
```

## Accessibility

All components include proper ARIA attributes and keyboard navigation support:

- Buttons: `aria-label`, `aria-disabled`
- Inputs: `aria-label`, `aria-invalid`, `aria-required`
- Proper semantic HTML elements
- Focus management with visible focus indicators

## TypeScript Support

All components are fully typed with exported TypeScript interfaces:

```typescript
import type { ButtonProps, TextProps, HeadingProps } from 'design-components';
```
