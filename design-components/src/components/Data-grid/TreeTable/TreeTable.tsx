// components/InteractiveTreeTable.tsx
import React, { useState } from 'react';
import { Table as RsTable } from 'rsuite';

export interface TreeColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  width?: number;
  resizable?: boolean;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  cellRenderer?: (rowData: T) => React.ReactNode;
}

export interface TreeRow<T = Record<string, unknown>> {
  id: string | number;
  children?: TreeRow<T>[];
  [key: string]: unknown;
}

export interface InteractiveTreeTableProps<T = Record<string, unknown>> {
  data: TreeRow<T>[];
  columns: TreeColumn<T>[];
  height?: number;
  rowKey?: string;
  bordered?: boolean;
  loading?: boolean;
}

const InteractiveTreeTable = <T extends Record<string, unknown>>({
  data,
  columns,
  height = 400,
  rowKey = 'id',
  bordered = true,
  loading = false,
}: InteractiveTreeTableProps<T>): React.ReactElement => {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  const toggleRow = (rowId: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const flattenData = (rows: TreeRow<T>[], level = 0): (T & { _level: number })[] => {
    let result: (T & { _level: number })[] = [];
    for (const row of rows) {
      result.push({ ...row, _level: level });
      if (row.children && expandedRows.has(row.id)) {
        result = result.concat(flattenData(row.children, level + 1));
      }
    }
    return result;
  };

  return (
    <RsTable
      data={flattenData(data)}
      rowKey={rowKey}
      height={height}
      bordered={bordered}
      loading={loading}
      rowClassName={(rowData) =>
        rowData._level > 0 ? 'rs-table-row-child' : ''
      }
      onRowClick={(rowData) => rowData.children && toggleRow(rowData[rowKey])}
    >
      {columns.map((col) => (
        <RsTable.Column
          key={col.key}
          width={col.width}
          resizable={col.resizable}
          sortable={col.sortable}
          align={col.align}
        >
          <RsTable.HeaderCell>{col.title}</RsTable.HeaderCell>
          <RsTable.Cell>
            {(rowData) => (
              <div style={{ paddingLeft: (rowData._level || 0) * 20 }}>
                {rowData.cellRenderer
                  ? rowData.cellRenderer(rowData)
                  : rowData[col.key]}
              </div>
            )}
          </RsTable.Cell>
        </RsTable.Column>
      ))}
    </RsTable>
  );
};

export default InteractiveTreeTable;
