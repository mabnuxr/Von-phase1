import React from 'react';
import { Drawer } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

interface OverlaysDrawerProps {
  open: boolean;
  onClose: () => void;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'full';
  title?: string;
  closable?: boolean;
  children?: React.ReactNode;
}

const OverlaysDrawer: React.FC<OverlaysDrawerProps> = ({
  open,
  onClose,
  placement = 'right',
  size = 'md',
  title = 'Drawer Title',
  closable = true,
  children,
}) => {
  return (
    <Drawer open={open} onClose={onClose} placement={placement} size={size}>
      <Drawer.Header>
        <Drawer.Title>{title}</Drawer.Title>
        {closable && <Drawer.Actions><span onClick={onClose} style={{ cursor: 'pointer' }}>Close</span></Drawer.Actions>}
      </Drawer.Header>
      <Drawer.Body>{children}</Drawer.Body>
    </Drawer>
  );
};

export default OverlaysDrawer;
