import React, { useState, useRef, useCallback } from 'react';
// @ts-expect-error moduleResolution mismatch for tiptap v3 subpath export
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TextB as TextBIcon,
  TextItalic as TextItalicIcon,
  TextUnderline as TextUnderlineIcon,
  PaintBucket as PaintBucketIcon,
  Palette as PaletteIcon,
  TextAa as TextAaIcon,
  CaretDown as CaretDownIcon,
} from '@phosphor-icons/react';

// ============================================================================
// Color Presets
// ============================================================================

const BG_COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Gray', value: '#f9fafb' },
  { label: 'Light Gray', value: '#f3f4f6' },
  { label: 'Indigo', value: '#eef2ff' },
  { label: 'Blue', value: '#eff6ff' },
  { label: 'Amber', value: '#fffbeb' },
  { label: 'Emerald', value: '#ecfdf5' },
  { label: 'Rose', value: '#fff1f2' },
];

const TEXT_COLORS = [
  { label: 'Default', value: '#111827' },
  { label: 'Gray', value: '#374151' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Amber', value: '#d97706' },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier', value: 'Courier New' },
];

// ============================================================================
// Color Picker Popover
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
          className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-lg shadow-sm p-1.5"
        >
          <div className="grid grid-cols-4 gap-1">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  onSelect(color.value);
                  onClose();
                }}
                className={`w-6 h-6 rounded-md border transition-colors cursor-pointer ${
                  activeColor === color.value
                    ? 'border-indigo-400 ring-1 ring-indigo-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: color.value }}
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
// Dropdown Popover
// ============================================================================

interface DropdownProps {
  options: Array<{ label: string; value: string }>;
  activeValue?: string;
  onSelect: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const DropdownPopover: React.FC<DropdownProps> = ({
  options,
  activeValue,
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
          className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-w-[120px]"
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                activeValue === option.value
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// Toolbar Button
// ============================================================================

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, isActive, title, children }) => (
  <button
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer border ${
      isActive
        ? 'bg-gray-100 text-gray-900 border-gray-100 shadow-xs'
        : 'text-gray-800 hover:bg-gray-50 hover:border-gray-100 hover:shadow-xs border-transparent'
    }`}
    title={title}
  >
    {children}
  </button>
);

// ============================================================================
// Main Component
// ============================================================================

interface SlideFloatingToolbarProps {
  editor: Editor;
  onSlideBgColorChange?: (color: string) => void;
  currentSlideBgColor?: string;
}

export const SlideFloatingToolbar: React.FC<SlideFloatingToolbarProps> = ({
  editor,
  onSlideBgColorChange,
  currentSlideBgColor = '#ffffff',
}) => {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const togglePopover = (name: string) => {
    setOpenPopover(openPopover === name ? null : name);
  };

  const currentColor = editor.getAttributes('textStyle').color || '#111827';
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';
  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || 'Inter';

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 150,
        placement: 'top',
        offset: [0, 8],
      }}
      className="bg-white border border-gray-200 rounded-lg shadow-sm px-1.5 py-1 flex items-center gap-0.5"
    >
      {/* Background Color */}
      <div className="relative">
        <ToolbarButton onClick={() => togglePopover('bgColor')} title="Slide background color">
          <PaintBucketIcon size={15} weight="regular" />
        </ToolbarButton>
        <ColorPicker
          colors={BG_COLORS}
          activeColor={currentSlideBgColor}
          onSelect={(color) => onSlideBgColorChange?.(color)}
          isOpen={openPopover === 'bgColor'}
          onClose={() => setOpenPopover(null)}
        />
      </div>

      {/* Text Color */}
      <div className="relative">
        <ToolbarButton onClick={() => togglePopover('textColor')} title="Text color">
          <PaletteIcon size={15} weight="regular" />
        </ToolbarButton>
        <ColorPicker
          colors={TEXT_COLORS}
          activeColor={currentColor}
          onSelect={(color) => editor.chain().focus().setColor(color).run()}
          isOpen={openPopover === 'textColor'}
          onClose={() => setOpenPopover(null)}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Font Size */}
      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            togglePopover('fontSize');
          }}
          className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-xs text-gray-800 hover:bg-gray-50 hover:border-gray-100 hover:shadow-xs transition-all duration-150 cursor-pointer border border-transparent"
          title="Font size"
        >
          <TextAaIcon size={14} weight="regular" />
          <span>{currentFontSize.replace('px', '')}</span>
          <CaretDownIcon size={10} weight="bold" className="text-gray-500" />
        </button>
        <DropdownPopover
          options={FONT_SIZES.map((s) => ({ label: s.replace('px', ''), value: s }))}
          activeValue={currentFontSize}
          onSelect={(size) => editor.chain().focus().setFontSize(size).run()}
          isOpen={openPopover === 'fontSize'}
          onClose={() => setOpenPopover(null)}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Bold */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <TextBIcon size={15} weight="bold" />
      </ToolbarButton>

      {/* Italic */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <TextItalicIcon size={15} weight="regular" />
      </ToolbarButton>

      {/* Underline */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline"
      >
        <TextUnderlineIcon size={15} weight="regular" />
      </ToolbarButton>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Font Family */}
      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            togglePopover('fontFamily');
          }}
          className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-xs text-gray-800 hover:bg-gray-50 hover:border-gray-100 hover:shadow-xs transition-all duration-150 cursor-pointer border border-transparent"
          title="Font family"
        >
          <span className="max-w-[60px] truncate">{currentFontFamily}</span>
          <CaretDownIcon size={10} weight="bold" className="text-gray-500" />
        </button>
        <DropdownPopover
          options={FONT_FAMILIES}
          activeValue={currentFontFamily}
          onSelect={(family) => editor.chain().focus().setFontFamily(family).run()}
          isOpen={openPopover === 'fontFamily'}
          onClose={() => setOpenPopover(null)}
        />
      </div>
    </BubbleMenu>
  );
};

export default SlideFloatingToolbar;
