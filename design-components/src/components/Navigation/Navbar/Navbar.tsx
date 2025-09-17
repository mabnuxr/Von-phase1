import React from 'react';
import { Navbar, Nav } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

export interface NavbarLink {
  label: string;
  eventKey: string;
  disabled?: boolean;
}

export interface NavigationNavbarProps {
  brand?: string;
  appearance?: 'default' | 'inverse' | 'subtle';
  links?: NavbarLink[];
  placement?: 'left' | 'center' | 'right';
  onSelect?: (eventKey: string) => void;
}

const NavigationNavbar: React.FC<NavigationNavbarProps> = ({
  brand = 'MyApp',
  appearance = 'default',
  links = [],
  placement = 'right',
  onSelect,
}) => {
  return (
    <Navbar appearance={appearance}>
      <Navbar.Brand>{brand}</Navbar.Brand>
      <Nav pull={placement}>
        {links.map((link) => (
          <Nav.Item
            key={link.eventKey}
            eventKey={link.eventKey}
            disabled={link.disabled}
            onSelect={() => onSelect?.(link.eventKey)}
          >
            {link.label}
          </Nav.Item>
        ))}
      </Nav>
    </Navbar>
  );
};

export default NavigationNavbar;
