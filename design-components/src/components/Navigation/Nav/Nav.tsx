// src/components/Navigation/Nav/RSuiteNav.tsx
import React, { useState } from 'react';
import { Nav } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

export interface NavItem {
  eventKey: string;
  label: string;
  disabled?: boolean;
}

export interface NavigationNavProps {
  items: NavItem[];
  appearance?: 'default' | 'subtle' | 'tabs';
  orientation?: 'horizontal' | 'vertical';
  activeKey?: string;
  onSelect?: (eventKey: string) => void;
}

const NavigatioNav: React.FC<NavigationNavProps> = ({
  items,
  appearance = 'default',
  orientation = 'horizontal',
  activeKey,
  onSelect,
}) => {
  const [internalActive, setInternalActive] = useState<string | undefined>(activeKey);

  const handleSelect = (key: string) => {
    setInternalActive(key);
    onSelect?.(key);
  };

  return (
    <Nav
      appearance={appearance}
      vertical={orientation === 'vertical'}
      activeKey={internalActive}
      onSelect={handleSelect}
    >
      {items.map((item) => (
        <Nav.Item key={item.eventKey} eventKey={item.eventKey} disabled={item.disabled}>
          {item.label}
        </Nav.Item>
      ))}
    </Nav>
  );
};

export default NavigatioNav;
