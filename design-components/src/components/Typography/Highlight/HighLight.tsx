import React from 'react';
import { Highlight } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

interface RSuiteHighlightProps {
  children: string;
  query: string;
  style?: React.CSSProperties;
  className?: string;
}

const RSuiteHighlight: React.FC<RSuiteHighlightProps> = ({ children, query, style, className }) => {
  return (
    <Highlight query={query} className={className} style={style}>
      {children}
    </Highlight>
  );
};

export default RSuiteHighlight;
