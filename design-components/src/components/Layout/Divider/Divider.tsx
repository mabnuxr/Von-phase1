import React from 'react';
import { Divider } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

type LayoutDividerProps = {
  vertical?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

const LayoutDivider: React.FC<LayoutDividerProps> = ({
  vertical = false,
  textAlign = 'center',
  children,
  style = {},
}) => {
  // Map textAlign to class name (like rsuite expects)
  const textAlignClass = !vertical && textAlign ? `rs-divider-with-text-${textAlign}` : '';

  return (
    <Divider vertical={vertical} className={textAlignClass} style={style}>
      {!vertical ? children : null}
    </Divider>
  );
};

export default LayoutDivider;
