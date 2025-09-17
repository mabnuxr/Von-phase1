import React from 'react';
import { Divider } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

type LayoutDividerProps = {
  vertical?: boolean;
  dashed?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

const LayoutDivider: React.FC<LayoutDividerProps> = ({
  vertical = false,
  dashed = false,
  textAlign = 'center',
  children,
  style = {},
}) => {
  return (
    <Divider
      vertical={vertical}
      dashed={dashed}
      style={style}
      {...(!vertical ? { textAlign } : {})}
    >
      {!vertical ? children : null}
    </Divider>
  );
};

export default LayoutDivider;
