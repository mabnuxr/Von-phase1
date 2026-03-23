import { useState, useCallback, useEffect } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { PanelDrilldownPagination } from "../../../types/dashboard";

interface DrilldownPaginationProps {
  pagination: PanelDrilldownPagination;
  onPageChange: (page: number) => void;
}

export const DrilldownPagination: React.FC<DrilldownPaginationProps> = ({
  pagination,
  onPageChange,
}) => {
  const { page, totalPages, hasPrevPage, hasNextPage } = pagination;
  const [inputValue, setInputValue] = useState(String(page));

  useEffect(() => {
    setInputValue(String(page));
  }, [page]);

  const commitPage = useCallback(() => {
    const num = parseInt(inputValue, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= totalPages && num !== page) {
      onPageChange(num);
    } else {
      setInputValue(String(page));
    }
  }, [inputValue, totalPages, page, onPageChange]);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <button
        disabled={!hasPrevPage}
        onClick={() => onPageChange(page - 1)}
        className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        aria-label="Previous page"
      >
        <CaretLeftIcon size={14} weight="bold" />
      </button>

      <span className="text-xs text-gray-500">Page</span>

      <input
        type="text"
        inputMode="numeric"
        className="w-10 h-7 text-center text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={commitPage}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        aria-label="Current page"
      />

      <span className="text-xs text-gray-500">/ {totalPages}</span>

      <button
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        aria-label="Next page"
      >
        <CaretRightIcon size={14} weight="bold" />
      </button>
    </div>
  );
};
