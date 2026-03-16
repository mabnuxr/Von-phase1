import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CaretDown, Check, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MultiSelectDropdownOption {
  value: string;
  label: string;
}

export interface MultiSelectDropdownProps {
  label?: string;
  labelClassName?: string;
  options: MultiSelectDropdownOption[];
  /** Currently selected values */
  value: string[];
  placeholder?: string;
  onChange?: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
  usePortal?: boolean;
  /** Minimum number of selected items (prevents deselecting below this count) */
  min?: number;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  labelClassName,
  options,
  value,
  placeholder = 'Select...',
  onChange,
  disabled = false,
  className = '',
  usePortal = false,
  min = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const MAX_MENU_H = 192;
  const updateDropdownPosition = useCallback(() => {
    if (usePortal && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < MAX_MENU_H + 8 && rect.top > MAX_MENU_H;
      setDropdownPosition({
        top: placeAbove ? rect.top - MAX_MENU_H - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [usePortal]);

  useEffect(() => {
    if (isOpen && usePortal) {
      updateDropdownPosition();
    }
  }, [isOpen, usePortal, updateDropdownPosition]);

  useEffect(() => {
    if (!isOpen || !usePortal) return;
    const handleScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen, usePortal]);

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = (optionValue: string) => {
    const isSelected = value.includes(optionValue);
    if (isSelected) {
      if (value.length <= min) return;
      onChange?.(value.filter((v) => v !== optionValue));
    } else {
      // Preserve the order of options
      const next = options
        .map((o) => o.value)
        .filter((v) => v === optionValue || value.includes(v));
      onChange?.(next);
    }
  };

  const menuContent = (
    <div className="max-h-48 overflow-y-auto py-1">
      {options.map((option) => {
        const isSelected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            className={`
              w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-left
              transition-colors duration-100 cursor-pointer
              ${
                isSelected
                  ? 'bg-gray-50 text-gray-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <span className="truncate">{option.label}</span>
            {isSelected && (
              <Check size={14} weight="bold" className="text-gray-700 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className={labelClassName || 'text-xs font-medium text-gray-700'}>{label}</label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full flex items-center gap-1.5 px-2 py-1.5 text-sm text-left
            bg-white border rounded-lg cursor-pointer
            transition-colors duration-150
            focus:outline-none focus:ring-1
            ${
              isOpen
                ? 'border-gray-300 ring-1 ring-gray-200'
                : 'border-gray-200 hover:border-gray-300 focus:border-gray-300 focus:ring-gray-200'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          `}
        >
          <span className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-md"
                >
                  {opt.label}
                  {!(disabled || value.length <= min) && (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange?.(value.filter((v) => v !== opt.value));
                      }}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={10} />
                    </span>
                  )}
                </span>
              ))
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </span>
          <CaretDown
            size={14}
            weight="bold"
            className={`text-gray-400 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

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
                {menuContent}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

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
                {menuContent}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default MultiSelectDropdown;
