import React, { useMemo } from 'react';
import { Table } from 'rsuite';
import type { TableData, QueryInfo } from './types';

const { Column, HeaderCell, Cell } = Table;

export interface DataTableProps {
  /**
   * Table data to render
   */
  data: TableData;

  /**
   * Optional queries associated with this data
   */
  queries?: QueryInfo[];

  /**
   * Callback when "View Query" is clicked
   */
  onViewQuery?: () => void;
}

/**
 * Format numbers with appropriate suffixes
 */
function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toLocaleString();
}

/**
 * Smart cell formatter based on column name and value type
 */
function CellFormatter({ value, columnName }: { value: unknown; columnName: string }) {
  // Null/undefined
  if (value === null || value === undefined) {
    return <span className="text-gray-400">—</span>;
  }

  // Numbers
  if (typeof value === 'number') {
    const lowerCol = columnName.toLowerCase();

    // Currency fields
    if (
      lowerCol.includes('amount') ||
      lowerCol.includes('arr') ||
      lowerCol.includes('acv') ||
      lowerCol.includes('revenue') ||
      lowerCol.includes('price') ||
      lowerCol.includes('cost')
    ) {
      return <span className="font-mono text-gray-900">${formatNumber(value)}</span>;
    }

    // Percentage fields
    if (lowerCol.includes('prob') || lowerCol.includes('percent') || lowerCol.includes('rate')) {
      return <span className="font-mono text-gray-900">{value.toFixed(1)}%</span>;
    }

    // Count fields
    if (lowerCol.includes('count') || lowerCol.includes('total')) {
      return <span className="font-mono text-gray-900">{formatNumber(value)}</span>;
    }

    // Regular numbers
    return <span className="font-mono text-gray-900">{formatNumber(value)}</span>;
  }

  // Booleans
  if (typeof value === 'boolean') {
    return value ? (
      <span className="text-green-600 font-medium">✓</span>
    ) : (
      <span className="text-gray-400">✗</span>
    );
  }

  // Strings - truncate if very long
  const strValue = String(value);
  if (strValue.length > 100) {
    return (
      <span className="text-gray-900" title={strValue}>
        {strValue.substring(0, 97)}...
      </span>
    );
  }

  return <span className="text-gray-900">{strValue}</span>;
}

/**
 * DataTable component for displaying SQL query results
 * Uses rsuite Table for beautiful formatting
 */
export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  // Memoize columns to prevent infinite re-render loop when parent resizes
  // rsuite Table has internal state that gets confused when columns are recreated
  const columns = useMemo(() => {
    if (!data || !data.columns) return [];

    return data.columns.map((col) => (
      <Column key={col.name} flexGrow={1} minWidth={120} align="left" resizable={true}>
        <HeaderCell className="font-semibold text-gray-700 bg-gray-50 text-xs uppercase tracking-wide">
          {col.display_name}
        </HeaderCell>
        <Cell dataKey={col.name}>
          {(rowData: Record<string, unknown>) => (
            <CellFormatter value={rowData[col.name]} columnName={col.name} />
          )}
        </Cell>
      </Column>
    ));
  }, [data?.columns]);

  if (!data || !data.columns || !data.rows) {
    return <div className="text-sm text-gray-500 italic">No data available</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 my-3">
      {/* Header with metadata */}
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-600 font-medium">📊</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table
          data={data.rows}
          autoHeight
          className="text-sm"
          bordered={false}
          cellBordered
          headerHeight={40}
          rowHeight={36}
          hover
        >
          {columns}
        </Table>
      </div>
    </div>
  );
};

export default DataTable;
