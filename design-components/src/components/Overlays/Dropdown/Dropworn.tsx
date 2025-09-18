import React from 'react';
import { Dropdown } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

interface RSuiteDropdownProps {
  title?: string;
  placement?:
    | 'topStart'
    | 'topEnd'
    | 'bottomStart'
    | 'bottomEnd'
    | 'leftStart'
    | 'leftEnd'
    | 'rightStart'
    | 'rightEnd';
  disabledItems?: boolean;
  itemCount?: number;
}

const RSuiteDropdown: React.FC<RSuiteDropdownProps> = ({
  title = 'Dropdown',
  placement = 'bottomStart',
  disabledItems = false,
  itemCount = 3,
}) => {
  const items = Array.from({ length: itemCount }, (_, i) => (
    <Dropdown.Item key={i} disabled={disabledItems}>
      Option {i + 1}
    </Dropdown.Item>
  ));

  return (
    <Dropdown title={title} placement={placement}>
      {items}
      <Dropdown.Separator />
      <Dropdown.Item panel style={{ padding: 10, width: 160 }}>
        Extra Panel Content
      </Dropdown.Item>
    </Dropdown>
  );
};

export default RSuiteDropdown;
