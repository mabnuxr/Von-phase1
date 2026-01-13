import { useState, useEffect, useMemo, useCallback } from 'react';
import { ROWS_PER_PAGE } from '../constants';

// ============================================================================
// Types
// ============================================================================

export interface UseQueryPaginationReturn {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing pagination state
 *
 * @param totalRows - Total number of rows in the dataset
 * @param rowsPerPage - Number of rows to display per page (defaults to ROWS_PER_PAGE)
 * @returns Pagination state and navigation functions
 */
export function useQueryPagination(
  totalRows: number,
  rowsPerPage: number = ROWS_PER_PAGE
): UseQueryPaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.ceil(totalRows / rowsPerPage),
    [totalRows, rowsPerPage]
  );

  const startIndex = useMemo(
    () => (currentPage - 1) * rowsPerPage,
    [currentPage, rowsPerPage]
  );

  const endIndex = useMemo(
    () => Math.min(startIndex + rowsPerPage, totalRows),
    [startIndex, rowsPerPage, totalRows]
  );

  const goToNextPage = useCallback(
    () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    [totalPages]
  );

  const goToPrevPage = useCallback(
    () => setCurrentPage((p) => Math.max(1, p - 1)),
    []
  );

  // Reset to page 1 when total rows change
  useEffect(() => {
    setCurrentPage(1);
  }, [totalRows]);

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToNextPage,
    goToPrevPage,
    setCurrentPage,
  };
}
