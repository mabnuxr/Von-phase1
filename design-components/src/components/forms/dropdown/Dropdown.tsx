import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CaretDown, Check } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface DropdownProps {
  /**
   * Label for the dropdown
   */
  label?: string;
  /**
   * Additional class name for the label
   */
  labelClassName?: string;
  /**
   * Options to display
   */
  options: DropdownOption[];
  /**
   * Currently selected value
   */
  value?: string;
  /**
   * Placeholder text when no value selected
   */
  placeholder?: string;
  /**
   * Helper text shown below the dropdown
   */
  helperText?: string;
  /**
   * Error message (also sets error styling)
   */
  error?: string;
  /**
   * Called when selection changes
   */
  onChange?: (value: string) => void;
  /**
   * Whether the dropdown is disabled
   */
  disabled?: boolean;
  /**
   * Additional class name for the container
   */
  className?: string;
  /**
   * Whether to render dropdown menu in a portal (useful when inside overflow containers)
   */
  usePortal?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  labelClassName,
  options,
  value,
  placeholder = 'Select...',
  helperText,
  error,
  onChange,
  disabled = false,
  className = '',
  usePortal = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Calculate dropdown position for portal mode
  const updateDropdownPosition = useCallback(() => {
    if (usePortal && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [usePortal]);

  // Update position when opening
  useEffect(() => {
    if (isOpen && usePortal) {
      updateDropdownPosition();
    }
  }, [isOpen, usePortal, updateDropdownPosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideList = listRef.current?.contains(target);
      if (!isInsideContainer && !isInsideList) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = options.findIndex((opt) => opt.value === value);
          const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
          onChange?.(options[nextIndex].value);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          const currentIndex = options.findIndex((opt) => opt.value === value);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
          onChange?.(options[prevIndex].value);
        }
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className={labelClassName || 'text-xs font-medium text-gray-700'}>{label}</label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[13px] text-left
            bg-white border rounded-lg cursor-pointer
            transition-colors duration-150
            focus:outline-none focus:ring-1
            ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : isOpen
                  ? 'border-gray-300 ring-1 ring-gray-200'
                  : 'border-gray-200 hover:border-gray-300 focus:border-gray-300 focus:ring-gray-200'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          `}
        >
          <span
            className={`flex items-center gap-2 ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}
          >
            {selectedOption?.icon && (
              <span className="flex-shrink-0 text-gray-700">{selectedOption.icon}</span>
            )}
            {selectedOption?.label || placeholder}
          </span>
          <CaretDown
            size={14}
            weight="bold"
            className={`text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu - Inline (non-portal) */}
        {!usePortal && (
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={listRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-[200] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
              >
                <div className="max-h-48 overflow-y-auto py-1">
                  {options.length === 0 ? (
                    <div className="px-3 py-2 text-[13px] text-gray-500 text-center">
                      No options available
                    </div>
                  ) : (
                    options.map((option) => {
                      const isSelected = option.value === value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          className={`
                            w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[13px] text-left
                            transition-colors duration-100 cursor-pointer
                            ${
                              isSelected
                                ? 'bg-gray-50 text-gray-900 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          <span className="flex items-center gap-2 truncate">
                            {option.icon && (
                              <span className="flex-shrink-0 text-gray-700">{option.icon}</span>
                            )}
                            {option.label}
                          </span>
                          {isSelected && (
                            <Check
                              size={14}
                              weight="bold"
                              className="text-gray-700 flex-shrink-0"
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Dropdown Menu - Portal (for overflow containers) */}
      {usePortal &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={listRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                }}
              >
                <div className="max-h-48 overflow-y-auto py-1">
                  {options.length === 0 ? (
                    <div className="px-3 py-2 text-[13px] text-gray-500 text-center">
                      No options available
                    </div>
                  ) : (
                    options.map((option) => {
                      const isSelected = option.value === value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          className={`
                            w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[13px] text-left
                            transition-colors duration-100 cursor-pointer
                            ${
                              isSelected
                                ? 'bg-gray-50 text-gray-900 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          <span className="flex items-center gap-2 truncate">
                            {option.icon && (
                              <span className="flex-shrink-0 text-gray-700">{option.icon}</span>
                            )}
                            {option.label}
                          </span>
                          {isSelected && (
                            <Check
                              size={14}
                              weight="bold"
                              className="text-gray-700 flex-shrink-0"
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {(helperText || error) && (
        <span className={`text-[11px] ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
};

export default Dropdown;
