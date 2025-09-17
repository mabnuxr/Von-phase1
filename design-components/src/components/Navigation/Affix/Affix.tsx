import React from 'react';
import { Affix, Button } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

export interface RSuiteAffixProps {
  top?: number;
  children?: React.ReactNode;
  offsetTop?: number;
  // rsuite Affix has no bottom prop in types we consume
}

const RSuiteAffix: React.FC<RSuiteAffixProps> = ({ top = 0, children, offsetTop }) => {
  return (
    <Affix top={offsetTop ?? top}>
      {children || <Button appearance="primary">I stick to the top</Button>}
    </Affix>
  );
};

export default RSuiteAffix;
