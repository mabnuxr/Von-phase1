import React from 'react';
import { Heading } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

interface RSuiteHeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const RSuiteHeading: React.FC<RSuiteHeadingProps> = ({
  as = 'h2',
  children = 'Default Heading',
  className,
  style,
}) => {
  return (
    <Heading as={as} className={className} style={style}>
      {children}
    </Heading>
  );
};

export default RSuiteHeading;
