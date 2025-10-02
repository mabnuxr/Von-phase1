import React from 'react';
import { headingStyles, fontFamily, semanticColors } from '../../theme';

export interface HeadingProps {
  /**
   * Heading level (semantic and visual)
   * @default 'h2'
   */
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  /**
   * Visual style override (use different visual style than semantic level)
   */
  visualLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  /**
   * Text color
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'inverse';

  /**
   * Text alignment
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Heading content
   */
  children: React.ReactNode;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * HTML id attribute
   */
  id?: string;
}

/**
 * Heading component (H1-H6) with consistent typography using design tokens
 */
export const Heading: React.FC<HeadingProps> = ({
  level = 'h2',
  visualLevel,
  color = 'primary',
  align = 'left',
  children,
  className,
  id,
}) => {
  // Use visualLevel if provided, otherwise use semantic level
  const styleLevel = visualLevel || level;

  // Get base styles from heading level
  const levelStyle = headingStyles[styleLevel];

  // Color mapping
  const colorMap: Record<HeadingProps['color'] & string, string> = {
    primary: semanticColors.text.primary,
    secondary: semanticColors.text.secondary,
    inverse: semanticColors.text.inverse,
  };

  const styles: React.CSSProperties = {
    fontFamily: levelStyle.fontFamily || fontFamily.display, // Use Apple SF Pro Display
    fontSize: levelStyle.fontSize,
    lineHeight: levelStyle.lineHeight,
    fontWeight: levelStyle.fontWeight,
    letterSpacing:
      'letterSpacing' in levelStyle
        ? ((levelStyle as Record<string, unknown>).letterSpacing as string)
        : undefined, // Apple's tight tracking
    color: colorMap[color],
    textAlign: align,
    margin: 0,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  // Render the semantic HTML element
  const Component = level;

  return (
    <Component id={id} className={className} style={styles}>
      {children}
    </Component>
  );
};

export default Heading;
