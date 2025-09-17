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
  items: NavigationBreadcrumb[];
  separator?: React.ReactNode;
  disabledLast?: boolean;
}

const NavigationBreadcrumb: React.FC<NavigationBreadcrumbProps> = ({
  items,
  separator = '/',
  disabledLast = false,
}) => {
  const renderedItems = items.map((item, index) => {
    const isLast = index === items.length - 1;
    const isDisabled = item.disabled || (isLast && disabledLast);
    return (
      <Breadcrumb.Item
        key={index}
        href={!isDisabled ? item.href : undefined}
        onClick={!isDisabled ? item.onClick : undefined}
        active={isLast}
      >
        {item.label}
      </Breadcrumb.Item>
    );
  });

  return <Breadcrumb separator={separator}>{renderedItems}</Breadcrumb>;
};

export default NavigationBreadcrumb;
