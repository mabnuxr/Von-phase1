// components/Table.tsx
import React from 'react';
import { Table as RsTable } from 'rsuite';

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  width?: number;
  resizable?: boolean;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  cellRenderer?: (rowData: T) => React.ReactNode;
}

export interface TableProps<T = Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  height?: number;
  rowKey?: string;
  loading?: boolean;
  bordered?: boolean;
  virtualized?: boolean;
  onRowClick?: (rowData: T, rowIndex: number, event: React.MouseEvent) => void;
}

const Table = <T extends Record<string, unknown>>({
  data,
  columns,
  height = 400,
  rowKey = 'id',
  loading = false,
  bordered = true,
  virtualized = false,
  onRowClick,
}: TableProps<T>): React.ReactElement => {
  return (
    <RsTable
      data={data}
      height={height}
      rowKey={rowKey}
      loading={loading}
      bordered={bordered}
      virtualized={virtualized}
      onRowClick={onRowClick}
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
            {(rowData) => (col.cellRenderer ? col.cellRenderer(rowData as T) : String((rowData as T)[col.key]))}
          </RsTable.Cell>
        </RsTable.Column>
      ))}
    </RsTable>
  );
};

export default Table;
