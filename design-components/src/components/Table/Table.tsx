import React, { useState } from 'react';
import './Table.css';

interface RowData {
  id: number;
  name: string;
  title: string;
  target: string;
  forecast: string;
  commit: string;
  children?: RowData[];
}

interface TableProps {
  data: RowData[];
}

const Table: React.FC<TableProps> = ({ data }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInputChange = (id: number, key: keyof RowData, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [`${id}-${key}`]: value,
    }));
  };

  const getValue = (row: RowData, key: keyof RowData) => {
    return editValues[`${row.id}-${key}`] ?? row[key];
  };

  const renderRow = (row: RowData, level: number = 0) => (
    <React.Fragment key={row.id}>
      <tr className="table-row">
        <td style={{ paddingLeft: `35px` }}>
          {row.children && (
            <button className="expand-btn" onClick={() => toggleExpand(row.id)}>
              {expanded[row.id] ? '▾' : '▸'}
            </button>
          )}
          <strong>{row.name}</strong>
          <div className="sub-title">{row.title}</div>
        </td>
        <td>
          <input
            type="text"
            value={getValue(row, 'target')}
            onChange={(e) => handleInputChange(row.id, 'target', e.target.value)}
          />
        </td>
        <td>
          <input
            type="text"
            value={getValue(row, 'forecast')}
            onChange={(e) => handleInputChange(row.id, 'forecast', e.target.value)}
          />
        </td>
        <td>
          <input
            type="text"
            value={getValue(row, 'commit')}
            onChange={(e) => handleInputChange(row.id, 'commit', e.target.value)}
          />
        </td>
      </tr>
      {row.children && expanded[row.id] && row.children.map((child) => renderRow(child, level + 1))}
    </React.Fragment>
  );

  return (
    <table className="custom-table">
      <thead>
        <tr>
          <th className="heading">Team</th>
          <th className="heading">Target</th>
          <th className="heading">AI Forecast</th>
          <th className="heading">Seller Commit</th>
        </tr>
      </thead>
      <tbody>{data.map((row) => renderRow(row))}</tbody>
    </table>
  );
};

export default Table;
