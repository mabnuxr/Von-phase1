import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  FunnelIcon,
  FunctionIcon,
  SparkleIcon,
  PencilSimpleIcon,
} from '@phosphor-icons/react';
import { TertiaryIconButton, GhostButton, PrimaryButton } from '../forms/buttons';

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
}

export interface WidgetDrilldownSheetProps {
  isOpen: boolean;
  onClose: () => void;
  widgetName: string;
  columns: DrilldownColumn[];
  rows: Record<string, unknown>[];
  filters?: DrilldownFilter[];
  formula?: string;
}

/** AI-generated column */
export interface AIColumn {
  id: string;
  name: string;
  prompt: string;
}

// ============================================================================
// Filter Popover Component
// ============================================================================

interface FilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  filters: DrilldownFilter[];
}

const FilterPopover: React.FC<FilterPopoverProps> = ({ isOpen, onClose, anchorRef, filters }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
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

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-[10000]"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Applied Filters
        </span>
      </div>
      <div className="p-3 space-y-2">
        {filters.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No filters applied</p>
        ) : (
          filters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg"
            >
              <span className="text-sm font-medium text-gray-900">{filter.field}</span>
              <span className="text-sm text-gray-500">{filter.operator}</span>
              <span className="text-sm text-indigo-600">{filter.value}</span>
            </div>
          ))
        )}
      </div>
    </motion.div>,
    document.body
  );
};

// ============================================================================
// Formula Popover Component
// ============================================================================

interface FormulaPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  formula: string;
}

const FormulaPopover: React.FC<FormulaPopoverProps> = ({ isOpen, onClose, anchorRef, formula }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 320),
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

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-[10000]"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Formula</span>
      </div>
      <div className="p-3">
        <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm text-emerald-400 overflow-x-auto">
          {formula}
        </div>
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
  const [reasoning, setReasoning] = useState<string[]>([]);

  const isEditing = !!column;

  useEffect(() => {
    if (isOpen) {
      setColumnName(column?.name || '');
      setPrompt(column?.prompt || '');
      setIsGenerating(false);
      setReasoning([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, column]);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left - 150, window.innerWidth - 400 - 16)),
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
    setReasoning([]);

    const reasoningSteps = [
      'Analyzing the data structure...',
      'Processing prompt requirements...',
      `Generating "${columnName}" values...`,
      'Validating generated results...',
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < reasoningSteps.length) {
        setReasoning((prev) => [...prev, reasoningSteps[stepIndex]]);
        stepIndex++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
        onSave({
          id: column?.id || `ai-col-${Date.now()}`,
          name: columnName,
          prompt: prompt,
        });
        onClose();
      }
    }, 350);
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-[380px] bg-white rounded-xl shadow-xl border border-gray-200 z-[10000]"
      style={{ top: position.top, left: position.left }}
    >
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

      <div className="p-4 space-y-3">
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
            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Generation Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe how to generate values for this column..."
            disabled={isGenerating}
            rows={2}
            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none disabled:opacity-50"
          />
        </div>

        {reasoning.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[11px] font-medium text-gray-700 mb-1.5">AI Reasoning</p>
            <div className="space-y-1">
              {reasoning.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-1.5 text-[11px] text-gray-600"
                >
                  <span className="text-indigo-500">•</span>
                  <span>{step}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <GhostButton onClick={onClose} disabled={isGenerating}>
          Cancel
        </GhostButton>
        <PrimaryButton
          onClick={handleGenerate}
          disabled={!columnName.trim() || !prompt.trim() || isGenerating}
        >
          {isGenerating ? 'Generating...' : isEditing ? 'Update Column' : 'Generate Column'}
        </PrimaryButton>
      </div>
    </motion.div>,
    document.body
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const WidgetDrilldownSheet: React.FC<WidgetDrilldownSheetProps> = ({
  isOpen,
  onClose,
  widgetName,
  columns,
  rows,
  filters = [],
  formula,
}) => {
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showFormulaPopover, setShowFormulaPopover] = useState(false);
  const [aiColumns, setAiColumns] = useState<AIColumn[]>([]);
  const [aiColumnData, setAiColumnData] = useState<Record<string, Record<number, string>>>({});
  const [showAIColumnPopover, setShowAIColumnPopover] = useState(false);
  const [editingAIColumn, setEditingAIColumn] = useState<AIColumn | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const formulaButtonRef = useRef<HTMLButtonElement>(null);
  const aiColumnButtonRef = useRef<HTMLButtonElement>(null);

  const formatValue = (value: unknown, type?: string): string => {
    if (value === null || value === undefined) return '—';
    if (type === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    if (type === 'date' && typeof value === 'string') {
      return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (type === 'number' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    return String(value);
  };

  // Close popovers when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setShowFilterPopover(false);
      setShowFormulaPopover(false);
      setShowAIColumnPopover(false);
    }
  }, [isOpen]);

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
      '8/10 - High',
      '6/10 - Medium',
      '9/10 - Strong',
      '4/10 - Low',
      '7/10 - Good',
    ];

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-[9998]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 h-[60vh] bg-white rounded-t-2xl shadow-xl z-[9999] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-900 truncate">{widgetName}</span>

                {/* Filters Button */}
                <button
                  ref={filterButtonRef}
                  onClick={() => {
                    setShowFilterPopover(!showFilterPopover);
                    setShowFormulaPopover(false);
                  }}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-sm transition-colors cursor-pointer
                    ${
                      filters.length > 0
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <FunnelIcon size={14} />
                  <span>Filters</span>
                  {filters.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[11px] font-medium bg-indigo-600 text-white rounded-full">
                      {filters.length}
                    </span>
                  )}
                </button>

                {/* Formula Button */}
                {formula && (
                  <button
                    ref={formulaButtonRef}
                    onClick={() => {
                      setShowFormulaPopover(!showFormulaPopover);
                      setShowFilterPopover(false);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <FunctionIcon size={14} />
                    <span>Formula</span>
                  </button>
                )}
              </div>

              <TertiaryIconButton icon={<XIcon size={16} />} onClick={onClose} title="Close" />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.id}
                        className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                    {/* AI Columns Headers */}
                    {aiColumns.map((aiCol) => (
                      <th
                        key={aiCol.id}
                        className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wide whitespace-nowrap group"
                      >
                        <button
                          onClick={() => {
                            setEditingAIColumn(aiCol);
                            setShowAIColumnPopover(true);
                          }}
                          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        >
                          <SparkleIcon size={12} />
                          <span>{aiCol.name}</span>
                          <PencilSimpleIcon
                            size={10}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </button>
                      </th>
                    ))}
                    {/* Add AI Column Button */}
                    <th className="text-left px-4 py-2.5 whitespace-nowrap">
                      <button
                        ref={aiColumnButtonRef}
                        onClick={() => {
                          setEditingAIColumn(null);
                          setShowAIColumnPopover(true);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        <SparkleIcon size={12} />
                        <span>Add AI Column</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className={`px-4 py-2.5 text-gray-900 whitespace-nowrap ${
                            col.type === 'currency' || col.type === 'number' ? 'tabular-nums' : ''
                          }`}
                        >
                          {formatValue(row[col.id], col.type)}
                        </td>
                      ))}
                      {/* AI Columns Data */}
                      {aiColumns.map((aiCol) => (
                        <td key={aiCol.id} className="px-4 py-2.5 text-gray-900 whitespace-nowrap">
                          {aiColumnData[aiCol.id]?.[idx] || (
                            <span className="text-gray-400 italic">Generating...</span>
                          )}
                        </td>
                      ))}
                      {/* Empty cell for the "Add AI Column" header */}
                      <td className="px-4 py-2.5" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {rows.length} row{rows.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Popovers */}
            <AnimatePresence>
              <FilterPopover
                isOpen={showFilterPopover}
                onClose={() => setShowFilterPopover(false)}
                anchorRef={filterButtonRef}
                filters={filters}
              />
            </AnimatePresence>

            <AnimatePresence>
              {formula && (
                <FormulaPopover
                  isOpen={showFormulaPopover}
                  onClose={() => setShowFormulaPopover(false)}
                  anchorRef={formulaButtonRef}
                  formula={formula}
                />
              )}
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
      )}
    </AnimatePresence>
  );
};

export default WidgetDrilldownSheet;
