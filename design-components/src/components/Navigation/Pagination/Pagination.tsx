// components/PaginationControl.tsx

import React from 'react';
import { Pagination } from 'rsuite';

export interface PaginationProps {
  total: number;
  limit: number;
  activePage: number;
  size?: 'lg' | 'md' | 'sm' | 'xs';
  layout?: string[];
  disabled?: boolean;
  first?: boolean;
  last?: boolean;
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
  first = true,
  last = true,
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
      first={first}
      last={last}
      prev={prev}
      next={next}
      boundaryLinks={boundaryLinks}
      ellipsis={ellipsis}
      onChange={onChange}
    />
  );
};

export default PaginationControl;