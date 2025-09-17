// src/components/Navigation/Breadcrumb/NavigationBreadcrumb.tsx
import React from 'react';
import { Breadcrumb } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

export interface NavigationBreadcrumb {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface NavigationBreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  disabledLast?: boolean;
}

const NavigationBreadcrumb: React.FC<NavigationBreadcrumbProps> = ({
  items,
  separator = '/',
  disabledLast = false
}) => {
  const renderedItems = items.map((item, index) => {
    const isLast = index === items.length - 1;
    return (
      <Breadcrumb.Item
        key={index}
        href={!isLast || !disabledLast ? item.href : undefined}
        onClick={item.onClick}
        active={isLast}
        disabled={item.disabled || (isLast && disabledLast)}
      >
        {item.label}
      </Breadcrumb.Item>
    );
  });

  return <Breadcrumb separator={separator}>{renderedItems}</Breadcrumb>;
};

export default NavigationBreadcrumb;
