import { CaretLeft, CaretRight, LockKeyIcon } from "@phosphor-icons/react";
import type { MemoryContext } from "../types/memoryContext";

interface OrgContextDocumentListProps {
  contexts: MemoryContext[];
  selectedContextId: string | null;
  onSelectContext: (id: string) => void;
  onCreateClick: () => void;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Whether the current user can create org memory (controls visibility of "New Org Memory" button) */
  canCreateOrgMemory?: boolean;
}

// Skeleton pill — widths cycle so the list reads as real content.
const SKELETON_WIDTHS = ["70%", "55%", "82%", "48%", "68%"];

export function OrgContextDocumentList({
  contexts,
  selectedContextId,
  onSelectContext,
  onCreateClick,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  canCreateOrgMemory = false,
}: OrgContextDocumentListProps) {
  // Helper to render a memory item
  const renderMemoryItem = (ctx: MemoryContext) => {
    const isSelected = ctx.id === selectedContextId;
    const isDefault = ctx.isDefault;

    return (
      <div
        key={ctx.id}
        className={`
          w-full text-left px-2.5 py-1.5 rounded-xl cursor-pointer
          transition-colors duration-150 border
          ${
            isSelected
              ? "bg-white border-gray-200/60"
              : "bg-transparent border-transparent hover:bg-white hover:border-gray-200/40"
          }
        `}
        onClick={() => onSelectContext(ctx.id)}
      >
        <div className="flex items-start gap-2 min-w-0">
          {isDefault && (
            <LockKeyIcon
              size={15}
              weight="regular"
              className="flex-shrink-0 mt-0.5 text-gray-700"
            />
          )}
          <span className="flex-1 min-w-0 text-sm line-clamp-2 text-gray-900">
            {ctx.key}
          </span>
        </div>
      </div>
    );
  };

  // Default memories first — system-owned seeds pinned to the top — then
  // user-created memories. A dashed separator marks the boundary if both
  // groups have entries.
  const defaultContexts = contexts.filter((c) => c.isDefault);
  const otherContexts = contexts.filter((c) => !c.isDefault);
  const showSkeleton = isLoading && contexts.length === 0;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Add new org memory button */}
      {canCreateOrgMemory && (
        <div className="px-2 py-2 border-b border-gray-100">
          <button
            onClick={onCreateClick}
            className="w-full py-2 flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white text-sm transition-all duration-200 cursor-pointer hover:bg-gray-800"
          >
            New Org Memory
          </button>
        </div>
      )}

      {/* Memory list */}
      <div className="flex-1 min-h-0 overflow-y-auto settings-scrollbar">
        <div className="pl-1 py-1 pr-2">
          {showSkeleton ? (
            <div
              className="flex flex-col gap-0.5"
              aria-label="Loading memory list"
            >
              {SKELETON_WIDTHS.map((width, i) => (
                <div
                  key={i}
                  className="px-2.5 py-1.5 rounded-xl border border-transparent"
                >
                  <div
                    className="h-4 bg-gray-100 rounded animate-pulse"
                    style={{ width }}
                  />
                </div>
              ))}
            </div>
          ) : contexts.length === 0 ? (
            <div className="px-3 py-8 text-sm text-gray-400 text-center">
              No organization memories yet
            </div>
          ) : (
            <>
              {defaultContexts.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {defaultContexts.map((ctx) => renderMemoryItem(ctx))}
                </div>
              )}
              {otherContexts.length > 0 && (
                <div
                  className={
                    defaultContexts.length > 0
                      ? "mt-2 pt-2 border-t border-dashed border-gray-200 flex flex-col gap-0.5"
                      : "flex flex-col gap-0.5"
                  }
                >
                  {otherContexts.map((ctx) => renderMemoryItem(ctx))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-3 py-2 border-t border-gray-100/80">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrgContextDocumentList;
