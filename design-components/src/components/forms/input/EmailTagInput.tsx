import React, { useState, useRef, KeyboardEvent } from 'react';
import { X } from '@phosphor-icons/react';

// ============================================================================
// Types
// ============================================================================

export interface EmailTagInputProps {
  /**
   * Label for the input
   */
  label?: string;
  /**
   * Additional class name for the label
   */
  labelClassName?: string;
  /**
   * Helper text shown below the input
   */
  helperText?: string;
  /**
   * Error message (also sets error styling)
   */
  error?: string;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Current list of emails
   */
  emails: string[];
  /**
   * Called when emails change
   */
  onChange: (emails: string[]) => void;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ============================================================================
// Component
// ============================================================================

/**
 * EmailTagInput - Input for entering multiple email addresses as tags
 *
 * Similar to Google Docs sharing input - type an email, press Enter/comma,
 * and it becomes a tag. Tags can be removed by clicking the X.
 */
export const EmailTagInput: React.FC<EmailTagInputProps> = ({
  label,
  labelClassName,
  helperText,
  error,
  placeholder = 'Enter email address...',
  emails,
  onChange,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setInputError('Please enter a valid email address');
      return;
    }

    if (emails.includes(trimmedEmail)) {
      setInputError('This email has already been added');
      return;
    }

    onChange([...emails, trimmedEmail]);
    setInputValue('');
    setInputError(null);
  };

  const removeEmail = (emailToRemove: string) => {
    onChange(emails.filter((email) => email !== emailToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      // Remove last email when backspace is pressed on empty input
      removeEmail(emails[emails.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const displayError = error || inputError;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className={labelClassName || "text-xs font-medium text-gray-700"}>
          {label}
        </label>
      )}

      <div
        onClick={handleContainerClick}
        className={`
          min-h-[38px] w-full px-2 py-1.5 bg-white
          border rounded-lg cursor-text
          focus-within:outline-none focus-within:ring-1 transition-colors
          ${displayError
            ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500'
            : 'border-gray-200 focus-within:border-gray-300 focus-within:ring-gray-200'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
        `}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Email Tags */}
          {emails.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[12px] font-medium text-gray-700 bg-gray-100 rounded-md"
            >
              {email}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEmail(email);
                  }}
                  className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                >
                  <X size={12} weight="bold" />
                </button>
              )}
            </span>
          ))}

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputError(null);
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={emails.length === 0 ? placeholder : ''}
            disabled={disabled}
            className="flex-1 min-w-[120px] py-0.5 text-[13px] text-gray-900 bg-transparent border-0 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {(helperText || displayError) && (
        <span className={`text-[11px] ${displayError ? 'text-red-600' : 'text-gray-500'}`}>
          {displayError || helperText}
        </span>
      )}
    </div>
  );
};

export default EmailTagInput;
