import React, { useState } from 'react';
import { spacing, fontSize, fontFamily, semanticColors } from '../../theme';

export interface InputProps {
  /**
   * Input type
   * @default 'text'
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

  /**
   * Input value (controlled component)
   */
  value?: string;

  /**
   * Default value (uncontrolled component)
   */
  defaultValue?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the input is read-only
   * @default false
   */
  readOnly?: boolean;

  /**
   * Whether the input is required
   * @default false
   */
  required?: boolean;

  /**
   * Whether the input has an error state
   * @default false
   */
  error?: boolean;

  /**
   * Error message to display
   */
  errorMessage?: string;

  /**
   * Label for the input
   */
  label?: string;

  /**
   * Helper text to display below input
   */
  helperText?: string;

  /**
   * Size of the input
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether the input should take full width
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Change handler
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Focus handler
   */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;

  /**
   * Blur handler
   */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * HTML id attribute
   */
  id?: string;

  /**
   * HTML name attribute
   */
  name?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}

/**
 * Input component with consistent styling using design tokens
 */
export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  defaultValue,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  error = false,
  errorMessage,
  label,
  helperText,
  size = 'medium',
  fullWidth = false,
  onChange,
  onFocus,
  onBlur,
  className,
  id,
  name,
  ariaLabel,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Size styles
  const sizeStyles: Record<InputProps['size'] & string, React.CSSProperties> = {
    small: {
      padding: `${spacing[1]} ${spacing[2]}`,
      fontSize: fontSize.sm.size,
      lineHeight: fontSize.sm.lineHeight,
    },
    medium: {
      padding: `${spacing[2]} ${spacing[3]}`,
      fontSize: fontSize.base.size,
      lineHeight: fontSize.base.lineHeight,
    },
    large: {
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: fontSize.lg.size,
      lineHeight: fontSize.lg.lineHeight,
    },
  };

  // Determine border color based on state
  const getBorderColor = () => {
    if (error) return semanticColors.border.error;
    if (isFocused) return semanticColors.border.focus;
    if (disabled) return 'rgba(0,0,0,0.1)';
    return 'rgba(0,0,0,0.15)';
  };

  const inputStyles: React.CSSProperties = {
    fontFamily: fontFamily.sans,
    width: fullWidth ? '100%' : 'auto',
    border: `1px solid ${getBorderColor()}`,
    borderRadius: '6px',
    backgroundColor: disabled ? '#f5f5f7' : '#FFFFFF',
    color: disabled ? semanticColors.text.disabled : '#1d1d1f',
    cursor: disabled ? 'not-allowed' : 'text',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    boxShadow: isFocused ? '0 0 0 3px rgba(0,125,250,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    ...sizeStyles[size],
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: spacing[1],
    fontSize: fontSize.sm.size,
    fontWeight: 500,
    color: error ? semanticColors.border.error : semanticColors.text.primary,
    fontFamily: fontFamily.sans,
  };

  const helperTextStyles: React.CSSProperties = {
    marginTop: spacing[1],
    fontSize: fontSize.xs.size,
    color: error ? semanticColors.border.error : semanticColors.text.secondary,
    fontFamily: fontFamily.sans,
  };

  const containerStyles: React.CSSProperties = {
    display: 'inline-block',
    width: fullWidth ? '100%' : 'auto',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <div style={containerStyles} className={className}>
      {label && (
        <label htmlFor={id} style={labelStyles}>
          {label}
          {required && <span style={{ color: semanticColors.border.error }}> *</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={ariaLabel || label}
        aria-invalid={error}
        aria-required={required}
        style={inputStyles}
      />
      {(helperText || (error && errorMessage)) && (
        <div style={helperTextStyles}>{error && errorMessage ? errorMessage : helperText}</div>
      )}
    </div>
  );
};

export default Input;
