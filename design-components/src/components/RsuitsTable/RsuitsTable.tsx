import React, { useState } from 'react';
import './RsuitsTable.css';

export interface RsuitsRowData {
  id: number;
  name: string;
  title: string;
  target: string;
  forecast: string;
  commit: string;
  children?: RsuitsRowData[];
}

export interface RsuitsTableProps {
  data: RsuitsRowData[];
}

export const RsuitsTable: React.FC<RsuitsTableProps> = ({ data }) => {
  const [expandedById, setExpandedById] = useState<Record<number, boolean>>({});
  const [editedValueByKey, setEditedValueByKey] = useState<Record<string, string>>({});

  const toggleExpand = (rowId: number) => {
    setExpandedById((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const handleCellChange = (rowId: number, key: keyof RsuitsRowData, value: string) => {
    setEditedValueByKey((prev) => ({ ...prev, [`${rowId}-${key}`]: value }));
  };

  const readCellValue = (row: RsuitsRowData, key: keyof RsuitsRowData): string => {
    const edited = editedValueByKey[`${row.id}-${key}`];
    if (edited !== undefined) return edited;
    const raw = row[key];
    return typeof raw === 'string' ? raw : String(raw ?? '');
  };

  const renderRow = (row: RsuitsRowData, level: number = 0) => (
    <React.Fragment key={row.id}>
      <tr className="rsuits-table-row">
        <td style={{ paddingLeft: `${16 + level * 20}px` }}>
          {row.children && row.children.length > 0 && (
            <button
              className="expand-btn"
              onClick={() => toggleExpand(row.id)}
              aria-label={expandedById[row.id] ? 'Collapse' : 'Expand'}
            >
              {expandedById[row.id] ? '▾' : '▸'}
            </button>
          )}
          <strong>{row.name}</strong>
          <div className="sub-title">{row.title}</div>
        </td>
        <td>
          <input
            aria-label="Target"
            type="text"
            value={readCellValue(row, 'target')}
            onChange={(e) => handleCellChange(row.id, 'target', e.target.value)}
          />
        </td>
        <td>
          <input
            aria-label="AI Forecast"
            type="text"
            value={readCellValue(row, 'forecast')}
            onChange={(e) => handleCellChange(row.id, 'forecast', e.target.value)}
          />
        </td>
        <td>
          <input
            aria-label="Seller Commit"
            type="text"
            value={readCellValue(row, 'commit')}
            onChange={(e) => handleCellChange(row.id, 'commit', e.target.value)}
          />
        </td>
      </tr>
      {row.children &&
        expandedById[row.id] &&
        row.children.map((child) => renderRow(child, level + 1))}
    </React.Fragment>
  );

  return (
    <table className="rsuits-table">
      <thead>
        <tr>
          <th className="heading">Team</th>
          <th className="heading">Target</th>
          <th className="heading">AI Forecast</th>
          <th className="heading">Seller Commit</th>
        </tr>
      </thead>
      <tbody>{data.map((r) => renderRow(r))}</tbody>
    </table>
  );
};

export default RsuitsTable;
