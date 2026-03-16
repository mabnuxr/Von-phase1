import { useMemo } from 'react';
import { ReportTable } from '../../ReportTable';
import type { GridOptions } from '@highcharts/grid-lite-react';
import type { TableWidgetConfig } from '../types';
import { useTablePagination } from './useTablePagination';
import './table-widget.css';

interface TableWidgetProps {
  config: TableWidgetConfig;
}

function getRowCount(gridOptions: Record<string, unknown>): number {
  const dt = gridOptions.dataTable as { columns?: Record<string, unknown[]> } | undefined;
  if (!dt?.columns) return 0;
  const firstCol = Object.values(dt.columns)[0];
  return firstCol?.length ?? 0;
}

const TableWidget: React.FC<TableWidgetProps> = ({ config }) => {
  const totalRows = useMemo(() => getRowCount(config.gridOptions), [config.gridOptions]);
  const { containerRef, pagination } = useTablePagination(totalRows);

  // Still measuring — show loading shimmer
  if (!pagination) {
    return (
      <div ref={containerRef} className="h-full w-full">
        <ReportTable options={{} as GridOptions} isLoading />
      </div>
    );
  }

  const base = config.gridOptions as GridOptions;
  const options: GridOptions = {
    ...base,
    pagination,
  };

  return (
    <div ref={containerRef} className="h-full w-full table-widget-root">
      <ReportTable options={options} />
    </div>
  );
};

export { TableWidget };
