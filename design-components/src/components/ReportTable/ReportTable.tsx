import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Grid, type GridOptions } from '@highcharts/grid-lite-react';
import { SourcePopover } from './SourcePopover';
import '@highcharts/grid-lite/css/grid-lite.css';
import './report-grid-theme.css';

// ============================================================================
// Types (kept for backward compatibility - used by consumers & other components)
// ============================================================================

export type ColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'url'
  | 'picklist'
  | 'owner'
  | 'multiPicklist'
  | 'sentiment'
  | 'longText';

export type DataSourceType = 'salesforce' | 'gong' | 'gmail' | 'calendar' | 'hubspot' | 'mixed';

export interface SourceReference {
  type: DataSourceType;
  label: string;
  url?: string;
}

export interface AIReasoningData {
  reasoning: string;
  confidence?: number;
  sources?: string[];
  sourceReferences?: SourceReference[];
  recordName?: string;
}

// ============================================================================
// ReportColumn type - convenience type for defining columns
// ============================================================================

export interface ReportColumn {
  id: string;
  label: string;
  type: ColumnType;
  isAI?: boolean;
  sortable?: boolean;
  width?: number;
  minWidth?: number;
  source?: DataSourceType;
  aiPrompt?: string;
  aiDataSources?: string[];
}

// ============================================================================
// Props
// ============================================================================

export interface ReportTableProps {
  /** Highcharts Grid Lite options - primary configuration */
  options: GridOptions;
  /** Additional CSS class for the wrapper */
  className?: string;
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Message when data is empty */
  emptyMessage?: string;
  /** Hide the pagination UI while still limiting rows via pageSize */
  hidePagination?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function ReportTable({
  options,
  className = '',
  isLoading = false,
  emptyMessage = 'No data available',
  hidePagination = false,
}: ReportTableProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [popoverReasoning, setPopoverReasoning] = useState<AIReasoningData | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // ── Truncation tooltip (TruncateWithText-like) ─────────────────────────────
  const [truncTooltip, setTruncTooltip] = useState<{
    text: string;
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const handleCellMouseEnter = useCallback((e: React.MouseEvent) => {
    const td = (e.target as HTMLElement).closest('td') as HTMLElement | null;
    if (!td) return;

    // Check if cell content is actually truncated
    if (td.scrollWidth <= td.clientWidth) return;

    // Prefer explicit data-tooltip (set for owner/multiPicklist cells where
    // textContent concatenates avatar initials or tag text without separators)
    const tooltipEl = td.querySelector('[data-tooltip]') as HTMLElement | null;
    const text = tooltipEl?.getAttribute('data-tooltip') || td.textContent?.trim();
    if (!text) return;

    const rect = td.getBoundingClientRect();
    setTruncTooltip({
      text,
      top: rect.top - 6,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const handleCellMouseLeave = useCallback((e: React.MouseEvent) => {
    const td = (e.target as HTMLElement).closest('td') as HTMLElement | null;
    const related = (e.relatedTarget as HTMLElement | null)?.closest?.('td');
    // Only clear if we're actually leaving the cell (not moving between child elements)
    if (td && td !== related) {
      setTruncTooltip(null);
    }
  }, []);

  // Clear tooltip on grid scroll so it doesn't become detached
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const viewport = wrapper.querySelector('.ag-body-viewport');
    if (!viewport) return;

    const onScroll = () => setTruncTooltip(null);
    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
  }, []);

  // ── AI reasoning popover (event delegation on .von-cell-btn) ───────────────
  const handleWrapperClick = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('.von-cell-btn') as HTMLElement | null;
    if (!target) return;

    e.stopPropagation();
    const reasoningAttr = target.getAttribute('data-reasoning');
    if (!reasoningAttr) return;

    try {
      const reasoning = JSON.parse(reasoningAttr) as AIReasoningData;
      const rect = target.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(rect.left - 240, window.innerWidth - 340)),
      });
      setPopoverReasoning(reasoning);
    } catch {
      // Ignore malformed data
    }
  }, []);

  // Check if data is empty
  const isEmpty = useMemo(() => {
    const dt = options.dataTable;
    if (!dt) return true;
    if (typeof dt === 'object' && 'columns' in dt) {
      const cols = (dt as { columns?: Record<string, unknown[]> }).columns;
      if (!cols) return true;
      const firstCol = Object.values(cols)[0];
      return !firstCol || firstCol.length === 0;
    }
    return false;
  }, [options.dataTable]);

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-50 rounded-t-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 border-b border-gray-100 flex items-center px-4">
              <div className="h-4 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center py-12 text-sm text-gray-700">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`w-full flex flex-col h-full report-grid-wrapper ${hidePagination ? 'report-grid-no-pagination' : ''} ${className}`}
      onClick={handleWrapperClick}
      onMouseOver={handleCellMouseEnter}
      onMouseOut={handleCellMouseLeave}
    >
      <Grid options={options} />

      {popoverReasoning && (
        <SourcePopover
          reasoning={popoverReasoning}
          position={popoverPosition}
          onClose={() => setPopoverReasoning(null)}
        />
      )}

      {/* Truncation tooltip — portal-based, same style as TruncateWithText */}
      {truncTooltip &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[10000] px-2 py-1 text-xs text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none break-words"
            style={{
              top: truncTooltip.top,
              left: truncTooltip.left,
              maxWidth: Math.max(truncTooltip.width, 280),
              transform: 'translateY(-100%)',
            }}
          >
            {truncTooltip.text}
          </div>,
          document.body
        )}
    </div>
  );
}

export default ReportTable;
