import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ToggleOption<T extends string = string> {
  /**
   * Unique value for this option
   */
  value: T;
  /**
   * Display label for this option
   */
  label: string;
}

export interface ToggleProps<T extends string = string> {
  /**
   * Available options for the toggle
   */
  options: ToggleOption<T>[];
  /**
   * Currently selected value
   */
  value: T;
  /**
   * Called when selection changes
   */
  onChange: (value: T) => void;
  /**
   * Additional CSS class name for the container
   */
  className?: string;
  /**
   * Whether the toggle is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * Toggle - Pill-style toggle switch for selecting between options
 *
 * A segmented control that allows users to switch between two or more options.
 * Used for tabs like "Data / Dashboard" in sidebars and panels.
 */
export function Toggle<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  disabled = false,
}: ToggleProps<T>) {
  return (
    <div className={`flex bg-gray-50 rounded-xl p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`
            flex-1 px-3 py-1.25 rounded-lg text-sm font-medium
            transition-colors duration-150 cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              value === option.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-700 hover:text-gray-900'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default Toggle;
