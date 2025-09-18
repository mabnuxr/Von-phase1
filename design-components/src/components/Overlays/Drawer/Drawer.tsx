import React from 'react';
import { Drawer as RsDrawer } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  placement?: DrawerPlacement;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'full';
  title?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  placement = 'right',
  size = 'md',
  title,
  children,
  style,
  className,
}) => {
  return (
    <RsDrawer
      open={open}
      onClose={onClose}
      placement={placement}
      size={size}
      className={className}
      style={style}
    >
      {title ? (
        <RsDrawer.Header>
          <RsDrawer.Title>{title}</RsDrawer.Title>
        </RsDrawer.Header>
      ) : null}
      <RsDrawer.Body>{children}</RsDrawer.Body>
    </RsDrawer>
  );
};

export default Drawer;
