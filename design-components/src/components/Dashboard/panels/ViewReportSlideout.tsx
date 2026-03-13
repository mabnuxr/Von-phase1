import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '@phosphor-icons/react';
import { TertiaryIconButton } from '../../forms/buttons';

export interface ReportColumn {
  id: string;
  label: string;
  type?: 'string' | 'number' | 'currency' | 'date';
}

export interface ViewReportSlideoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary?: { label: string; value: string }[];
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
}

function formatCell(value: unknown, type?: string): string {
  if (value == null) return '—';
  if (type === 'currency' && typeof value === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (type === 'number' && typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

export const ViewReportSlideout: React.FC<ViewReportSlideoutProps> = ({
  isOpen,
  onClose,
  title,
  summary,
  columns,
  rows,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-[9999]"
            onClick={onClose}
          />

          {/* Slideout */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-0 right-0 bottom-0 w-[560px] max-w-full bg-white shadow-xl z-[10000] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-900">{title}</span>
              <TertiaryIconButton icon={<XIcon size={16} />} onClick={onClose} title="Close" />
            </div>

            {/* Summary */}
            {summary && summary.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <p className="text-xs font-medium text-gray-700 mb-2">Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  {summary.map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] text-gray-700">{item.label}</p>
                      <p className="text-sm font-medium text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100">
                    {columns.map((col) => (
                      <th
                        key={col.id}
                        className="text-left text-xs font-medium text-gray-700 px-4 py-2 whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap"
                        >
                          {formatCell(row[col.id], col.type)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-700">
                {rows.length} record{rows.length !== 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
