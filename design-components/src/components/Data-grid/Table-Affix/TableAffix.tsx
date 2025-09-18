// components/AffixTable.tsx
import React from 'react';
import { Table as RsTable } from 'rsuite';

export interface AffixColumn {
  key: string;
  title: string;
  width?: number;
  resizable?: boolean;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  cellRenderer?: (rowData: any) => React.ReactNode;
}

export interface AffixTableProps {
  data: any[];
  columns: AffixColumn[];
  height?: number | string;
  rowKey?: string;
  loading?: boolean;
  bordered?: boolean;
  affixHeader?: boolean;
  affixHorizontalScrollbar?: boolean;
  onRowClick?: (rowData: any, rowIndex: number, event: React.MouseEvent) => void;
}

const AffixTable: React.FC<AffixTableProps> = ({
  data,
  columns,
  height = 400,
  rowKey = 'id',
  loading = false,
  bordered = true,
  affixHeader = true,
  affixHorizontalScrollbar = true,
  onRowClick,
}) => {
  return (
    <RsTable
    data={data}
    height={height}
      rowKey={rowKey}
      loading={loading}
      bordered={bordered}
      affixHeader={affixHeader}
      affixHorizontalScrollbar={affixHorizontalScrollbar}
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
            {(rowData) => (col.cellRenderer ? col.cellRenderer(rowData) : rowData[col.key])}
          </RsTable.Cell>
        </RsTable.Column>
      ))}
    </RsTable>
  );
};

export default AffixTable;
