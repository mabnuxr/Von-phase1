// src/components/Overlays/Modal/RSuiteModal.tsx
import React from 'react';
import { Modal, Button } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

export interface OverlaysModel {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  backdrop?: boolean | 'static';
  full?: boolean;
  children?: React.ReactNode;
}

const OverlaysModel: React.FC<OverlaysModel> = ({
  open,
  onClose,
  title = 'Modal Title',
  size = 'md',
  backdrop = true,
  full = false,
  children,
}) => {
  return (
    <Modal open={open} onClose={onClose} size={size} backdrop={backdrop} full={full}>
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children || 'This is the modal content.'}</Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} appearance="primary">
          OK
        </Button>
        <Button onClick={onClose} appearance="subtle">
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OverlaysModel;
