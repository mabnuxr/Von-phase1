import React from 'react';
import { spacing, fontSize, fontFamily, semanticColors } from '../../theme';

export interface RadioButtonProps {
  /**
   * Radio button value
   */
  value: string;

  /**
   * Whether the radio button is checked
   * @default false
   */
  checked?: boolean;

  /**
   * Whether the radio button is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Label text for the radio button
   */
  label: string;

  /**
   * Helper text to display below the label
   */
  helperText?: string;

  /**
   * Whether the radio button has an error state
   * @default false
   */
  error?: boolean;

  /**
   * Error message to display
   */
  errorMessage?: string;

  /**
   * Change handler
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * HTML name attribute (used to group radio buttons)
   */
  name: string;

  /**
   * HTML id attribute
   */
  id?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Whether the radio button is required
   * @default false
   */
  required?: boolean;
}

/**
 * RadioButton component with consistent styling using design tokens
 */
export const RadioButton: React.FC<RadioButtonProps> = ({
  value,
  checked = false,
  disabled = false,
  label,
  helperText,
  error = false,
  errorMessage,
  onChange,
  name,
  id,
  ariaLabel,
  className,
  required = false,
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    position: 'relative',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };

  const radioWrapperStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginRight: spacing[3],
    flexShrink: 0,
    paddingTop: '6px',
  };

  const radioStyles: React.CSSProperties = {
    width: '16px',
    height: '16px',
    margin: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    accentColor: error ? semanticColors.border.error : '#4f39f6', // von-purple
    WebkitAppearance: 'radio',
    MozAppearance: 'radio',
    appearance: 'auto',
  };

  const labelContainerStyles: React.CSSProperties = {
    flex: 1,
    paddingTop: '1px', // Align with radio button center
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: fontSize.sm.size,
    fontWeight: 500,
    color: error
      ? semanticColors.border.error
      : disabled
        ? semanticColors.text.disabled
        : semanticColors.text.primary,
    fontFamily: fontFamily.sans,
    cursor: disabled ? 'not-allowed' : 'pointer',
    lineHeight: fontSize.sm.lineHeight,
  };

  const helperTextStyles: React.CSSProperties = {
    marginTop: spacing[1],
    fontSize: fontSize.xs.size,
    color: error ? semanticColors.border.error : semanticColors.text.secondary,
    fontFamily: fontFamily.sans,
    lineHeight: '1.4',
  };

  return (
    <div className={className}>
      <label style={containerStyles} htmlFor={id}>
        <div style={radioWrapperStyles}>
          <input
            type="radio"
            id={id}
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            required={required}
            onChange={onChange}
            aria-label={ariaLabel || label}
            aria-invalid={error}
            aria-required={required}
            style={radioStyles}
          />
        </div>
        <div style={labelContainerStyles}>
          <span style={labelStyles}>
            {label}
            {required && <span style={{ color: semanticColors.border.error }}> *</span>}
          </span>
          {(helperText || (error && errorMessage)) && (
            <div style={helperTextStyles}>{error && errorMessage ? errorMessage : helperText}</div>
          )}
        </div>
      </label>
    </div>
  );
};

export default RadioButton;
