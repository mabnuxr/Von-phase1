/**
 * ReadonlySpreadsheetViewer — Readonly table for XLSX/CSV artifacts
 *
 * Adapted from Jan17Demo SpreadsheetViewer, stripped to readonly essentials:
 * column headers, row numbers, data cells, sheet tabs.
 */

import React, { useState, useMemo } from 'react';
import type { ParsedSheet } from '../hooks/useArtifactContent';

interface ReadonlySpreadsheetViewerProps {
  sheets: ParsedSheet[];
}

export const ReadonlySpreadsheetViewer: React.FC<ReadonlySpreadsheetViewerProps> = ({ sheets }) => {
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const activeSheet = sheets[activeSheetIdx] ?? sheets[0];

  const { columns, rows } = useMemo(
    () => ({
      columns: activeSheet?.columns ?? [],
      rows: activeSheet?.rows ?? [],
    }),
    [activeSheet]
  );

  if (!activeSheet) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
        No data to display
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="text-[13px] border-collapse" style={{ minWidth: '100%' }}>
          <thead className="sticky top-0 z-10">
            <tr>
              {/* Row number header */}
              <th className="bg-gray-50 border-b border-r border-gray-200 px-2 py-1.5 text-center text-[11px] font-medium text-gray-500 w-10 min-w-[40px]" />
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="bg-gray-50 border-b border-r border-gray-200 px-2 py-1.5 text-left text-[11px] font-medium text-gray-600 whitespace-nowrap select-none"
                  style={{ minWidth: '80px' }}
                >
                  <span className="truncate">{col.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="group">
                {/* Row number */}
                <td className="bg-gray-50 border-b border-r border-gray-200 px-2 py-0 text-center text-[11px] text-gray-400 font-medium w-10 min-w-[40px]">
                  {rowIdx + 1}
                </td>
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className="border-b border-r border-gray-200"
                    style={{ padding: 0, height: '28px' }}
                  >
                    <div className="px-2 py-1 truncate h-full flex items-center text-gray-900">
                      {String(row[col.id] ?? '')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet tabs (only if multiple sheets) */}
      {sheets.length > 1 && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          {sheets.map((sheet, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSheetIdx(idx)}
              className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                idx === activeSheetIdx
                  ? 'bg-white text-gray-900 border border-gray-200 shadow-xs'
                  : 'text-gray-600 hover:bg-white/60 border border-transparent'
              }`}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadonlySpreadsheetViewer;
