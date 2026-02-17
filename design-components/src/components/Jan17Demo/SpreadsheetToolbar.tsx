import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette as PaletteIcon,
  HighlighterCircle as HighlighterIcon,
  CaretDown as CaretDownIcon,
  SortAscending as SortAscendingIcon,
  SortDescending as SortDescendingIcon,
} from '@phosphor-icons/react';

// ============================================================================
// Presets
// ============================================================================

const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Courier', value: 'Courier New' },
];

const FONT_SIZES = ['10px', '11px', '12px', '14px', '16px', '18px'];

const TEXT_COLORS = [
  { label: 'Default', value: '#111827' },
  { label: 'Gray', value: '#6b7280' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Emerald', value: '#059669' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None', value: '' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Purple', value: '#e9d5ff' },
  { label: 'Pink', value: '#fecdd3' },
];

// ============================================================================
// Shared Dropdown
// ============================================================================

interface DropdownProps {
  trigger: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, isOpen, onToggle, onClose, children }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-xs text-gray-800 hover:bg-gray-50 hover:border-gray-100 hover:shadow-xs transition-all duration-150 cursor-pointer border border-transparent"
      >
        {trigger}
        <CaretDownIcon size={10} weight="bold" className="text-gray-500" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-w-[120px]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Color Picker
// ============================================================================

interface ColorPickerProps {
  colors: Array<{ label: string; value: string }>;
  activeColor?: string;
  onSelect: (color: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  activeColor,
  onSelect,
  isOpen,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-sm p-1.5"
        >
          <div className="grid grid-cols-3 gap-1">
            {colors.map((color) => (
              <button
                key={color.value || 'none'}
                onClick={() => {
                  onSelect(color.value);
                  onClose();
                }}
                className={`w-6 h-6 rounded-md border transition-colors cursor-pointer ${
                  activeColor === color.value
                    ? 'border-indigo-400 ring-1 ring-indigo-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: color.value || '#ffffff' }}
                title={color.label}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// Main Toolbar
// ============================================================================

export interface CellStyle {
  fontFamily?: string;
  fontSize?: string;
  color?: string;
  backgroundColor?: string;
}

interface SpreadsheetToolbarProps {
  cellStyle: CellStyle;
  onCellStyleChange: (style: Partial<CellStyle>) => void;
  onSort?: (direction: 'asc' | 'desc') => void;
  sortDirection?: 'asc' | 'desc' | null;
}

export const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
  cellStyle,
  onCellStyleChange,
  onSort,
  sortDirection,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeAll = () => setOpenDropdown(null);

  return (
    <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-gray-100 bg-white flex-shrink-0">
      {/* Font Family */}
      <Dropdown
        trigger={<span className="max-w-[70px] truncate">{cellStyle.fontFamily || 'Inter'}</span>}
        isOpen={openDropdown === 'fontFamily'}
        onToggle={() => toggleDropdown('fontFamily')}
        onClose={closeAll}
      >
        {FONT_FAMILIES.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              onCellStyleChange({ fontFamily: opt.value });
              closeAll();
            }}
            className={`w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer ${
              cellStyle.fontFamily === opt.value
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={{ fontFamily: opt.value }}
          >
            {opt.label}
          </button>
        ))}
      </Dropdown>

      {/* Font Size */}
      <Dropdown
        trigger={<span>{(cellStyle.fontSize || '14px').replace('px', '')}</span>}
        isOpen={openDropdown === 'fontSize'}
        onToggle={() => toggleDropdown('fontSize')}
        onClose={closeAll}
      >
        {FONT_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => {
              onCellStyleChange({ fontSize: size });
              closeAll();
            }}
            className={`w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer ${
              cellStyle.fontSize === size
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {size.replace('px', '')}
          </button>
        ))}
      </Dropdown>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Font Color */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown('fontColor')}
          className={`p-1.5 rounded-md text-gray-800 transition-all duration-150 cursor-pointer border ${
            openDropdown === 'fontColor'
              ? 'bg-gray-100 border-gray-100 shadow-xs'
              : 'hover:bg-gray-50 hover:border-gray-100 hover:shadow-xs border-transparent'
          }`}
          title="Font color"
        >
          <PaletteIcon size={15} weight="regular" />
        </button>
        <ColorPicker
          colors={TEXT_COLORS}
          activeColor={cellStyle.color}
          onSelect={(color) => onCellStyleChange({ color })}
          isOpen={openDropdown === 'fontColor'}
          onClose={closeAll}
        />
      </div>

      {/* Cell Highlight */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown('cellHighlight')}
          className={`p-1.5 rounded-md text-gray-800 transition-all duration-150 cursor-pointer border ${
            openDropdown === 'cellHighlight'
              ? 'bg-gray-100 border-gray-100 shadow-xs'
              : 'hover:bg-gray-50 hover:border-gray-100 hover:shadow-xs border-transparent'
          }`}
          title="Cell highlight"
        >
          <HighlighterIcon size={15} weight="regular" />
        </button>
        <ColorPicker
          colors={HIGHLIGHT_COLORS}
          activeColor={cellStyle.backgroundColor}
          onSelect={(color) => onCellStyleChange({ backgroundColor: color })}
          isOpen={openDropdown === 'cellHighlight'}
          onClose={closeAll}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Sort */}
      {onSort && (
        <>
          <button
            onClick={() => onSort('asc')}
            className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer border ${
              sortDirection === 'asc'
                ? 'bg-gray-100 text-gray-900 border-gray-100 shadow-xs'
                : 'text-gray-800 hover:bg-gray-50 hover:border-gray-100 hover:shadow-xs border-transparent'
            }`}
            title="Sort A to Z"
          >
            <SortAscendingIcon size={15} weight="regular" />
          </button>
          <button
            onClick={() => onSort('desc')}
            className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer border ${
              sortDirection === 'desc'
                ? 'bg-gray-100 text-gray-900 border-gray-100 shadow-xs'
                : 'text-gray-800 hover:bg-gray-50 hover:border-gray-100 hover:shadow-xs border-transparent'
            }`}
            title="Sort Z to A"
          >
            <SortDescendingIcon size={15} weight="regular" />
          </button>
        </>
      )}
    </div>
  );
};

export default SpreadsheetToolbar;
