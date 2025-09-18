// components/InteractiveTreeTable.tsx
import React, { useState } from 'react';
import { Table as RsTable } from 'rsuite';

export interface TreeColumn {
  key: string;
  title: string;
  width?: number;
  resizable?: boolean;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  cellRenderer?: (rowData: any) => React.ReactNode;
}

export interface TreeRow {
  id: string | number;
  children?: TreeRow[];
  [key: string]: any;
}

export interface InteractiveTreeTableProps {
  data: TreeRow[];
  columns: TreeColumn[];
  height?: number | string;
  rowKey?: string;
  bordered?: boolean;
  loading?: boolean;
}

const InteractiveTreeTable: React.FC<InteractiveTreeTableProps> = ({
  data,
  columns,
  height = 400,
  rowKey = 'id',
  bordered = true,
  loading = false,
}) => {
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

  const flattenData = (rows: TreeRow[], level = 0): any[] => {
    let result: any[] = [];
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
