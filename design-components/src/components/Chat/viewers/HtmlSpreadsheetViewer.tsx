/**
 * HtmlSpreadsheetViewer — Renders SheetJS sheet_to_html() output
 *
 * Wraps the raw HTML table in a scrollable container with sheet tabs.
 * Styles are scoped via the .xlsx-preview class to avoid leaking into the app.
 */

import React, { useState, useRef, useCallback } from 'react';
import type { HtmlSheet } from '../hooks/useArtifactContent';
import { Tooltip } from '../../Tooltip';

interface SheetTabProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
}

const SheetTab: React.FC<SheetTabProps> = ({ name, isActive, onClick }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = useCallback(() => {
    const el = ref.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
  }, []);

  return (
    <Tooltip content={name} placement="top" enabled={isTruncated}>
      <button
        ref={ref}
        onClick={onClick}
        onMouseEnter={checkTruncation}
        onFocus={checkTruncation}
        className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors shrink-0 max-w-[150px] truncate ${
          isActive
            ? 'bg-white text-gray-900 border border-gray-200 shadow-xs'
            : 'text-gray-600 hover:bg-white/60 border border-transparent'
        }`}
      >
        {name}
      </button>
    </Tooltip>
  );
};

interface HtmlSpreadsheetViewerProps {
  sheets: HtmlSheet[];
  truncated?: boolean;
}

export const HtmlSpreadsheetViewer: React.FC<HtmlSpreadsheetViewerProps> = ({
  sheets,
  truncated,
}) => {
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const activeSheet = sheets[activeSheetIdx] ?? sheets[0];

  if (!activeSheet) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
        No data to display
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Scrollable table area */}
      <div
        className="xlsx-preview flex-1 overflow-auto settings-scrollbar"
        dangerouslySetInnerHTML={{ __html: activeSheet.html }}
      />

      {/* Footer: sheet tabs + truncation notice */}
      {(truncated || sheets.length > 1) && (
        <div className="border-t border-gray-200 bg-gray-50 flex-shrink-0">
          {sheets.length > 1 && (
            <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto settings-scrollbar">
              {sheets.map((sheet, idx) => (
                <SheetTab
                  key={idx}
                  name={sheet.name}
                  isActive={idx === activeSheetIdx}
                  onClick={() => setActiveSheetIdx(idx)}
                />
              ))}
            </div>
          )}
          {truncated && (
            <div className="px-3 py-1 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Showing first 5,000 rows. Download for full data.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
