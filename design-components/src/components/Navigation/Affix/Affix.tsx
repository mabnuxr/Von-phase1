import React from 'react';
import { Affix, Button } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

export interface RSuiteAffixProps {
  top?: number;
  children?: React.ReactNode;
  offsetTop?: number;
  offsetBottom?: number;
}

const RSuiteAffix: React.FC<RSuiteAffixProps> = ({
  top = 0,
  children,
  offsetTop,
  offsetBottom,
}) => {
  return (
    <Affix top={offsetTop ?? top} bottom={offsetBottom}>
      {children || (
        <Button appearance="primary">
          I stick to the top
        </Button>
      )}
    </Affix>
  );
};

export default RSuiteAffix;
