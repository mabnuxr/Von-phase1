// components/PaginationControl.tsx

import React from 'react';
import { Pagination } from 'rsuite';

export interface PaginationProps {
  total: number;
  limit: number;
  activePage: number;
  size?: 'lg' | 'md' | 'sm' | 'xs';
  layout?: ('total' | 'pager' | 'limit' | 'skip' | '-')[];
  disabled?: boolean;
  prev?: boolean;
  next?: boolean;
  boundaryLinks?: boolean;
  ellipsis?: boolean;
  onChange?: (page: number) => void;
}

const PaginationControl: React.FC<PaginationProps> = ({
  total,
  limit,
  activePage,
  size = 'md',
  layout = ['total', '-', 'pager', 'limit'],
  disabled = false,
  prev = true,
  next = true,
  boundaryLinks = true,
  ellipsis = true,
  onChange,
}) => {
  return (
    <Pagination
      total={total}
      limit={limit}
      activePage={activePage}
      size={size}
      layout={layout}
      disabled={disabled}
      prev={prev}
      next={next}
      boundaryLinks={boundaryLinks}
      ellipsis={ellipsis}
      onChange={onChange as unknown as React.FormEventHandler<HTMLDivElement>}
    />
  );
};

export default PaginationControl;
