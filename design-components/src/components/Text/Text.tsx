import React from 'react';
import { textStyles, fontFamily, semanticColors } from '../../theme';

export interface TextProps {
  /**
   * Text variant style
   * @default 'body'
   */
  variant?: 'body' | 'bodySmall' | 'caption' | 'label' | 'labelLarge';

  /**
   * Text color
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'disabled' | 'inverse' | 'success' | 'warning' | 'error' | 'info';

  /**
   * Text alignment
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right' | 'justify';

  /**
   * Font weight override
   */
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

  /**
   * Whether text should be italic
   * @default false
   */
  italic?: boolean;

  /**
   * Whether text should be underlined
   * @default false
   */
  underline?: boolean;

  /**
   * HTML element to render
   * @default 'p'
   */
  as?: 'p' | 'span' | 'div' | 'label';

  /**
   * Text content
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
 * Text component with consistent typography using design tokens
 */
export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  align = 'left',
  weight,
  italic = false,
  underline = false,
  as: Component = 'p',
  children,
  className,
  id,
}) => {
  // Get base styles from variant
  const variantStyle = textStyles[variant];

  // Color mapping - Apple colors
  const colorMap: Record<TextProps['color'] & string, string> = {
    primary: semanticColors.text.primary, // #1d1d1f
    secondary: semanticColors.text.secondary, // #6e6e73
    disabled: semanticColors.text.disabled, // #d2d2d7
    inverse: semanticColors.text.inverse,
    success: '#30d158', // Apple green
    warning: '#ff9500', // Apple orange
    error: '#ff3b30', // Apple red
    info: '#00c7be', // Apple teal
  };

  // Weight mapping
  const weightMap: Record<string, number> = {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  };

  const styles: React.CSSProperties = {
    fontFamily: variantStyle.fontFamily || fontFamily.text, // Use Apple SF Pro
    fontSize: variantStyle.fontSize,
    lineHeight: variantStyle.lineHeight,
    fontWeight: weight ? weightMap[weight] : variantStyle.fontWeight,
    color: colorMap[color],
    textAlign: align,
    fontStyle: italic ? 'italic' : 'normal',
    textDecoration: underline ? 'underline' : 'none',
    margin: 0,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  return (
    <Component id={id} className={className} style={styles}>
      {children}
    </Component>
  );
};

export default Text;
