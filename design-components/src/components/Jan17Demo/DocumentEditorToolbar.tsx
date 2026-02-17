import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Editor } from '@tiptap/react';
import {
  TextB as TextBIcon,
  TextItalic as TextItalicIcon,
  TextUnderline as TextUnderlineIcon,
  TextStrikethrough as TextStrikethroughIcon,
  TextAlignLeft as TextAlignLeftIcon,
  TextAlignCenter as TextAlignCenterIcon,
  TextAlignRight as TextAlignRightIcon,
  ListBullets as ListBulletsIcon,
  ListNumbers as ListNumbersIcon,
  Quotes as QuotesIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Palette as PaletteIcon,
  HighlighterCircle as HighlighterIcon,
  CaretDown as CaretDownIcon,
} from '@phosphor-icons/react';

// ============================================================================
// Presets
// ============================================================================

const HEADING_OPTIONS = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
];

const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Times', value: 'Times New Roman' },
];

const FONT_SIZES = ['10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

const TEXT_COLORS = [
  { label: 'Default', value: '#111827' },
  { label: 'Gray', value: '#374151' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Amber', value: '#d97706' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None', value: '' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Purple', value: '#e9d5ff' },
  { label: 'Pink', value: '#fecdd3' },
  { label: 'Orange', value: '#fed7aa' },
];

// ============================================================================
// Shared Dropdown Component
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
        onMouseDown={(e) => {
          e.preventDefault();
          onToggle();
        }}
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
          <div className="grid grid-cols-4 gap-1">
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

interface DocumentEditorToolbarProps {
  editor: Editor;
}

export const DocumentEditorToolbar: React.FC<DocumentEditorToolbarProps> = ({ editor }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeAll = () => setOpenDropdown(null);

  // Get current state
  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || 'Inter';
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '14px';
  const currentColor = editor.getAttributes('textStyle').color || '#111827';

  const getCurrentHeading = (): string => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    return 'Paragraph';
  };

  const handleHeadingChange = (value: string) => {
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value.replace('h', '')) as 1 | 2 | 3;
      editor.chain().focus().toggleHeading({ level }).run();
    }
    closeAll();
  };

  return (
    <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-gray-100 bg-white flex-wrap flex-shrink-0">
      {/* Heading Level */}
      <Dropdown
        trigger={<span className="max-w-[80px] truncate">{getCurrentHeading()}</span>}
        isOpen={openDropdown === 'heading'}
        onToggle={() => toggleDropdown('heading')}
        onClose={closeAll}
      >
        {HEADING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleHeadingChange(opt.value)}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {opt.label}
          </button>
        ))}
      </Dropdown>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Font Family */}
      <Dropdown
        trigger={<span className="max-w-[70px] truncate">{currentFontFamily}</span>}
        isOpen={openDropdown === 'fontFamily'}
        onToggle={() => toggleDropdown('fontFamily')}
        onClose={closeAll}
      >
        {FONT_FAMILIES.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              editor.chain().focus().setFontFamily(opt.value).run();
              closeAll();
            }}
            className={`w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer ${
              currentFontFamily === opt.value
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
        trigger={<span>{currentFontSize.replace('px', '')}</span>}
        isOpen={openDropdown === 'fontSize'}
        onToggle={() => toggleDropdown('fontSize')}
        onClose={closeAll}
      >
        {FONT_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => {
              editor.chain().focus().setFontSize(size).run();
              closeAll();
            }}
            className={`w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer ${
              currentFontSize === size
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

      {/* Text Styles */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <TextBIcon size={15} weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <TextItalicIcon size={15} weight="regular" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline"
      >
        <TextUnderlineIcon size={15} weight="regular" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <TextStrikethroughIcon size={15} weight="regular" />
      </ToolbarButton>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Text Color */}
      <div className="relative">
        <ToolbarButton onClick={() => toggleDropdown('textColor')} title="Text color">
          <PaletteIcon size={15} weight="regular" />
        </ToolbarButton>
        <ColorPicker
          colors={TEXT_COLORS}
          activeColor={currentColor}
          onSelect={(color) => editor.chain().focus().setColor(color).run()}
          isOpen={openDropdown === 'textColor'}
          onClose={closeAll}
        />
      </div>

      {/* Highlight */}
      <div className="relative">
        <ToolbarButton onClick={() => toggleDropdown('highlight')} title="Highlight">
          <HighlighterIcon size={15} weight="regular" />
        </ToolbarButton>
        <ColorPicker
          colors={HIGHLIGHT_COLORS}
          activeColor=""
          onSelect={(color) => {
            if (color) {
              editor.chain().focus().toggleHighlight({ color }).run();
            } else {
              editor.chain().focus().unsetHighlight().run();
            }
          }}
          isOpen={openDropdown === 'highlight'}
          onClose={closeAll}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align left"
      >
        <TextAlignLeftIcon size={15} weight="regular" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align center"
      >
        <TextAlignCenterIcon size={15} weight="regular" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align right"
      >
        <TextAlignRightIcon size={15} weight="regular" />
      </ToolbarButton>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <ListBulletsIcon size={15} weight="regular" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered list"
      >
        <ListNumbersIcon size={15} weight="regular" />
      </ToolbarButton>

      {/* Blockquote */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <QuotesIcon size={15} weight="regular" />
      </ToolbarButton>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Link */}
      <ToolbarButton
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor.chain().focus().toggleLink({ href: url }).run();
          }
        }}
        isActive={editor.isActive('link')}
        title="Insert link"
      >
        <LinkIcon size={15} weight="regular" />
      </ToolbarButton>

      {/* Table */}
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Insert table"
      >
        <TableIcon size={15} weight="regular" />
      </ToolbarButton>
    </div>
  );
};

export default DocumentEditorToolbar;
