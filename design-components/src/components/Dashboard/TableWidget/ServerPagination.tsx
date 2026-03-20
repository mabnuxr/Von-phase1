import { useState, useCallback, useEffect } from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { TablePaginationInfo } from '../types';

interface ServerPaginationProps {
  pagination: TablePaginationInfo;
  onPageChange: (page: number) => void;
}

const ServerPagination: React.FC<ServerPaginationProps> = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasPrevPage, hasNextPage } = pagination;

  // Local input value so the user can type freely, committed on Enter/blur
  const [inputValue, setInputValue] = useState(String(page));

  // Sync input when page changes externally (e.g. optimistic update)
  useEffect(() => {
    setInputValue(String(page));
  }, [page]);

  const commitPage = useCallback(() => {
    const num = parseInt(inputValue, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= totalPages && num !== page) {
      onPageChange(num);
    } else {
      // Reset to current page if invalid
      setInputValue(String(page));
    }
  }, [inputValue, totalPages, page, onPageChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur(); // triggers onBlur → commitPage
      }
    },
    [commitPage]
  );

  if (totalPages <= 1) return null;

  return (
    <div className="server-pagination-bar">
      <button
        disabled={!hasPrevPage}
        onClick={() => onPageChange(page - 1)}
        className="server-pagination-arrow"
        aria-label="Previous page"
      >
        <CaretLeftIcon size={14} weight="bold" />
      </button>

      <span className="server-pagination-label">Page</span>

      <input
        type="text"
        inputMode="numeric"
        className="server-pagination-input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={commitPage}
        onKeyDown={handleKeyDown}
        aria-label="Current page"
      />

      <span className="server-pagination-label">/ {totalPages}</span>

      <button
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        className="server-pagination-arrow"
        aria-label="Next page"
      >
        <CaretRightIcon size={14} weight="bold" />
      </button>
    </div>
  );
};

export { ServerPagination };
