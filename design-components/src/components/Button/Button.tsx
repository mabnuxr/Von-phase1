import React from 'react';
import { colors, spacing } from '../../theme';

export interface ButtonProps {
  /**
   * Visual style variant of the button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';

  /**
   * Size of the button
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the button should take full width of its container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Click handler
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * Button content
   */
  children: React.ReactNode;

  /**
   * HTML button type
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}

/**
 * Button component with consistent styling using design tokens
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  onClick,
  children,
  type = 'button',
  className,
  ariaLabel,
}) => {
  // Variant styles - Apple-inspired
  const variantStyles: Record<ButtonProps['variant'] & string, React.CSSProperties> = {
    primary: {
      backgroundColor: disabled ? colors.neutral[400] : colors.primary[500], // Apple blue
      color: colors.common.white,
      border: 'none',
      boxShadow: disabled ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
    },
    secondary: {
      backgroundColor: disabled ? colors.neutral[200] : colors.neutral[200], // Apple light gray
      color: disabled ? colors.neutral[400] : colors.neutral[800], // Near black text
      border: `1px solid ${disabled ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.1)'}`,
      boxShadow: disabled ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: disabled ? colors.neutral[400] : colors.primary[500], // Apple blue
      border: 'none',
      boxShadow: 'none',
    },
    danger: {
      backgroundColor: disabled ? colors.neutral[400] : colors.error[500], // Apple red
      color: colors.common.white,
      border: 'none',
      boxShadow: disabled ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
    },
  };

  // Size styles - Apple-style proportions
  const sizeStyles: Record<ButtonProps['size'] & string, React.CSSProperties> = {
    small: {
      padding: `${spacing[1]} ${spacing[3]}`,
      fontSize: '0.875rem', // 14px
      lineHeight: '1.42858',
    },
    medium: {
      padding: `${spacing[2]} ${spacing[5]}`,
      fontSize: '1.0625rem', // 17px - Apple's preferred body size
      lineHeight: '1.47059',
    },
    large: {
      padding: `${spacing[3]} ${spacing[6]}`,
      fontSize: '1.1875rem', // 19px
      lineHeight: '1.42106',
    },
  };

  const baseStyles: React.CSSProperties = {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    fontWeight: 600, // Apple uses semibold for buttons
    borderRadius: '12px', // Apple's rounded corners (980px for pill buttons, 12px for regular)
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1, // Apple uses stronger opacity reduction
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // Apple's easing
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : 'auto',
    textDecoration: 'none',
    outline: 'none',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const hoverStyles: React.CSSProperties = !disabled
    ? {
        primary: { backgroundColor: colors.primary[600], opacity: 0.9 }, // Subtle opacity change
        secondary: { backgroundColor: colors.neutral[300] },
        ghost: { backgroundColor: colors.neutral[200] }, // Apple light gray on hover
        danger: { backgroundColor: colors.error[600], opacity: 0.9 },
      }[variant]
    : {};

  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const focusStyles: React.CSSProperties = isFocused
    ? {
        boxShadow: `0 0 0 4px ${colors.primary[100]}`, // Apple-style focus ring
        outline: `2px solid ${colors.primary[500]}`,
        outlineOffset: '2px',
      }
    : {};

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...(isHovered ? hoverStyles : {}),
        ...focusStyles,
      }}
    >
      {children}
    </button>
  );
};

export default Button;
