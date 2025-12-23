import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table as TableIcon, Sparkle } from '@phosphor-icons/react';
import { TypingText } from './TypingText';
import type { DataTable, DataColumn } from '../types';

export interface AnimatedTableProps {
  /**
   * Table configuration
   */
  table: DataTable;

  /**
   * Whether to animate the table appearing
   */
  animate?: boolean;

  /**
   * Delay before starting animation (ms)
   */
  delay?: number;

  /**
   * Callback when table animation is complete
   */
  onComplete?: () => void;

  /**
   * Whether the table is currently being "created" by the agent
   */
  isCreating?: boolean;

  /**
   * Number of rows to show during animation
   */
  visibleRowCount?: number;
}

/**
 * SkeletonRow - A shimmering skeleton row for loading state
 */
const SkeletonRow: React.FC<{ columnCount: number; index: number }> = ({ columnCount, index }) => {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-gray-100"
    >
      {Array.from({ length: Math.min(columnCount, 6) }).map((_, i) => (
        <td key={i} className="px-3 py-2.5">
          <div className="relative overflow-hidden rounded">
            <div
              className="h-4 bg-gray-100 rounded"
              style={{ width: `${60 + Math.random() * 40}%` }}
            />
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.1,
              }}
            />
          </div>
        </td>
      ))}
    </motion.tr>
  );
};

/**
 * DataRow - An animated data row that appears with stagger
 */
const DataRow: React.FC<{
  data: Record<string, unknown>;
  columns: DataColumn[];
  index: number;
  isNew?: boolean;
}> = ({ data, columns, index, isNew = false }) => {
  const visibleColumns = columns.slice(0, 6);

  const formatValue = (value: unknown, type: DataColumn['type']) => {
    if (value === null || value === undefined) return '-';
    switch (type) {
      case 'currency':
        return typeof value === 'number'
          ? `$${value.toLocaleString()}`
          : String(value);
      case 'percentage':
        return typeof value === 'number'
          ? `${(value * 100).toFixed(0)}%`
          : `${value}%`;
      case 'number':
        return typeof value === 'number'
          ? value.toLocaleString()
          : String(value);
      default:
        return String(value);
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.08,
        ease: 'easeOut',
      }}
      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isNew ? 'bg-purple-50/50' : ''
      }`}
    >
      {visibleColumns.map((col, colIdx) => (
        <td key={col.key} className="px-3 py-2.5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.08 + colIdx * 0.03 }}
            className={`text-sm ${
              col.isAIGenerated
                ? 'font-medium bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent'
                : 'text-gray-700'
            }`}
          >
            {formatValue(data[col.key], col.type)}
          </motion.div>
        </td>
      ))}
    </motion.tr>
  );
};

/**
 * AnimatedTable - Table component with progressive row loading animation
 */
export const AnimatedTable: React.FC<AnimatedTableProps> = ({
  table,
  animate = true,
  delay = 0,
  onComplete,
  isCreating = false,
  visibleRowCount = 5,
}) => {
  const [phase, setPhase] = useState<'hidden' | 'title' | 'skeleton' | 'data' | 'complete'>(
    animate ? 'hidden' : 'complete'
  );
  const [visibleRows, setVisibleRows] = useState<number>(0);
  const hasStartedRef = useRef(false);
  const visibleColumns = table.columns.slice(0, 6);
  const dataToShow = table.data.slice(0, visibleRowCount);

  const startAnimation = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Start with hidden, then show title
    setTimeout(() => setPhase('title'), delay);

    // After title types, show skeleton
    setTimeout(() => setPhase('skeleton'), delay + 800);

    // After skeleton, start showing data rows
    setTimeout(() => {
      setPhase('data');
      // Reveal rows one by one
      let rowIdx = 0;
      const revealInterval = setInterval(() => {
        rowIdx++;
        setVisibleRows(rowIdx);
        if (rowIdx >= dataToShow.length) {
          clearInterval(revealInterval);
          setTimeout(() => {
            setPhase('complete');
            onComplete?.();
          }, 300);
        }
      }, 150);
    }, delay + 1500);
  }, [delay, dataToShow.length, onComplete]);

  // Start animation on mount
  React.useLayoutEffect(() => {
    if (animate) {
      startAnimation();
    }
  }, [animate, startAnimation]);

  if (phase === 'hidden') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
    >
      {/* Table Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-orange-400 flex items-center justify-center">
            <TableIcon size={14} weight="fill" className="text-white" />
          </div>
          <div className="flex-1">
            {phase === 'title' ? (
              <h3 className="text-sm font-semibold text-gray-900">
                <TypingText text={table.name} speed={40} showCursor={true} />
              </h3>
            ) : (
              <h3 className="text-sm font-semibold text-gray-900">{table.name}</h3>
            )}
            {table.description && phase !== 'title' && (
              <p className="text-xs text-gray-500 mt-0.5">{table.description}</p>
            )}
          </div>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkle size={12} weight="fill" className="text-purple-600" />
              </motion.div>
              <span className="text-xs font-medium text-purple-700">Creating</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.isAIGenerated && (
                      <Sparkle size={10} weight="fill" className="text-purple-500" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="sync">
              {phase === 'skeleton' && (
                <>
                  {Array.from({ length: visibleRowCount }).map((_, i) => (
                    <SkeletonRow key={`skeleton-${i}`} columnCount={visibleColumns.length} index={i} />
                  ))}
                </>
              )}
              {(phase === 'data' || phase === 'complete') && (
                <>
                  {dataToShow.slice(0, visibleRows).map((row, i) => (
                    <DataRow
                      key={`row-${i}`}
                      data={row as Record<string, unknown>}
                      columns={visibleColumns}
                      index={i}
                      isNew={phase === 'data'}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer with row count */}
      <AnimatePresence>
        {phase === 'complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-2 border-t border-gray-100 bg-gray-50/50"
          >
            <p className="text-xs text-gray-500">
              Showing {dataToShow.length} of {table.rowCount} rows
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnimatedTable;
