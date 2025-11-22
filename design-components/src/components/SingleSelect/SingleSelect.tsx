import React, { useRef, useEffect, useState } from 'react';
import { colors, spacing, fontSize, fontFamily } from '../../theme';

export interface SingleSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SingleSelectProps {
  /**
   * Available options
   */
  options: SingleSelectOption[];

  /**
   * Currently selected value
   */
  value: string;

  /**
   * Change handler - called when selection changes
   */
  onChange: (selected: string) => void;

  /**
   * Placeholder text when no selection
   */
  placeholder?: string;

  /**
   * Label for the field
   */
  label?: string;

  /**
   * Helper text
   */
  helperText?: string;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Error state
   */
  error?: boolean;

  /**
   * Error message
   */
  errorMessage?: string;

  /**
   * Full width
   */
  fullWidth?: boolean;

  /**
   * Maximum height for dropdown
   */
  maxHeight?: string;

  /**
   * Whether to show search input in dropdown
   * @default true
   */
  showSearch?: boolean;
}

/**
 * SingleSelect - A dropdown component for selecting a single option
 *
 * Features:
 * - Custom styled dropdown (replaces native select)
 * - Search/filter functionality
 * - Click-outside to close
 * - Keyboard navigation (Escape to close)
 *
 * @example
 * ```tsx
 * <SingleSelect
 *   label="Sales Quarter"
 *   options={[
 *     { value: 'fiscal', label: 'Fiscal' },
 *     { value: 'calendar', label: 'Calendar' }
 *   ]}
 *   value={selectedQuarter}
 *   onChange={setSelectedQuarter}
 *   placeholder="Select quarter..."
 * />
 * ```
 */
export const SingleSelect: React.FC<SingleSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  helperText,
  disabled = false,
  required = false,
  error = false,
  errorMessage,
  fullWidth = false,
  maxHeight = '300px',
  showSearch = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectOption = (optionValue: string) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  const getLabel = (val: string) => {
    return options.find((opt) => opt.value === val)?.label || val;
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: fontFamily.sans,
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: spacing[1],
    fontSize: fontSize.sm.size,
    fontWeight: 500,
    color: error ? colors.error[500] : colors.neutral[800],
    fontFamily: fontFamily.sans,
  };

  const triggerStyles: React.CSSProperties = {
    width: '100%',
    minHeight: '44px',
    padding: `${spacing[2]} ${spacing[3]}`,
    paddingRight: '36px', // Make room for chevron
    backgroundColor: disabled ? colors.neutral[200] : colors.common.white,
    border: `1px solid ${error ? colors.error[500] : isOpen ? colors.primary[500] : 'rgba(0,0,0,0.15)'}`,
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    boxShadow: isOpen ? `0 0 0 3px ${colors.primary[100]}` : '0 1px 2px rgba(0,0,0,0.04)',
    outline: 'none',
    position: 'relative',
  };

  const selectedTextStyles: React.CSSProperties = {
    color: colors.neutral[800],
    fontSize: fontSize.sm.size,
    flex: 1,
    userSelect: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const placeholderStyles: React.CSSProperties = {
    color: colors.neutral[500],
    fontSize: fontSize.sm.size,
    flex: 1,
    userSelect: 'none',
  };

  const dropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing[1],
    backgroundColor: colors.common.white,
    border: `1px solid ${colors.neutral[300]}`,
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
    zIndex: 1000,
    maxHeight,
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
    overflow: 'hidden',
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1)' : 'scale(0.95)',
    transformOrigin: 'top left',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const searchInputStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing[2],
    border: 'none',
    borderBottom: `1px solid ${colors.neutral[200]}`,
    outline: 'none',
    fontSize: fontSize.base.size,
    fontFamily: fontFamily.sans,
  };

  const optionsListStyles: React.CSSProperties = {
    overflowY: 'auto',
    maxHeight: `calc(${maxHeight} - 50px)`,
    padding: spacing[1],
  };

  const optionStyles = (isSelected: boolean, isDisabled: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing[2]} ${spacing[3]}`,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    fontSize: fontSize.sm.size,
    color: isDisabled ? colors.neutral[400] : colors.neutral[800],
    backgroundColor: isSelected ? colors.neutral[100] : 'transparent',
    borderRadius: '6px',
    transition: 'background-color 0.15s ease',
    opacity: isDisabled ? 0.5 : 1,
    userSelect: 'none',
  });

  const helperTextStyles: React.CSSProperties = {
    marginTop: spacing[1],
    fontSize: fontSize.xs.size,
    color: error ? colors.error[500] : colors.neutral[600],
    fontFamily: fontFamily.sans,
  };

  const chevronIconStyles: React.CSSProperties = {
    position: 'absolute',
    right: spacing[3],
    top: '50%',
    transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)',
    transition: 'transform 0.2s ease',
    pointerEvents: 'none',
    color: colors.neutral[600],
    width: '16px',
    height: '16px',
  };

  return (
    <div style={containerStyles}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: colors.error[500] }}> *</span>}
        </label>
      )}

      <div ref={dropdownRef}>
        {/* Trigger */}
        <div
          style={triggerStyles}
          onClick={handleToggleDropdown}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label || 'Single-select dropdown'}
          aria-expanded={isOpen}
          aria-disabled={disabled}
        >
          {value ? (
            <span style={selectedTextStyles}>{getLabel(value)}</span>
          ) : (
            <span style={placeholderStyles}>{placeholder}</span>
          )}
          {/* Chevron Icon */}
          <svg style={chevronIconStyles} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Dropdown Menu */}
        <div style={dropdownStyles}>
          {/* Search Input - conditionally rendered */}
          {showSearch && (
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInputStyles}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Options List */}
          <div
            style={{
              ...optionsListStyles,
              maxHeight: showSearch ? `calc(${maxHeight} - 50px)` : maxHeight,
            }}
            className="settings-scrollbar"
          >
            {filteredOptions.length === 0 ? (
              <div style={{ padding: spacing[3], textAlign: 'center', color: colors.neutral[500] }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option.value;
                const isDisabled = option.disabled || false;

                return (
                  <div
                    key={option.value}
                    style={optionStyles(isSelected, isDisabled)}
                    onClick={() => !isDisabled && handleSelectOption(option.value)}
                    onMouseEnter={(e) => {
                      if (!isDisabled && !isSelected) {
                        e.currentTarget.style.backgroundColor = colors.neutral[100];
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                  >
                    <span>{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {(helperText || (error && errorMessage)) && (
        <div style={helperTextStyles}>{error && errorMessage ? errorMessage : helperText}</div>
      )}
    </div>
  );
};

export default SingleSelect;
