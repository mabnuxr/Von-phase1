import React from 'react';
import { Placeholder } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

export type PlaceholderType = 'paragraph' | 'graph' | 'button' | 'grid';
export type GraphType = 'circle' | 'rect';

interface RSuitePlaceholderProps {
  type: PlaceholderType;
  active?: boolean;
  rows?: number;
  columns?: number;
  graphType?: GraphType;
  style?: React.CSSProperties;
}

const RSuitePlaceholder: React.FC<RSuitePlaceholderProps> = ({
  type,
  active = true,
  rows = 3,
  columns = 3,
  graphType = 'circle',
  style = {},
}) => {
  switch (type) {
    case 'paragraph':
      return <Placeholder.Paragraph active={active} rows={rows} style={style} />;
    case 'graph': {
      const size = 100;
      const graphStyle: React.CSSProperties =
        graphType === 'circle'
          ? { width: size, height: size, borderRadius: '9999px', ...style }
          : { width: size, height: size, ...style };
      return <Placeholder.Graph active={active} style={graphStyle} />;
    }
    case 'button':
      return (
        <Placeholder.Graph
          active={active}
          style={{ width: 120, height: 36, borderRadius: 8, ...style }}
        />
      );
    case 'grid':
      return <Placeholder.Grid active={active} rows={rows} columns={columns} style={style} />;
    default:
      return null;
  }
};

export default RSuitePlaceholder;
