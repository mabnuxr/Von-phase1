import {
  PlusIcon,
  CaretLeft,
  CaretRight,
  LockKeyIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { MemoryContext } from "../types/memoryContext";

interface OrgContextDocumentListProps {
  contexts: MemoryContext[];
  selectedContextId: string | null;
  onSelectContext: (id: string) => void;
  onCreateClick: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Whether the current user can create org memory (controls visibility of "New Org Memory" button) */
  canCreateOrgMemory?: boolean;
  canUpdateOrgMemory?: boolean;
  canDeleteOrgMemory?: boolean;
  isDeleting?: boolean;
}

export function OrgContextDocumentList({
  contexts,
  selectedContextId,
  onSelectContext,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  canCreateOrgMemory = false,
  canUpdateOrgMemory = false,
  canDeleteOrgMemory = false,
  isDeleting = false,
}: OrgContextDocumentListProps) {
  // Helper to render a memory item
  const renderMemoryItem = (ctx: MemoryContext) => {
    const isSelected = ctx.id === selectedContextId;
    const isDefault = ctx.isDefault;

    return (
      <div
        key={ctx.id}
        className={`
          w-full text-left px-3 py-2.5 rounded-xl cursor-pointer
          transition-all duration-200
          ${
            isSelected
              ? isDefault
                ? "bg-indigo-50 shadow-sm shadow-indigo-200/50 ring-1 ring-indigo-200/50"
                : "bg-white shadow-sm shadow-indigo-100/50 ring-1 ring-indigo-100/50"
              : isDefault
                ? "bg-indigo-50/40 hover:bg-indigo-50/70"
                : "hover:bg-white/70"
          }
        `}
        onClick={() => onSelectContext(ctx.id)}
      >
        <div className="flex items-start gap-2.5">
          {isDefault && (
            <LockKeyIcon
              size={15}
              weight={isSelected ? "duotone" : "regular"}
              className={`flex-shrink-0 mt-0.5 transition-colors duration-200 ${
                isSelected ? "text-indigo-600" : "text-indigo-500"
              }`}
            />
          )}
          <span
            className={`flex-1 text-sm leading-snug line-clamp-2 transition-colors duration-200 ${
              isSelected
                ? "text-gray-800 font-medium"
                : isDefault
                  ? "text-indigo-700"
                  : "text-gray-600"
            }`}
          >
            {ctx.key}
          </span>
          {/* Edit/Delete buttons on selected item */}
          {isSelected && (canUpdateOrgMemory || canDeleteOrgMemory) && (
            <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
              {canUpdateOrgMemory && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick?.();
                  }}
                  className="p-1 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50 rounded-lg transition-all duration-200 cursor-pointer"
                  title="Edit"
                >
                  <PencilSimpleIcon size={14} weight="regular" />
                </button>
              )}
              {canDeleteOrgMemory && !isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick?.();
                  }}
                  disabled={isDeleting}
                  className="p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete"
                >
                  <TrashIcon size={14} weight="regular" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Add new org memory button */}
      {canCreateOrgMemory && (
        <div className="px-3 py-3">
          <button
            onClick={onCreateClick}
            className="w-full h-[32px] flex items-center justify-center gap-2 rounded-lg bg-gray-900 text-white text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-gray-800"
          >
            New Org Memory
            <PlusIcon size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Memory list */}
      <div className="flex-1 min-h-0 overflow-y-auto settings-scrollbar">
        <div className="p-2">
          {isLoading && contexts.length === 0 ? (
            <div className="px-3 py-8 text-sm text-gray-400 text-center animate-pulse">
              Loading...
            </div>
          ) : contexts.length > 0 ? (
            <div className="space-y-1">
              {contexts.map((ctx) => renderMemoryItem(ctx))}
            </div>
          ) : (
            <div className="px-3 py-8 text-sm text-gray-400 text-center">
              No organization memories yet
            </div>
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
