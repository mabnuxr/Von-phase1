import { useState, useMemo, useCallback } from 'react';
import type { QueryColumn } from '../../TransparencyDrawer/types';

// ============================================================================
// Types
// ============================================================================

export interface ArtifactContentData {
  id: string;
  name: string;
  description?: string;
  query?: string;
  columns: QueryColumn[];
  rows: Record<string, string | number>[];
  duration?: number;
  rowCount?: number;
  isComplete?: boolean;
}

export interface UseArtifactContentReturn {
  /** Whether the SQL query section is expanded */
  isQueryExpanded: boolean;
  /** Toggle the query section expansion */
  toggleQueryExpanded: () => void;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Start index for current page (0-indexed) */
  startIndex: number;
  /** End index for current page (exclusive) */
  endIndex: number;
  /** Navigate to next page */
  goToNextPage: () => void;
  /** Navigate to previous page */
  goToPrevPage: () => void;
  /** Rows for the current page */
  currentRows: Record<string, string | number>[];
  /** Total number of rows */
  totalRows: number;
}

// ============================================================================
// Constants
// ============================================================================

const ROWS_PER_PAGE = 10;

// ============================================================================
// Hook
// ============================================================================

/**
 * useArtifactContent - Business logic hook for artifact content display
 *
 * Manages:
 * - SQL query section expansion state
 * - Pagination for data table rows
 */
export function useArtifactContent(
  rows: Record<string, string | number>[],
  rowsPerPage: number = ROWS_PER_PAGE
): UseArtifactContentReturn {
  const [isQueryExpanded, setIsQueryExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);

  const currentRows = useMemo(() => rows.slice(startIndex, endIndex), [rows, startIndex, endIndex]);

  const toggleQueryExpanded = useCallback(() => {
    setIsQueryExpanded((prev) => !prev);
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  return {
    isQueryExpanded,
    toggleQueryExpanded,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToNextPage,
    goToPrevPage,
    currentRows,
    totalRows,
  };
}
