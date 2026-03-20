import { useCallback, useRef } from 'react';
import { ReportTable } from '../../ReportTable';
import type { GridOptions } from '@highcharts/grid-lite-react';
import type { TableWidgetConfig, TablePaginationInfo } from '../types';
import { ServerPagination } from './ServerPagination';
import './table-widget.css';

interface TableWidgetProps {
  config: TableWidgetConfig;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

const TableWidget: React.FC<TableWidgetProps> = ({ config, onPageChange, isLoading }) => {
  const { serverPagination } = config;
  const hasServerPagination = !!serverPagination && serverPagination.totalPages > 1;

  // Keep the last valid gridOptions so the table stays stable during loading.
  // When loading, config.gridOptions may still hold the previous page's data
  // (which is exactly what we want — headers stay, shimmer covers rows).
  const lastOptionsRef = useRef<GridOptions | null>(null);

  const base = config.gridOptions as GridOptions;
  const options: GridOptions = { ...base, pagination: { enabled: false } };

  // Update ref only when NOT loading (i.e. fresh data has arrived)
  if (!isLoading) {
    lastOptionsRef.current = options;
  }

  // Use the last known good options so the grid never flickers
  const stableOptions = lastOptionsRef.current ?? options;

  const handlePageChange = useCallback((page: number) => onPageChange?.(page), [onPageChange]);

  const skeletonRows = serverPagination?.limit ?? 10;

  return (
    <div
      className={`h-full w-full table-widget-root flex flex-col${hasServerPagination ? ' server-paginated' : ''}`}
    >
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <ReportTable options={stableOptions} hidePagination />

        {/* Shimmer covers body rows while headers stay visible */}
        {isLoading && (
          <div className="table-skeleton">
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <div key={i} className="table-skeleton-row">
                <div className="table-skeleton-cell" style={{ width: '25%' }} />
                <div className="table-skeleton-cell" style={{ width: '18%' }} />
                <div className="table-skeleton-cell" style={{ width: '15%' }} />
                <div className="table-skeleton-cell" style={{ width: '12%' }} />
                <div className="table-skeleton-cell" style={{ width: '14%' }} />
                <div className="table-skeleton-cell" style={{ width: '10%' }} />
              </div>
            ))}
          </div>
        )}
      </div>
      {hasServerPagination && (
        <ServerPagination
          pagination={serverPagination as TablePaginationInfo}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export { TableWidget };
