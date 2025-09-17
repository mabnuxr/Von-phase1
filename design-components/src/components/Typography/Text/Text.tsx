import React from 'react';
import { Text } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

interface RSuiteTextProps {
  children: React.ReactNode;
  muted?: boolean;
  strong?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  fontSize?: string;
}

const RSuiteText: React.FC<RSuiteTextProps> = ({
  children,
  muted = false,
  strong = false,
  italic = false,
  underline = false,
  strikethrough = false,
  color,
  fontSize,
}) => {
  const style: React.CSSProperties = {
    color,
    fontSize,
    fontStyle: italic ? 'italic' : undefined,
    textDecoration: [
      underline ? 'underline' : '',
      strikethrough ? 'line-through' : '',
    ]
      .filter(Boolean)
      .join(' ') || undefined,
    fontWeight: strong ? 'bold' : undefined,
  };

  return (
    <Text muted={muted} style={style}>
      {children}
    </Text>
  );
};

export default RSuiteText;
