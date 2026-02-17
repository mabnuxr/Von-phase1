import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  CaretLeftIcon,
  CaretRightIcon,
  PlusIcon,
  CaretUpIcon,
  CaretDownIcon,
  XIcon,
} from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle, Color, FontFamily, FontSize } from '@tiptap/extension-text-style';
import { Markdown } from 'tiptap-markdown';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import type { Artifact, DocumentArtifact, SlidesArtifact, SpreadsheetArtifact } from './ChatViewV2';
import { downloadDocument, downloadSlides, downloadSpreadsheet } from './artifactDownload';
import { downloadCSV } from './spreadsheetUtils';
import { ArtifactTitleBar } from './ArtifactTitleBar';
import { DocumentEditorToolbar } from './DocumentEditorToolbar';
import { SpreadsheetToolbar, type CellStyle } from './SpreadsheetToolbar';
import './DocumentEditor.css';

// ============================================================================
// Shared Markdown Components
// ============================================================================

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-2xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xl font-medium text-gray-900 mt-8 mb-4">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-medium text-gray-900 mt-6 mb-3">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-gray-900 mb-4 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-medium text-gray-900">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="text-sm text-gray-900 mb-4 space-y-1.5 list-disc pl-5">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="text-sm text-gray-900 mb-4 space-y-1.5 list-decimal pl-5">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm text-gray-900 leading-relaxed">{children}</li>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-5 rounded-lg border border-gray-200">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-gray-50">{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-200">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-100">{children}</td>
  ),
  hr: () => <hr className="my-8 border-gray-200" />,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-indigo-300 pl-4 py-1 my-4 bg-indigo-50/50 rounded-r">
      {children}
    </blockquote>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-gray-900 italic">{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-[12px] font-mono text-gray-900">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="p-4 bg-gray-50 rounded-lg overflow-x-auto mb-4 text-[12px]">{children}</pre>
  ),
};

// Slide-specific markdown with larger text
const slideMarkdownComponents = {
  ...markdownComponents,
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-2xl font-semibold text-gray-900 mb-4">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xl font-medium text-gray-900 mt-4 mb-3">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-lg font-medium text-gray-900 mt-3 mb-2">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-base text-gray-900 mb-3 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="text-base text-gray-900 mb-3 space-y-2 list-disc pl-5">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="text-base text-gray-900 mb-3 space-y-2 list-decimal pl-5">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-base text-gray-900 leading-relaxed">{children}</li>
  ),
};

/** Tiny markdown components for slide thumbnail previews */
const thumbnailMarkdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xs font-semibold text-gray-900 mb-1">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xs font-medium text-gray-900 mt-1 mb-0.5">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-[11px] font-medium text-gray-900 mt-1 mb-0.5">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-[11px] text-gray-700 mb-1 leading-snug">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="text-[11px] text-gray-700 mb-1 list-disc pl-3">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="text-[11px] text-gray-700 mb-1 list-decimal pl-3">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-[11px] text-gray-700 leading-snug">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-medium">{children}</strong>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <table className="text-[10px] w-full border-collapse">{children}</table>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="text-left text-[10px] font-medium text-gray-600 border-b border-gray-200 px-1 py-0.5">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="text-[10px] text-gray-700 border-b border-gray-100 px-1 py-0.5">{children}</td>
  ),
  hr: () => <hr className="my-1 border-gray-200" />,
};

// ============================================================================
// Von Logo Watermark (for slides)
// ============================================================================

const VonWatermark: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="opacity-[0.08]"
  >
    <path
      d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
      fill="#6366f1"
    />
    <path
      d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
      stroke="white"
      strokeWidth="1.33"
    />
    <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
  </svg>
);

// ============================================================================
// Document Viewer with Edit Mode
// ============================================================================

interface DocumentViewerProps {
  artifact: DocumentArtifact;
  onClose?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ artifact, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Markdown.configure({ html: true }),
    ],
    content: artifact.content,
    editable: isEditing,
  });

  // Sync editable state
  const handleToggleEdit = useCallback(() => {
    const next = !isEditing;
    setIsEditing(next);
    editor?.setEditable(next);
  }, [isEditing, editor]);

  const downloadOptions = useMemo(
    () => [
      { label: 'Download as DOCX', onClick: () => downloadDocument(artifact) },
      { label: 'Download as PDF', onClick: () => console.log('PDF export coming soon') },
    ],
    [artifact]
  );

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center">
        <div className="flex-1">
          <ArtifactTitleBar
            title={artifact.title}
            downloadOptions={downloadOptions}
            isEditing={isEditing}
            onToggleEdit={handleToggleEdit}
          />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 mr-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <XIcon size={16} weight="bold" />
          </button>
        )}
      </div>

      {/* Toolbar when editing */}
      {isEditing && editor && <DocumentEditorToolbar editor={editor} />}

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/80 py-8">
        <div
          className="mx-auto bg-white rounded-sm shadow-sm border border-gray-200"
          style={{ maxWidth: '816px', minHeight: '1056px' }}
        >
          <div className="px-16 py-12">
            {isEditing && editor ? (
              <div className="document-editor">
                <EditorContent editor={editor} />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {artifact.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Slides Viewer with Edit Mode
// ============================================================================

interface SlidesViewerProps {
  artifact: SlidesArtifact;
  onClose?: () => void;
}

const SlidesViewer: React.FC<SlidesViewerProps> = ({ artifact, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const totalSlides = artifact.slides.length;

  // Editor lives at the SlidesViewer level so the toolbar can access it
  const currentSlide = artifact.slides[currentSlideIndex];
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
        TextStyle,
        Color,
        FontFamily,
        FontSize,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Highlight.configure({ multicolor: true }),
        Markdown.configure({ html: true }),
      ],
      content: `## ${currentSlide.title}\n\n${currentSlide.content}`,
      editable: isEditing,
    },
    [currentSlide.content, currentSlide.title]
  );

  const handlePrev = () => {
    if (currentSlideIndex > 0) setCurrentSlideIndex(currentSlideIndex - 1);
  };

  const handleNext = () => {
    if (currentSlideIndex < totalSlides - 1) setCurrentSlideIndex(currentSlideIndex + 1);
  };

  const handleToggleEdit = useCallback(() => {
    const next = !isEditing;
    setIsEditing(next);
    editor?.setEditable(next);
  }, [isEditing, editor]);

  const downloadOptions = useMemo(
    () => [
      { label: 'Download as PPTX', onClick: () => downloadSlides(artifact) },
      { label: 'Download as PDF', onClick: () => console.log('PDF export coming soon') },
    ],
    [artifact]
  );

  return (
    <div className="h-full w-full flex flex-col">
      {/* Title Bar */}
      <div className="flex items-center">
        <div className="flex-1">
          <ArtifactTitleBar
            title={artifact.title}
            downloadOptions={downloadOptions}
            isEditing={isEditing}
            onToggleEdit={handleToggleEdit}
          />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 mr-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <XIcon size={16} weight="bold" />
          </button>
        )}
      </div>

      {/* Toolbar when editing */}
      {isEditing && editor && <DocumentEditorToolbar editor={editor} />}

      {/* Main slide area */}
      <div className="flex-1 flex flex-col bg-gray-50/80 overflow-hidden">
        {/* Slide content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className="rounded-xl shadow-sm border border-gray-200 w-full overflow-hidden relative"
            style={{
              maxWidth: '960px',
              aspectRatio: '16 / 9',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Von template accent line at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[3px]"
              style={{
                background: 'linear-gradient(90deg, #FF9042 0%, #854FFF 100%)',
              }}
            />

            {/* Von watermark */}
            <div className="absolute bottom-3 right-4">
              <VonWatermark />
            </div>

            {/* Content */}
            <div className="h-full flex flex-col px-12 py-10 overflow-y-auto">
              {isEditing && editor ? (
                <div className="slide-editor h-full">
                  <EditorContent editor={editor} className="h-full" />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {currentSlide.title}
                  </h2>
                  <div className="flex-1 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={slideMarkdownComponents}>
                      {currentSlide.content}
                    </ReactMarkdown>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Slide counter */}
        <div className="flex items-center justify-center pb-4 bg-gray-50/80">
          <span className="text-xs text-gray-800/50 font-medium">
            Slide {currentSlideIndex + 1} of {totalSlides}
          </span>
        </div>

        {/* Bottom thumbnail strip with nav chevrons */}
        <div className="flex items-center gap-1 px-2 py-3 border-t border-gray-100 bg-white">
          {/* Left chevron */}
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <CaretLeftIcon size={16} weight="bold" />
          </button>

          {/* Slide previews */}
          <div className="flex-1 flex items-center gap-2.5 overflow-x-auto p-1">
            {artifact.slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`flex-shrink-0 rounded-lg overflow-hidden transition-all duration-150 cursor-pointer relative ${
                  idx === currentSlideIndex
                    ? 'ring-2 ring-indigo-400 shadow-sm'
                    : 'border border-gray-200 hover:border-gray-300 hover:shadow-xs'
                }`}
                style={{ width: '160px', height: '90px' }}
              >
                {/* Slide number tag */}
                <div className="absolute top-1 left-1 z-10 bg-black/50 text-white text-[8px] font-medium rounded px-1 py-px leading-tight">
                  {idx + 1}
                </div>
                {/* Scaled-down slide content preview */}
                <div
                  className="w-[640px] h-[360px] bg-white origin-top-left pointer-events-none"
                  style={{ transform: 'scale(0.25)' }}
                >
                  {/* Von accent line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[3px]"
                    style={{
                      background: 'linear-gradient(90deg, #FF9042 0%, #854FFF 100%)',
                      bottom: 0,
                      position: 'absolute',
                      width: '640px',
                    }}
                  />
                  <div className="px-10 py-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 leading-tight line-clamp-2">
                      {slide.title}
                    </h2>
                    <div
                      className="text-[11px] text-gray-700 leading-relaxed overflow-hidden"
                      style={{ maxHeight: '240px' }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={thumbnailMarkdownComponents}
                      >
                        {slide.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right chevron */}
          <button
            onClick={handleNext}
            disabled={currentSlideIndex === totalSlides - 1}
            className="flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <CaretRightIcon size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Spreadsheet Viewer with Edit Mode (Google Sheets-like)
// ============================================================================

interface SpreadsheetViewerProps {
  artifact: SpreadsheetArtifact;
  onClose?: () => void;
}

interface Sheet {
  id: string;
  name: string;
  columns: Array<{ id: string; label: string }>;
  data: Record<string, string | number>[];
}

// Number of extra empty rows/columns to show beyond data
const EXTRA_EMPTY_ROWS = 20;
const EXTRA_EMPTY_COLS = 5;

/** Generate extra column IDs like _col_A, _col_B, etc. */
function generateExtraColIds(
  startIdx: number,
  count: number
): Array<{ id: string; label: string }> {
  const cols: Array<{ id: string; label: string }> = [];
  for (let i = 0; i < count; i++) {
    const letter = String.fromCharCode(65 + ((startIdx + i) % 26));
    const suffix = Math.floor((startIdx + i) / 26);
    const label = suffix > 0 ? `${String.fromCharCode(64 + suffix)}${letter}` : letter;
    cols.push({ id: `_extra_col_${startIdx + i}`, label });
  }
  return cols;
}

const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({ artifact, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [sheets, setSheets] = useState<Sheet[]>([
    {
      id: 'sheet-1',
      name: 'Sheet 1',
      columns: [...artifact.columns],
      data: [...artifact.rows],
    },
  ]);
  const [activeSheetId, setActiveSheetId] = useState('sheet-1');
  const [activeCell, setActiveCell] = useState<{ rowIdx: number; colId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: 'asc' | 'desc' } | null>(
    null
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [cellStyle, setCellStyle] = useState<CellStyle>({
    fontFamily: 'Inter',
    fontSize: '13px',
    color: '#111827',
    backgroundColor: '',
  });
  const [cellStyles, setCellStyles] = useState<Record<string, Record<string, CellStyle>>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const resizeRef = useRef<{
    colId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Get active sheet
  const activeSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0];

  // Build full column list (data columns + extra empty columns)
  const allColumns = useMemo(() => {
    const dataCols = activeSheet.columns;
    const extraCols = generateExtraColIds(dataCols.length, EXTRA_EMPTY_COLS);
    return [...dataCols, ...extraCols];
  }, [activeSheet.columns]);

  // Build full row list (data rows + extra empty rows)
  const dataWithExtras = useMemo(() => {
    const rows = activeSheet.data;
    const emptyRows: Record<string, string | number>[] = Array.from(
      { length: EXTRA_EMPTY_ROWS },
      () => {
        const row: Record<string, string | number> = {};
        allColumns.forEach((col) => {
          row[col.id] = '';
        });
        return row;
      }
    );
    return [...rows, ...emptyRows];
  }, [activeSheet.data, allColumns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return dataWithExtras;
    const dataRowCount = activeSheet.data.length;
    const dataRows = dataWithExtras.slice(0, dataRowCount);
    const emptyRows = dataWithExtras.slice(dataRowCount);
    const sorted = [...dataRows].sort((a, b) => {
      const aVal = String(a[sortConfig.colId] ?? '');
      const bVal = String(b[sortConfig.colId] ?? '');
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
    return [...sorted, ...emptyRows];
  }, [dataWithExtras, sortConfig, activeSheet.data.length]);

  const handleToggleEdit = useCallback(() => {
    setIsEditing((prev) => !prev);
    if (isEditing) {
      setActiveCell(null);
    }
  }, [isEditing]);

  const handleCellClick = useCallback(
    (rowIdx: number, colId: string) => {
      if (!isEditing) return;
      const value = String(sortedData[rowIdx]?.[colId] ?? '');
      setActiveCell({ rowIdx, colId });
      setEditValue(value);
    },
    [isEditing, sortedData]
  );

  const commitEdit = useCallback(() => {
    if (!activeCell) return;
    const { rowIdx, colId } = activeCell;
    setSheets((prev) =>
      prev.map((sheet) => {
        if (sheet.id !== activeSheetId) return sheet;
        // Expand data array if editing into empty rows
        const newData = [...sheet.data];
        while (newData.length <= rowIdx) {
          const row: Record<string, string | number> = {};
          allColumns.forEach((c) => {
            row[c.id] = '';
          });
          newData.push(row);
        }
        newData[rowIdx] = { ...newData[rowIdx], [colId]: editValue };
        // Expand columns if editing into extra columns
        let newColumns = sheet.columns;
        if (!sheet.columns.some((c) => c.id === colId) && editValue) {
          const extraCol = allColumns.find((c) => c.id === colId);
          if (extraCol) {
            newColumns = [...sheet.columns, extraCol];
          }
        }
        return { ...sheet, data: newData, columns: newColumns };
      })
    );
  }, [activeCell, activeSheetId, editValue, allColumns]);

  const handleCellBlur = useCallback(() => {
    commitEdit();
    setActiveCell(null);
  }, [commitEdit]);

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!activeCell) return;
      const { rowIdx, colId } = activeCell;

      if (e.key === 'Enter') {
        commitEdit();
        // Move down
        const nextRow = rowIdx + 1;
        if (nextRow < sortedData.length) {
          const val = String(sortedData[nextRow]?.[colId] ?? '');
          setActiveCell({ rowIdx: nextRow, colId });
          setEditValue(val);
        } else {
          setActiveCell(null);
        }
        e.preventDefault();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        // Move right
        const colIndex = allColumns.findIndex((c) => c.id === colId);
        if (colIndex < allColumns.length - 1) {
          const nextCol = allColumns[colIndex + 1].id;
          const val = String(sortedData[rowIdx]?.[nextCol] ?? '');
          setActiveCell({ rowIdx, colId: nextCol });
          setEditValue(val);
        } else if (rowIdx < sortedData.length - 1) {
          const nextCol = allColumns[0].id;
          const val = String(sortedData[rowIdx + 1]?.[nextCol] ?? '');
          setActiveCell({ rowIdx: rowIdx + 1, colId: nextCol });
          setEditValue(val);
        }
      } else if (e.key === 'Escape') {
        setActiveCell(null);
      }
    },
    [activeCell, commitEdit, sortedData, allColumns]
  );

  const handleAddSheet = useCallback(() => {
    const newId = `sheet-${Date.now()}`;
    const defaultCols = [
      { id: 'col_a', label: 'A' },
      { id: 'col_b', label: 'B' },
      { id: 'col_c', label: 'C' },
    ];
    setSheets((prev) => [
      ...prev,
      { id: newId, name: `Sheet ${prev.length + 1}`, columns: defaultCols, data: [] },
    ]);
    setActiveSheetId(newId);
    setSortConfig(null);
  }, []);

  const handleSort = useCallback((colId: string) => {
    setSortConfig((prev) => {
      if (prev?.colId === colId) {
        if (prev.direction === 'asc') return { colId, direction: 'desc' };
        return null;
      }
      return { colId, direction: 'asc' };
    });
  }, []);

  const handleToolbarSort = useCallback(
    (direction: 'asc' | 'desc') => {
      if (activeCell) {
        setSortConfig({ colId: activeCell.colId, direction });
      }
    },
    [activeCell]
  );

  // Column resize handlers
  const handleResizeStart = useCallback(
    (colId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const currentWidth = columnWidths[colId] || 100;
      resizeRef.current = { colId, startX: e.clientX, startWidth: currentWidth };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeRef.current) return;
        const delta = moveEvent.clientX - resizeRef.current.startX;
        const newWidth = Math.max(40, resizeRef.current.startWidth + delta);
        setColumnWidths((prev) => ({ ...prev, [resizeRef.current!.colId]: newWidth }));
      };

      const handleMouseUp = () => {
        resizeRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [columnWidths]
  );

  const handleCellStyleChange = useCallback(
    (style: Partial<CellStyle>) => {
      setCellStyle((prev) => ({ ...prev, ...style }));
      if (activeCell) {
        const key = `${activeCell.rowIdx}-${activeCell.colId}`;
        setCellStyles((prev) => ({
          ...prev,
          [activeSheetId]: {
            ...(prev[activeSheetId] || {}),
            [key]: { ...(prev[activeSheetId]?.[key] || {}), ...style },
          },
        }));
      }
    },
    [activeCell, activeSheetId]
  );

  const getCellStyle = useCallback(
    (rowIdx: number, colId: string): React.CSSProperties => {
      const key = `${rowIdx}-${colId}`;
      const style = cellStyles[activeSheetId]?.[key];
      if (!style) return {};
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    },
    [cellStyles, activeSheetId]
  );

  const downloadOptions = useMemo(
    () => [
      { label: 'Download as XLSX', onClick: () => downloadSpreadsheet(artifact) },
      {
        label: 'Download as CSV',
        onClick: () => downloadCSV(artifact.columns, activeSheet.data, artifact.title),
      },
    ],
    [artifact, activeSheet.data]
  );

  return (
    <div className="h-full w-full flex flex-col">
      {/* Title Bar */}
      <div className="flex items-center">
        <div className="flex-1">
          <ArtifactTitleBar
            title={artifact.title}
            downloadOptions={downloadOptions}
            isEditing={isEditing}
            onToggleEdit={handleToggleEdit}
          />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 mr-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <XIcon size={16} weight="bold" />
          </button>
        )}
      </div>

      {/* Toolbar when editing */}
      {isEditing && (
        <SpreadsheetToolbar
          cellStyle={cellStyle}
          onCellStyleChange={handleCellStyleChange}
          onSort={handleToolbarSort}
          sortDirection={sortConfig?.direction || null}
        />
      )}

      {/* Table — flush edge-to-edge like Google Sheets */}
      <div className="flex-1 overflow-auto">
        <table className="text-[13px] border-collapse" style={{ minWidth: '100%' }}>
          <thead className="sticky top-0 z-10">
            <tr>
              {/* Row number header */}
              <th className="bg-gray-50 border-b border-r border-gray-200 px-2 py-1.5 text-center text-[11px] font-medium text-gray-500 w-10 min-w-[40px]" />
              {allColumns.map((col) => (
                <th
                  key={col.id}
                  className="bg-gray-50 border-b border-r border-gray-200 px-2 py-1.5 text-left text-[11px] font-medium text-gray-600 whitespace-nowrap relative select-none"
                  style={{
                    width: columnWidths[col.id] ? `${columnWidths[col.id]}px` : '100px',
                    minWidth: '40px',
                  }}
                >
                  <div
                    className={`flex items-center gap-1 ${isEditing ? 'cursor-pointer' : ''}`}
                    onClick={() => isEditing && handleSort(col.id)}
                  >
                    <span className="truncate">{col.label}</span>
                    {sortConfig?.colId === col.id &&
                      (sortConfig.direction === 'asc' ? (
                        <CaretUpIcon
                          size={10}
                          weight="bold"
                          className="text-indigo-600 flex-shrink-0"
                        />
                      ) : (
                        <CaretDownIcon
                          size={10}
                          weight="bold"
                          className="text-indigo-600 flex-shrink-0"
                        />
                      ))}
                  </div>

                  {/* Resize handle */}
                  <div
                    onMouseDown={(e) => handleResizeStart(col.id, e)}
                    className="absolute right-0 top-0 bottom-0 w-[3px] cursor-col-resize hover:bg-indigo-400 transition-colors"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIdx) => {
              const isDataRow = rowIdx < activeSheet.data.length;
              return (
                <tr key={rowIdx} className="group">
                  {/* Row number */}
                  <td className="bg-gray-50 border-b border-r border-gray-200 px-2 py-0 text-center text-[11px] text-gray-400 font-medium w-10 min-w-[40px]">
                    {rowIdx + 1}
                  </td>
                  {allColumns.map((col) => {
                    const isFocused = activeCell?.rowIdx === rowIdx && activeCell?.colId === col.id;
                    const cellValue = String(row[col.id] ?? '');

                    return (
                      <td
                        key={col.id}
                        className={`border-b border-r border-gray-200 relative ${
                          isEditing ? 'cursor-cell' : ''
                        } ${!isDataRow && !isFocused ? 'bg-white' : ''}`}
                        style={{
                          padding: 0,
                          height: '28px',
                          ...getCellStyle(rowIdx, col.id),
                        }}
                        onClick={() => handleCellClick(rowIdx, col.id)}
                      >
                        {isFocused ? (
                          <input
                            ref={inputRef}
                            autoFocus
                            className="w-full h-full px-2 text-[13px] text-gray-900 border-none outline-none bg-white"
                            style={{
                              boxShadow: '0 0 0 2px #6366f1',
                              position: 'relative',
                              zIndex: 5,
                              ...getCellStyle(rowIdx, col.id),
                            }}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleCellKeyDown}
                          />
                        ) : (
                          <div className="px-2 py-1 truncate h-full flex items-center text-gray-900">
                            {cellValue}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sheet tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        {sheets.map((sheet) => (
          <button
            key={sheet.id}
            onClick={() => {
              setActiveSheetId(sheet.id);
              setActiveCell(null);
              setSortConfig(null);
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
              sheet.id === activeSheetId
                ? 'bg-white text-gray-900 border border-gray-200 shadow-xs'
                : 'text-gray-600 hover:bg-white/60 border border-transparent'
            }`}
          >
            {sheet.name}
          </button>
        ))}
        <button
          onClick={handleAddSheet}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-md transition-colors cursor-pointer"
          title="Add sheet"
        >
          <PlusIcon size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Main ArtifactViewer Component
// ============================================================================

export interface ArtifactViewerProps {
  artifact: Artifact;
  onDownload?: () => void;
  onClose?: () => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact, onClose }) => {
  return (
    <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
      {artifact.type === 'document' && <DocumentViewer artifact={artifact} onClose={onClose} />}
      {artifact.type === 'slides' && <SlidesViewer artifact={artifact} onClose={onClose} />}
      {artifact.type === 'spreadsheet' && (
        <SpreadsheetViewer artifact={artifact} onClose={onClose} />
      )}
      {artifact.type === 'dashboard' && (
        <div className="h-full flex items-center justify-center text-sm text-gray-500">
          Dashboard artifacts are rendered by DashboardV2
        </div>
      )}
    </div>
  );
};

export default ArtifactViewer;
