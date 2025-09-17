// src/components/Overlays/Popover/OverlaysPopover.tsx
import React from 'react';
import { Whisper, Popover, Button } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

export interface OverlaysPopoverProps {
  placement?: 
    | 'top' | 'topStart' | 'topEnd'
    | 'bottom' | 'bottomStart' | 'bottomEnd'
    | 'left' | 'leftStart' | 'leftEnd'
    | 'right' | 'rightStart' | 'rightEnd';
  trigger?: 'click' | 'hover' | 'focus' | 'active' | 'none';
  title?: string;
  content?: React.ReactNode;
  enterable?: boolean;
  buttonLabel?: string;
}

const OverlaysPopover: React.FC<OverlaysPopoverProps> = ({
  placement = 'bottom',
  trigger = 'click',
  title = 'Popover Title',
  content = 'This is the popover content.',
  enterable = false,
  buttonLabel = 'Click me',
}) => {
  const speaker = (
    <Popover title={title}>
      {content}
    </Popover>
  );

  return (
    <Whisper
      trigger={trigger}
      placement={placement}
      speaker={speaker}
      enterable={enterable}
    >
      <Button appearance="primary">{buttonLabel}</Button>
    </Whisper>
  );
};

export default OverlaysPopover;
