import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  FunctionIcon,
  PencilSimpleIcon,
  PlusIcon,
  SparkleIcon,
  CaretDownIcon,
  CaretRightIcon,
} from '@phosphor-icons/react';
import { TertiaryIconButton, GhostButton, PrimaryButton } from '../forms/buttons';
import { Select } from '../forms/dropdown';
import { ReportTable } from '../ReportTable';
import type { ReportColumn } from '../ReportTable/ReportTable';
import { FilterButton, type FilterGroup, type FilterField } from '../forms/filter';

// ============================================================================
// Types
// ============================================================================

export interface DrilldownFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface DrilldownColumn {
  id: string;
  label: string;
  type?: 'string' | 'number' | 'currency' | 'date';
  /** Whether this is an AI-generated column */
  isAI?: boolean;
  /** Data source for AI columns (e.g., 'Snowflake', 'Gong Calls', 'Von IQ') */
  aiSource?: string;
}

/** Table data for tabs */
export interface DrilldownTable {
  id: string;
  name: string;
  columns: DrilldownColumn[];
  rows: Record<string, unknown>[];
}

/** AI-generated column */
export interface AIColumn {
  id: string;
  name: string;
  prompt: string;
  isGenerating?: boolean;
}

export interface InlineDrilldownPanelProps {
  isOpen: boolean;
  onClose: () => void;
  widgetName: string;
  /** Single table mode - columns */
  columns?: DrilldownColumn[];
  /** Single table mode - rows */
  rows?: Record<string, unknown>[];
  /** Multi-table mode - array of tables for tabs */
  tables?: DrilldownTable[];
  filters?: DrilldownFilter[];
  formula?: string;
  onFiltersChange?: (filters: DrilldownFilter[]) => void;
  onFormulaChange?: (formula: string) => void;
  /** Available fields for filter dropdown */
  availableFields?: string[];
  /** Pre-applied filter groups for the new FilterButton */
  defaultFilterGroups?: FilterGroup[];
}

// ============================================================================
// Formula Functions
// ============================================================================

const FORMULA_FUNCTIONS = [
  { value: 'SUM(field)', label: 'SUM - Sum of values' },
  { value: 'AVG(field)', label: 'AVG - Average of values' },
  { value: 'COUNT(field)', label: 'COUNT - Count of records' },
  { value: 'MAX(field)', label: 'MAX - Maximum value' },
  { value: 'MIN(field)', label: 'MIN - Minimum value' },
];

// ============================================================================
// Formula Popover Component
// ============================================================================

interface FormulaPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  formula: string;
  fieldOptions: { value: string; label: string }[];
  onFormulaChange: (formula: string) => void;
}

const FormulaPopover: React.FC<FormulaPopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
  formula,
  fieldOptions,
  onFormulaChange,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [localFormula, setLocalFormula] = useState(formula);
  const [isEditing, setIsEditing] = useState(!formula);

  // Reset state when popover opens
  useEffect(() => {
    if (isOpen) {
      setLocalFormula(formula);
      setIsEditing(!formula);
    }
  }, [isOpen, formula]);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 420 - 16)),
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const handleApply = () => {
    onFormulaChange(localFormula);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-[400px] bg-white rounded-xl shadow-xl border border-gray-200 z-[10000]"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-900">Formula</span>
        {!isEditing && localFormula && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
          >
            <PencilSimpleIcon size={14} />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Display mode - show existing formula */}
        {!isEditing && localFormula && (
          <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm text-emerald-400 overflow-x-auto">
            {localFormula}
          </div>
        )}

        {/* Empty state */}
        {!isEditing && !localFormula && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-3">No formula defined.</p>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <PlusIcon size={14} weight="bold" />
              <span>Add Formula</span>
            </button>
          </div>
        )}

        {/* Edit mode */}
        {isEditing && (
          <div className="space-y-3">
            <textarea
              value={localFormula}
              onChange={(e) => setLocalFormula(e.target.value)}
              placeholder="Enter formula (e.g., SUM(Amount) WHERE Stage = 'Closed Won')"
              className="w-full px-3 py-2 text-sm bg-gray-900 text-emerald-400 font-mono border border-gray-700 rounded-lg resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors placeholder:text-gray-500"
              rows={3}
            />

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  options={FORMULA_FUNCTIONS}
                  value=""
                  onChange={(value) => {
                    setLocalFormula((prev) => (prev ? `${prev} ${value}` : value));
                  }}
                  placeholder="Insert function..."
                />
              </div>
              <div className="flex-1">
                <Select
                  options={fieldOptions}
                  value=""
                  onChange={(value) => {
                    setLocalFormula((prev) => (prev ? `${prev}${value}` : value));
                  }}
                  placeholder="Insert field..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        {isEditing ? (
          <>
            <GhostButton
              onClick={() => {
                if (formula) {
                  setIsEditing(false);
                  setLocalFormula(formula);
                } else {
                  onClose();
                }
              }}
            >
              Cancel
            </GhostButton>
            <PrimaryButton onClick={handleApply}>Apply Formula</PrimaryButton>
          </>
        ) : (
          <GhostButton onClick={onClose}>Close</GhostButton>
        )}
      </div>
    </motion.div>,
    document.body
  );
};

// ============================================================================
// AI Column Popover Component
// ============================================================================

interface AIColumnPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  column: AIColumn | null;
  onSave: (column: AIColumn) => void;
  onDelete?: (columnId: string) => void;
}

const AIColumnPopover: React.FC<AIColumnPopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
  column,
  onSave,
  onDelete,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [columnName, setColumnName] = useState(column?.name || '');
  const [prompt, setPrompt] = useState(column?.prompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [reasoning, setReasoning] = useState<string[]>([]);

  const isEditing = !!column;

  // Reset state when popover opens
  useEffect(() => {
    if (isOpen) {
      setColumnName(column?.name || '');
      setPrompt(column?.prompt || '');
      setIsGenerating(false);
      setShowReasoning(false);
      setReasoning([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, column]);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left - 150, window.innerWidth - 420 - 16)),
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const handleGenerate = () => {
    if (!columnName.trim() || !prompt.trim()) return;

    setIsGenerating(true);
    setShowReasoning(true);
    setReasoning([]);

    // Simulate AI reasoning steps
    const reasoningSteps = [
      'Analyzing the data structure and available columns...',
      'Understanding the prompt requirements...',
      `Generating "${columnName}" values based on: "${prompt}"`,
      'Applying logic to each row...',
      'Validating generated values...',
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < reasoningSteps.length) {
        setReasoning((prev) => [...prev, reasoningSteps[stepIndex]]);
        stepIndex++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);

        // Save the column
        onSave({
          id: column?.id || `ai-col-${Date.now()}`,
          name: columnName,
          prompt: prompt,
        });
        onClose();
      }
    }, 400);
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-[400px] bg-white rounded-xl shadow-xl border border-gray-200 z-[10000]"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SparkleIcon size={16} className="text-indigo-600" />
          <span className="text-sm font-medium text-gray-900">
            {isEditing ? 'Edit AI Column' : 'Add AI Column'}
          </span>
        </div>
        {isEditing && onDelete && (
          <button
            onClick={() => {
              onDelete(column.id);
              onClose();
            }}
            className="text-[12px] text-red-600 hover:text-red-700 cursor-pointer"
          >
            Delete
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Column Name */}
        <div>
          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Column Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            placeholder="e.g., Risk Score, Next Action"
            disabled={isGenerating}
            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow disabled:opacity-50"
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Generation Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe how to generate values for this column based on the row data..."
            disabled={isGenerating}
            rows={3}
            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none disabled:opacity-50"
          />
          <p className="mt-1.5 text-[11px] text-gray-500">
            Example: "Calculate a risk score (1-10) based on deal size, stage, and days since last
            activity"
          </p>
        </div>

        {/* Reasoning Section */}
        {showReasoning && (
          <div className="bg-gray-50 rounded-lg p-3">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-gray-700 mb-2 cursor-pointer"
            >
              {showReasoning ? <CaretDownIcon size={12} /> : <CaretRightIcon size={12} />}
              AI Reasoning
            </button>
            <div className="space-y-1.5">
              {reasoning.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 text-[12px] text-gray-600"
                >
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <span>{step}</span>
                </motion.div>
              ))}
              {isGenerating && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2 text-[12px] text-gray-400"
                >
                  <SparkleIcon size={12} className="text-indigo-500" />
                  <span>Processing...</span>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <GhostButton onClick={onClose} disabled={isGenerating}>
          Cancel
        </GhostButton>
        <PrimaryButton
          onClick={handleGenerate}
          disabled={!columnName.trim() || !prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <span className="flex items-center gap-1.5">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <SparkleIcon size={14} />
              </motion.span>
              Generating...
            </span>
          ) : isEditing ? (
            'Update Column'
          ) : (
            'Generate Column'
          )}
        </PrimaryButton>
      </div>
    </motion.div>,
    document.body
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const InlineDrilldownPanel: React.FC<InlineDrilldownPanelProps> = ({
  isOpen,
  onClose,
  widgetName,
  columns: singleColumns,
  rows: singleRows,
  tables,
  filters: _filters = [],
  formula = '',
  onFiltersChange: _onFiltersChange,
  onFormulaChange,
  availableFields = [],
  defaultFilterGroups,
}) => {
  // Prefixed with _ to indicate intentionally unused (for future use)
  void _filters;
  void _onFiltersChange;

  const [localFormula, setLocalFormula] = useState(formula);
  const [showFormulaPopover, setShowFormulaPopover] = useState(false);
  const [panelHeight, setPanelHeight] = useState(90);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [, setAiColumns] = useState<AIColumn[]>([]);
  const [showAIColumnPopover, setShowAIColumnPopover] = useState(false);
  const [editingAIColumn, setEditingAIColumn] = useState<AIColumn | null>(null);
  const [, setAiColumnData] = useState<Record<string, Record<number, string>>>({});
  const aiColumnButtonRef = useRef<HTMLButtonElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter groups state for new FilterButton
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(
    defaultFilterGroups || [
      {
        id: 'default-group',
        conditions: [{ id: 'cond1', field: '', operator: 'contains', value: '' }],
        connector: 'and',
      },
    ]
  );

  // Normalize tables - support both single table mode and multi-table mode
  const normalizedTables: DrilldownTable[] = useMemo(
    () =>
      tables && tables.length > 0
        ? tables
        : singleColumns && singleRows
          ? [{ id: 'main', name: widgetName, columns: singleColumns, rows: singleRows }]
          : [],
    [tables, singleColumns, singleRows, widgetName]
  );

  // Set initial active tab
  useEffect(() => {
    if (normalizedTables.length > 0 && !activeTabId) {
      setActiveTabId(normalizedTables[0].id);
    }
  }, [normalizedTables, activeTabId]);

  const formulaButtonRef = useRef<HTMLButtonElement>(null);

  // Get current table data
  const currentTable = normalizedTables.find((t) => t.id === activeTabId) || normalizedTables[0];
  const columns = useMemo(() => currentTable?.columns || [], [currentTable?.columns]);
  const rows = currentTable?.rows || [];

  // Convert DrilldownColumns to ReportColumns for ReportTable
  const reportColumns: ReportColumn[] = useMemo(() => {
    return columns.map((col) => {
      // Map DrilldownColumn type to ReportColumn type
      // DrilldownColumn uses 'string' but ReportColumn uses 'text'
      let mappedType: ReportColumn['type'] = 'text';
      if (col.type === 'number') mappedType = 'number';
      else if (col.type === 'currency') mappedType = 'currency';
      else if (col.type === 'date') mappedType = 'date';
      // 'string' and undefined both map to 'text'

      return {
        id: col.id,
        label: col.label,
        type: mappedType,
        isAI: col.isAI,
        sortable: true,
        width: col.type === 'currency' ? 130 : col.type === 'number' ? 100 : 150,
      };
    });
  }, [columns]);

  // Convert columns to filter fields for FilterButton
  const filterFields: FilterField[] = useMemo(() => {
    return columns.map((col) => ({
      value: col.id,
      label: col.label,
      type:
        col.type === 'number' || col.type === 'currency'
          ? 'number'
          : col.type === 'date'
            ? 'date'
            : 'text',
    }));
  }, [columns]);

  // Derive available fields from columns if not provided
  const fields = availableFields.length > 0 ? availableFields : columns.map((c) => c.label);
  const fieldOptions = fields.map((f) => ({ value: f, label: f }));

  // Handle resize drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startHeightRef.current = panelHeight;
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    },
    [panelHeight]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const containerHeight = containerRef.current.parentElement?.clientHeight || window.innerHeight;
    const deltaY = startYRef.current - e.clientY;
    const deltaPercent = (deltaY / containerHeight) * 100;
    const newHeight = Math.min(95, Math.max(20, startHeightRef.current + deltaPercent));
    setPanelHeight(newHeight);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Attach global listeners for resize
  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Close popovers when panel closes
  useEffect(() => {
    if (!isOpen) {
      setShowFormulaPopover(false);
    }
  }, [isOpen]);

  // Handle formula changes from popover
  const handleFormulaChange = (newFormula: string) => {
    setLocalFormula(newFormula);
    onFormulaChange?.(newFormula);
  };

  // Handle AI column save
  const handleAIColumnSave = (column: AIColumn) => {
    setAiColumns((prev) => {
      const exists = prev.find((c) => c.id === column.id);
      if (exists) {
        return prev.map((c) => (c.id === column.id ? column : c));
      }
      return [...prev, column];
    });

    // Generate sample data for the column
    const sampleValues = [
      '8/10 - High potential',
      '6/10 - Medium risk',
      '9/10 - Strong fit',
      '4/10 - Needs attention',
      '7/10 - Good progress',
    ];

    // Simulate generating data for each row
    setTimeout(() => {
      const newData: Record<number, string> = {};
      rows.forEach((_, idx) => {
        newData[idx] = sampleValues[idx % sampleValues.length];
      });
      setAiColumnData((prev) => ({
        ...prev,
        [column.id]: newData,
      }));
    }, 500);
  };

  // Handle AI column delete
  const handleAIColumnDelete = (columnId: string) => {
    setAiColumns((prev) => prev.filter((c) => c.id !== columnId));
    setAiColumnData((prev) => {
      const newData = { ...prev };
      delete newData[columnId];
      return newData;
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      <motion.div
        ref={containerRef}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl border-t border-gray-200 flex flex-col z-50 overflow-hidden"
        style={{ height: `${panelHeight}%` }}
      >
        {/* Resize Handle */}
        <div
          ref={resizeRef}
          onMouseDown={handleMouseDown}
          className="absolute -top-2 left-0 right-0 h-4 cursor-ns-resize flex justify-center items-center group"
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full group-hover:bg-gray-400 transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Widget Name or Tabs */}
            {normalizedTables.length > 1 ? (
              <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                {normalizedTables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setActiveTabId(table.id)}
                    className={`
                    px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer
                    ${
                      activeTabId === table.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-800 hover:text-gray-900'
                    }
                  `}
                  >
                    {table.name}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-900 truncate">{widgetName}</span>
            )}

            {/* Filters Button - using new FilterButton with AI prompt */}
            <FilterButton
              fields={filterFields}
              groups={filterGroups}
              onGroupsChange={setFilterGroups}
              showAIPrompt={true}
              aiPromptPlaceholder="e.g., Show deals > $100K"
            />

            {/* Formula Button */}
            <button
              ref={formulaButtonRef}
              onClick={() => {
                setShowFormulaPopover(!showFormulaPopover);
              }}
              className={`
              flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-colors cursor-pointer
              ${
                showFormulaPopover
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300'
              }
            `}
            >
              <FunctionIcon size={14} />
              <span>Formula</span>
            </button>
          </div>

          <TertiaryIconButton icon={<XIcon size={16} />} onClick={onClose} title="Close" />
        </div>

        {/* Table - using ReportTable */}
        <div className="flex-1 overflow-hidden p-4">
          <ReportTable
            columns={reportColumns}
            data={rows as Record<string, unknown>[]}
            pageSize={25}
            showPagination={rows.length > 25}
            nameKey="name"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-gray-500">
            {rows.length} row{rows.length !== 1 ? 's' : ''}
          </span>
          <div className="text-xs text-gray-400">Drag the top edge to resize</div>
        </div>

        {/* Formula Popover */}
        <AnimatePresence>
          <FormulaPopover
            isOpen={showFormulaPopover}
            onClose={() => setShowFormulaPopover(false)}
            anchorRef={formulaButtonRef}
            formula={localFormula}
            fieldOptions={fieldOptions}
            onFormulaChange={handleFormulaChange}
          />
        </AnimatePresence>

        {/* AI Column Popover */}
        <AnimatePresence>
          <AIColumnPopover
            isOpen={showAIColumnPopover}
            onClose={() => {
              setShowAIColumnPopover(false);
              setEditingAIColumn(null);
            }}
            anchorRef={aiColumnButtonRef}
            column={editingAIColumn}
            onSave={handleAIColumnSave}
            onDelete={handleAIColumnDelete}
          />
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default InlineDrilldownPanel;
