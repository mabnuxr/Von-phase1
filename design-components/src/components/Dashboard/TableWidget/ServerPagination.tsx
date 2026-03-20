import { useMemo } from 'react';
import type { TablePaginationInfo } from '../types';

interface ServerPaginationProps {
  pagination: TablePaginationInfo;
  onPageChange: (page: number) => void;
}

/**
 * Builds a compact page-number list with ellipses.
 * e.g. [1, '…', 4, 5, 6, '…', 15]
 */
function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '…')[] = [1];

  if (current > 3) pages.push('…');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('…');

  pages.push(total);
  return pages;
}

const ServerPagination: React.FC<ServerPaginationProps> = ({ pagination, onPageChange }) => {
  const { page, totalRows, totalPages, hasNextPage, hasPrevPage, limit } = pagination;
  const pages = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  if (totalPages <= 1) return null;

  const startRow = (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, totalRows);

  return (
    <div className="server-pagination-wrapper">
      <span className="server-pagination-info">
        {startRow}–{endRow} of {totalRows}
      </span>

      <div className="server-pagination-controls">
        <button
          disabled={!hasPrevPage}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="server-pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              aria-current={p === page ? 'page' : undefined}
              className={p === page ? 'server-pagination-active' : ''}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export { ServerPagination };
