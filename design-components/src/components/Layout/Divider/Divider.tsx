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
  return (
    <Divider vertical={vertical} style={style} {...(!vertical ? { textAlign } : {})}>
      {!vertical ? children : null}
    </Divider>
  );
};

export default LayoutDivider;
