import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  FunnelIcon,
  FunctionIcon,
  CaretDownIcon,
  CheckIcon,
} from '@phosphor-icons/react';
import { TertiaryIconButton, SecondaryButton } from '../forms/buttons';

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
          <p className="text-[13px] text-gray-500 text-center py-2">No filters applied</p>
        ) : (
          filters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg"
            >
              <span className="text-[13px] font-medium text-gray-900">{filter.field}</span>
              <span className="text-[13px] text-gray-500">{filter.operator}</span>
              <span className="text-[13px] text-indigo-600">{filter.value}</span>
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
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Formula
        </span>
      </div>
      <div className="p-3">
        <div className="bg-gray-900 rounded-lg p-3 font-mono text-[13px] text-emerald-400 overflow-x-auto">
          {formula}
        </div>
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
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const formulaButtonRef = useRef<HTMLButtonElement>(null);

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
    }
  }, [isOpen]);

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
                <span className="text-[13px] font-medium text-gray-900 truncate">
                  {widgetName}
                </span>

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
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 text-[13px] text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <FunctionIcon size={14} />
                    <span>Formula</span>
                  </button>
                )}
              </div>

              <TertiaryIconButton
                icon={<XIcon size={16} />}
                onClick={onClose}
                title="Close"
              />
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
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[13px] text-gray-500">
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WidgetDrilldownSheet;
