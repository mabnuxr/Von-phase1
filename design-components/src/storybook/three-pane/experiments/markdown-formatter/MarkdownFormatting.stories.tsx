import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useMemo } from 'react';
import { Streamdown } from 'streamdown';
import {
  CaretDown,
  CaretRight,
  Export,
  Copy,
  Check,
  X,
  PencilSimple,
  Eye,
} from '@phosphor-icons/react';
import { sampleMarkdownContent } from './sampleContent';

/**
 * Markdown Formatting Preview
 *
 * This story uses the actual `markdown-content` class from index.css
 * with Streamdown renderer - the same stack used in ChatMessage.tsx.
 *
 * The WYSIWYG controls let you experiment with styles, then you can
 * export the CSS to update index.css.
 */

// Font options with Google Fonts support
const FONT_OPTIONS = [
  { name: 'Inter', value: "'Inter', sans-serif", googleFont: 'Inter:wght@400;500;600;700' },
  {
    name: 'SF Pro',
    value: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    googleFont: null,
  },
  {
    name: 'Source Sans Pro',
    value: "'Source Sans Pro', sans-serif",
    googleFont: 'Source+Sans+Pro:wght@400;500;600;700',
  },
  {
    name: 'IBM Plex Sans',
    value: "'IBM Plex Sans', sans-serif",
    googleFont: 'IBM+Plex+Sans:wght@400;500;600;700',
  },
  {
    name: 'Plus Jakarta Sans',
    value: "'Plus Jakarta Sans', sans-serif",
    googleFont: 'Plus+Jakarta+Sans:wght@400;500;600;700',
  },
  { name: 'DM Sans', value: "'DM Sans', sans-serif", googleFont: 'DM+Sans:wght@400;500;600;700' },
  { name: 'Outfit', value: "'Outfit', sans-serif", googleFont: 'Outfit:wght@400;500;600;700' },
  { name: 'Figtree', value: "'Figtree', sans-serif", googleFont: 'Figtree:wght@400;500;600;700' },
];

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection = ({ title, isOpen, onToggle, children }: CollapsibleSectionProps) => (
  <div className="border-b border-gray-100">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-gray-50 transition-colors"
    >
      <span className="text-[13px] font-medium text-gray-900">{title}</span>
      {isOpen ? (
        <CaretDown size={14} className="text-gray-500" />
      ) : (
        <CaretRight size={14} className="text-gray-500" />
      )}
    </button>
    {isOpen && <div className="pb-4 px-1">{children}</div>}
  </div>
);

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

const SliderControl = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
}: SliderControlProps) => (
  <div className="mb-3">
    <div className="flex justify-between items-center mb-1">
      <label className="text-xs text-gray-600">{label}</label>
      <span className="text-xs text-gray-500 font-mono">
        {value}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
    />
  </div>
);

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorControl = ({ label, value, onChange }: ColorControlProps) => (
  <div className="mb-3 flex items-center gap-2">
    <label className="text-xs text-gray-600 flex-1">{label}</label>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-6 h-6 rounded border border-gray-200 cursor-pointer"
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-16 px-1.5 py-1 text-xs font-mono bg-gray-50 border border-gray-200 rounded"
    />
  </div>
);

interface SelectControlProps {
  label: string;
  value: string;
  options: { name: string; value: string }[];
  onChange: (value: string) => void;
}

const SelectControl = ({ label, value, options, onChange }: SelectControlProps) => (
  <div className="mb-3">
    <label className="block text-xs text-gray-600 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-300"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.name}
        </option>
      ))}
    </select>
  </div>
);

const MarkdownFormattingExperiment = () => {
  const [markdownContent, setMarkdownContent] = useState(sampleMarkdownContent);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    global: true,
    headings: false,
    paragraph: false,
    lists: false,
    links: false,
    table: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Style overrides (these override the base markdown-content styles)
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [baseFontSize, setBaseFontSize] = useState(15);
  const [baseLineHeight, setBaseLineHeight] = useState(1.7);
  const [baseTextColor, setBaseTextColor] = useState('#121212');

  // Generate Google Fonts URL
  const googleFontsUrl = useMemo(() => {
    const selectedFont = FONT_OPTIONS.find((f) => f.value === fontFamily);
    if (selectedFont?.googleFont) {
      return `https://fonts.googleapis.com/css2?family=${selectedFont.googleFont}&display=swap`;
    }
    return null;
  }, [fontFamily]);

  // Heading styles
  const [h1Size, setH1Size] = useState(28);
  const [h2Size, setH2Size] = useState(20);
  const [h3Size, setH3Size] = useState(18);
  const [h4Size, setH4Size] = useState(16);
  const [headingColor, setHeadingColor] = useState('#171717');

  // Paragraph
  const [paragraphMargin, setParagraphMargin] = useState(0.5);

  // Lists
  const [listPadding, setListPadding] = useState(1.5);
  const [listItemSpacing, setListItemSpacing] = useState(0.25);

  // Links
  const [linkColor, setLinkColor] = useState('#4f46e5');

  // Tables
  const [tableCellPadding, setTableCellPadding] = useState(0.5);
  const [tableBorderColor, setTableBorderColor] = useState('#e5e7eb');
  const [tableHeaderBg, setTableHeaderBg] = useState('#f9fafb');

  // Export modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const resetToDefaults = () => {
    setFontFamily(FONT_OPTIONS[0].value);
    setBaseFontSize(15);
    setBaseLineHeight(1.7);
    setBaseTextColor('#121212');
    setH1Size(28);
    setH2Size(20);
    setH3Size(18);
    setH4Size(16);
    setHeadingColor('#171717');
    setParagraphMargin(0.5);
    setListPadding(1.5);
    setListItemSpacing(0.25);
    setLinkColor('#4f46e5');
    setTableCellPadding(0.5);
    setTableBorderColor('#e5e7eb');
    setTableHeaderBg('#f9fafb');
  };

  const getCssOutput = () => {
    return `/* Paste these overrides into index.css under .markdown-content */

.markdown-content {
  font-family: ${fontFamily};
  color: ${baseTextColor};
  font-size: ${baseFontSize}px;
  line-height: ${baseLineHeight};
  letter-spacing: 0 !important;
}

.markdown-content h1 {
  font-size: ${h1Size}px;
  font-weight: 600;
  color: ${headingColor};
}

.markdown-content h2 {
  font-size: ${h2Size}px;
  font-weight: 600;
  color: ${headingColor};
}

.markdown-content h3 {
  font-size: ${h3Size}px;
  font-weight: 600;
  color: ${headingColor};
}

.markdown-content h4 {
  font-size: ${h4Size}px;
  font-weight: 600;
  color: ${headingColor};
}

.markdown-content p {
  margin-bottom: ${paragraphMargin}em;
}

.markdown-content ul,
.markdown-content ol {
  padding-left: ${listPadding}em;
}

.markdown-content li {
  margin-bottom: ${listItemSpacing}em;
}

.markdown-content a {
  color: ${linkColor};
  text-decoration: underline;
}

.markdown-content th,
.markdown-content td {
  padding: ${tableCellPadding}em 1em;
  border: 1px solid ${tableBorderColor};
}

.markdown-content th {
  background-color: ${tableHeaderBg};
}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCssOutput());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      {/* Load Google Fonts */}
      {googleFontsUrl && <link href={googleFontsUrl} rel="stylesheet" />}

      {/* Override styles applied on top of markdown-content */}
      <style>{`
        .md-preview.markdown-content {
          font-family: ${fontFamily};
          color: ${baseTextColor};
          font-size: ${baseFontSize}px;
          line-height: ${baseLineHeight};
        }
        .md-preview h1 { font-size: ${h1Size}px !important; color: ${headingColor} !important; }
        .md-preview h2 { font-size: ${h2Size}px !important; color: ${headingColor} !important; }
        .md-preview h3 { font-size: ${h3Size}px !important; color: ${headingColor} !important; }
        .md-preview h4 { font-size: ${h4Size}px !important; color: ${headingColor} !important; }
        .md-preview p { margin-bottom: ${paragraphMargin}em; }
        .md-preview ul, .md-preview ol { padding-left: ${listPadding}em; }
        .md-preview li { margin-bottom: ${listItemSpacing}em; }
        .md-preview a { color: ${linkColor}; }
        .md-preview th, .md-preview td { padding: ${tableCellPadding}em 1em; border-color: ${tableBorderColor}; }
        .md-preview th { background-color: ${tableHeaderBg}; }
      `}</style>

      <div className="flex h-screen bg-gray-50">
        {/* Control Panel */}
        <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-900">Style Controls</h2>
              <button
                onClick={resetToDefaults}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
              >
                Reset
              </button>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Export size={14} />
              Export CSS
            </button>
          </div>

          <div className="px-3">
            {/* Global Settings */}
            <CollapsibleSection
              title="Global"
              isOpen={openSections.global}
              onToggle={() => toggleSection('global')}
            >
              <SelectControl
                label="Font Family"
                value={fontFamily}
                options={FONT_OPTIONS.map((f) => ({ name: f.name, value: f.value }))}
                onChange={setFontFamily}
              />
              <SliderControl
                label="Font Size"
                value={baseFontSize}
                min={12}
                max={18}
                step={1}
                unit="px"
                onChange={setBaseFontSize}
              />
              <SliderControl
                label="Line Height"
                value={baseLineHeight}
                min={1.2}
                max={2}
                step={0.1}
                onChange={setBaseLineHeight}
              />
              <ColorControl label="Text Color" value={baseTextColor} onChange={setBaseTextColor} />
            </CollapsibleSection>

            {/* Headings */}
            <CollapsibleSection
              title="Headings"
              isOpen={openSections.headings}
              onToggle={() => toggleSection('headings')}
            >
              <SliderControl
                label="H1 Size"
                value={h1Size}
                min={20}
                max={40}
                step={1}
                unit="px"
                onChange={setH1Size}
              />
              <SliderControl
                label="H2 Size"
                value={h2Size}
                min={16}
                max={32}
                step={1}
                unit="px"
                onChange={setH2Size}
              />
              <SliderControl
                label="H3 Size"
                value={h3Size}
                min={14}
                max={28}
                step={1}
                unit="px"
                onChange={setH3Size}
              />
              <SliderControl
                label="H4 Size"
                value={h4Size}
                min={12}
                max={24}
                step={1}
                unit="px"
                onChange={setH4Size}
              />
              <ColorControl label="Heading Color" value={headingColor} onChange={setHeadingColor} />
            </CollapsibleSection>

            {/* Paragraph */}
            <CollapsibleSection
              title="Paragraph"
              isOpen={openSections.paragraph}
              onToggle={() => toggleSection('paragraph')}
            >
              <SliderControl
                label="Margin Bottom"
                value={paragraphMargin}
                min={0.25}
                max={1.5}
                step={0.05}
                unit="em"
                onChange={setParagraphMargin}
              />
            </CollapsibleSection>

            {/* Lists */}
            <CollapsibleSection
              title="Lists"
              isOpen={openSections.lists}
              onToggle={() => toggleSection('lists')}
            >
              <SliderControl
                label="Left Padding"
                value={listPadding}
                min={0.5}
                max={3}
                step={0.1}
                unit="em"
                onChange={setListPadding}
              />
              <SliderControl
                label="Item Spacing"
                value={listItemSpacing}
                min={0}
                max={0.75}
                step={0.05}
                unit="em"
                onChange={setListItemSpacing}
              />
            </CollapsibleSection>

            {/* Links */}
            <CollapsibleSection
              title="Links"
              isOpen={openSections.links}
              onToggle={() => toggleSection('links')}
            >
              <ColorControl label="Link Color" value={linkColor} onChange={setLinkColor} />
            </CollapsibleSection>

            {/* Table */}
            <CollapsibleSection
              title="Table"
              isOpen={openSections.table}
              onToggle={() => toggleSection('table')}
            >
              <SliderControl
                label="Cell Padding"
                value={tableCellPadding}
                min={0.25}
                max={1}
                step={0.05}
                unit="em"
                onChange={setTableCellPadding}
              />
              <ColorControl
                label="Border Color"
                value={tableBorderColor}
                onChange={setTableBorderColor}
              />
              <ColorControl label="Header Bg" value={tableHeaderBg} onChange={setTableHeaderBg} />
            </CollapsibleSection>
          </div>

          <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
            Uses: markdown-content + Streamdown
            <br />
            Same as ChatMessage.tsx
          </div>
        </div>

        {/* Preview/Edit Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toggle Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye size={14} />
                Preview
              </button>
              <button
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'edit'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <PencilSimple size={14} />
                Edit Markdown
              </button>
            </div>
            {viewMode === 'edit' && (
              <button
                onClick={() => setMarkdownContent(sampleMarkdownContent)}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
              >
                Reset to default
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {viewMode === 'preview' ? (
              <div className="md-preview markdown-content max-w-4xl mx-auto">
                <Streamdown parseIncompleteMarkdown={false}>{markdownContent}</Streamdown>
              </div>
            ) : (
              <textarea
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                className="w-full h-full min-h-[600px] max-w-4xl mx-auto p-6 text-sm font-mono bg-white border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                placeholder="Paste or type your markdown here..."
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col"
            style={{ maxHeight: '80vh' }}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Export CSS</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 min-h-0 p-4 flex flex-col">
              <p className="flex-shrink-0 text-xs text-gray-600 mb-3">
                Copy this CSS and paste it into index.css to update the markdown-content styles.
              </p>
              <div className="flex-1 min-h-0 overflow-auto bg-gray-50 rounded-lg border border-gray-200">
                <pre className="p-4 text-xs font-mono text-gray-700 whitespace-pre">
                  {getCssOutput()}
                </pre>
              </div>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-2 px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy CSS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const meta: Meta<typeof MarkdownFormattingExperiment> = {
  title: 'Three Pane/Experiments/Markdown Formatter/Markdown Formatting',
  component: MarkdownFormattingExperiment,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownFormattingExperiment>;

export const Default: Story = {};
