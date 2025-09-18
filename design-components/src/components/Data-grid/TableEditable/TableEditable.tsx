// components/EditableTable.tsx
import React, { useState } from 'react';
import { Table, Input } from 'rsuite';

export interface EditableColumn {
  key: string;
  title: string;
  width?: number;
  resizable?: boolean;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  editable?: boolean;
}

export interface EditableTableProps {
  data: any[];
  columns: EditableColumn[];
  height?: number | string;
  rowKey?: string;
  bordered?: boolean;
  onRowClick?: (rowData: any, rowIndex: number, event: React.MouseEvent) => void;
  onChange?: (updatedData: any[]) => void;
}

const EditableTable: React.FC<EditableTableProps> = ({
  data,
  columns,
  height = 400,
  rowKey = 'id',
  bordered = true,
  onRowClick,
  onChange,
}) => {
  const [tableData, setTableData] = useState([...data]);

  const handleCellChange = (rowIndex: number, key: string, value: any) => {
    const newData = [...tableData];
    newData[rowIndex] = { ...newData[rowIndex], [key]: value };
    setTableData(newData);
    onChange?.(newData);
  };

  return (
    <Table
      data={tableData}
      height={height}
      rowKey={rowKey}
      bordered={bordered}
      onRowClick={onRowClick}
    >
      {columns.map((col) => (
        <Table.Column
          key={col.key}
          width={col.width}
          resizable={col.resizable}
          sortable={col.sortable}
          align={col.align}
        >
          <Table.HeaderCell>{col.title}</Table.HeaderCell>
          <Table.Cell>
            {(rowData, rowIndex) =>
              col.editable ? (
                <Input
                  value={rowData[col.key]}
                  onChange={(value) => handleCellChange(rowIndex, col.key, value)}
                  size="sm"
                />
              ) : (
                rowData[col.key]
              )
            }
          </Table.Cell>
        </Table.Column>
      ))}
    </Table>
  );
};

export default EditableTable;
