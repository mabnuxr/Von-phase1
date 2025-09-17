import React from 'react';
import { Highlight } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

interface RSuiteHighlightProps {
  children: string;
  query: string;
  caseSensitive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const RSuiteHighlight: React.FC<RSuiteHighlightProps> = ({
  children,
  query,
  caseSensitive = false,
  style,
  className,
}) => {
  return (
    <Highlight
      query={query}
      caseSensitive={caseSensitive}
      className={className}
      style={style}
    >
      {children}
    </Highlight>
  );
};

export default RSuiteHighlight;
