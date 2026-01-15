import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  FunnelIcon,
  FunctionIcon,
  PencilSimpleIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import { TertiaryIconButton, GhostButton, PrimaryButton, AddButton } from '../forms/buttons';
import { FilterRow as FormFilterRow } from '../forms/filter';
import { Select } from '../forms/dropdown';

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

export interface InlineDrilldownPanelProps {
  isOpen: boolean;
  onClose: () => void;
  widgetName: string;
  columns: DrilldownColumn[];
  rows: Record<string, unknown>[];
  filters?: DrilldownFilter[];
  formula?: string;
  onFiltersChange?: (filters: DrilldownFilter[]) => void;
  onFormulaChange?: (formula: string) => void;
  /** Available fields for filter dropdown */
  availableFields?: string[];
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
// Filter Popover Component
// ============================================================================

interface FilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  filters: DrilldownFilter[];
  fieldOptions: { value: string; label: string }[];
  onFiltersChange: (filters: DrilldownFilter[]) => void;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
  filters,
  fieldOptions,
  onFiltersChange,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [localFilters, setLocalFilters] = useState<DrilldownFilter[]>(filters);

  // Reset local filters when popover opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(16, rect.left),
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

  const addFilter = () => {
    const newFilter: DrilldownFilter = {
      id: `filter-${Date.now()}`,
      field: fieldOptions[0]?.value || '',
      operator: 'equals',
      value: '',
    };
    setLocalFilters([...localFilters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<DrilldownFilter>) => {
    setLocalFilters(localFilters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeFilter = (id: string) => {
    setLocalFilters(localFilters.filter((f) => f.id !== id));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
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
      className="fixed w-[420px] bg-white rounded-xl shadow-xl border border-gray-200 z-[10000]"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-[13px] font-medium text-gray-900">Edit Filters</span>
        <AddButton onClick={addFilter}>Add Filter</AddButton>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        {localFilters.length === 0 ? (
          <p className="text-[13px] text-gray-500 text-center py-4">
            No filters applied. Click "Add Filter" to create one.
          </p>
        ) : (
          <div className="space-y-2">
            {localFilters.map((filter) => (
              <FormFilterRow
                key={filter.id}
                fields={fieldOptions}
                field={filter.field}
                operator={filter.operator}
                value={filter.value}
                onFieldChange={(field) => updateFilter(filter.id, { field })}
                onOperatorChange={(operator) => updateFilter(filter.id, { operator })}
                onValueChange={(value) => updateFilter(filter.id, { value })}
                onRemove={() => removeFilter(filter.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton onClick={handleApply}>Apply Filters</PrimaryButton>
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
        <span className="text-[13px] font-medium text-gray-900">Formula</span>
        {!isEditing && localFormula && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 px-2 py-1 text-[13px] text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
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
          <div className="bg-gray-900 rounded-lg p-3 font-mono text-[13px] text-emerald-400 overflow-x-auto">
            {localFormula}
          </div>
        )}

        {/* Empty state */}
        {!isEditing && !localFormula && (
          <div className="text-center py-4">
            <p className="text-[13px] text-gray-500 mb-3">No formula defined.</p>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
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
              className="w-full px-3 py-2 text-[13px] bg-gray-900 text-emerald-400 font-mono border border-gray-700 rounded-lg resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors placeholder:text-gray-500"
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
// Main Component
// ============================================================================

export const InlineDrilldownPanel: React.FC<InlineDrilldownPanelProps> = ({
  isOpen,
  onClose,
  widgetName,
  columns,
  rows,
  filters = [],
  formula = '',
  onFiltersChange,
  onFormulaChange,
  availableFields = [],
}) => {
  const [localFilters, setLocalFilters] = useState<DrilldownFilter[]>(filters);
  const [localFormula, setLocalFormula] = useState(formula);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showFormulaPopover, setShowFormulaPopover] = useState(false);
  const [panelHeight, setPanelHeight] = useState(70);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const formulaButtonRef = useRef<HTMLButtonElement>(null);

  // Derive available fields from columns if not provided
  const fields = availableFields.length > 0 ? availableFields : columns.map((c) => c.label);
  const fieldOptions = fields.map((f) => ({ value: f, label: f }));

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
      setShowFilterPopover(false);
      setShowFormulaPopover(false);
    }
  }, [isOpen]);

  // Handle filter changes from popover
  const handleFiltersChange = (newFilters: DrilldownFilter[]) => {
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Handle formula changes from popover
  const handleFormulaChange = (newFormula: string) => {
    setLocalFormula(newFormula);
    onFormulaChange?.(newFormula);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      ref={containerRef}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl border-t border-gray-200 flex flex-col z-50"
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
          <span className="text-[13px] font-medium text-gray-900 truncate">{widgetName}</span>

          {/* Filters Button */}
          <button
            ref={filterButtonRef}
            onClick={() => {
              setShowFilterPopover(!showFilterPopover);
              setShowFormulaPopover(false);
            }}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[13px] transition-colors cursor-pointer
              ${
                showFilterPopover || localFilters.length > 0
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200'
              }
            `}
          >
            <FunnelIcon size={14} />
            <span>Filters</span>
            {localFilters.length > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-medium bg-indigo-600 text-white rounded-full">
                {localFilters.length}
              </span>
            )}
          </button>

          {/* Formula Button */}
          <button
            ref={formulaButtonRef}
            onClick={() => {
              setShowFormulaPopover(!showFormulaPopover);
              setShowFilterPopover(false);
            }}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[13px] transition-colors cursor-pointer
              ${
                showFormulaPopover
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200'
              }
            `}
          >
            <FunctionIcon size={14} />
            <span>Formula</span>
          </button>
        </div>

        <TertiaryIconButton icon={<XIcon size={16} />} onClick={onClose} title="Close" />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[13px]">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
        <span className="text-[13px] text-gray-500">
          {rows.length} row{rows.length !== 1 ? 's' : ''}
        </span>
        <div className="text-xs text-gray-400">Drag the top edge to resize</div>
      </div>

      {/* Filter Popover */}
      <AnimatePresence>
        <FilterPopover
          isOpen={showFilterPopover}
          onClose={() => setShowFilterPopover(false)}
          anchorRef={filterButtonRef}
          filters={localFilters}
          fieldOptions={fieldOptions}
          onFiltersChange={handleFiltersChange}
        />
      </AnimatePresence>

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
    </motion.div>
  );
};

export default InlineDrilldownPanel;
