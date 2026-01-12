import {
  FileTextIcon,
  PlusIcon,
  CaretLeft,
  CaretRight,
  LockKeyIcon,
  UserIcon,
  BuildingsIcon,
} from "@phosphor-icons/react";
import type { MemoryContext } from "../types/memoryContext";

interface OrgContextDocumentListProps {
  contexts: MemoryContext[];
  userMemory?: MemoryContext | null;
  isUserMemoryEnabled?: boolean;
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

export function OrgContextDocumentList({
  contexts,
  userMemory,
  isUserMemoryEnabled = false,
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
  const renderMemoryItem = (
    ctx: MemoryContext,
    isUserMemoryItem: boolean = false,
  ) => {
    const isSelected = ctx.id === selectedContextId;
    const isDefault = ctx.isDefault;
    const showLock = isDefault || isUserMemoryItem;

    return (
      <button
        key={ctx.id}
        onClick={() => onSelectContext(ctx.id)}
        className={`
          w-full text-left px-3 py-2.5 rounded-xl cursor-pointer
          transition-all duration-200
          ${
            isSelected
              ? isUserMemoryItem
                ? "bg-violet-50 shadow-sm shadow-violet-200/50 ring-1 ring-violet-200/50"
                : isDefault
                  ? "bg-indigo-50 shadow-sm shadow-indigo-200/50 ring-1 ring-indigo-200/50"
                  : "bg-white shadow-sm shadow-indigo-100/50 ring-1 ring-indigo-100/50"
              : isUserMemoryItem
                ? "bg-violet-50/40 hover:bg-violet-50/70"
                : isDefault
                  ? "bg-indigo-50/40 hover:bg-indigo-50/70"
                  : "hover:bg-white/70"
          }
        `}
      >
        <div className="flex items-start gap-2.5">
          {showLock ? (
            isUserMemoryItem ? (
              <UserIcon
                size={15}
                weight={isSelected ? "duotone" : "regular"}
                className={`flex-shrink-0 mt-0.5 transition-colors duration-200 ${
                  isSelected ? "text-violet-600" : "text-violet-500"
                }`}
              />
            ) : (
              <LockKeyIcon
                size={15}
                weight={isSelected ? "duotone" : "regular"}
                className={`flex-shrink-0 mt-0.5 transition-colors duration-200 ${
                  isSelected ? "text-indigo-600" : "text-indigo-500"
                }`}
              />
            )
          ) : (
            <FileTextIcon
              size={15}
              weight={isSelected ? "duotone" : "regular"}
              className={`flex-shrink-0 mt-0.5 transition-colors duration-200 ${
                isSelected ? "text-indigo-600" : "text-gray-500"
              }`}
            />
          )}
          <span
            className={`text-[13px] leading-snug line-clamp-2 transition-colors duration-200 ${
              isSelected
                ? "text-gray-800 font-medium"
                : isUserMemoryItem
                  ? "text-violet-700"
                  : isDefault
                    ? "text-indigo-700"
                    : "text-gray-600"
            }`}
          >
            {ctx.key}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with title */}
      <div className="px-3 py-3 border-b border-gray-100/80">
        <span className="text-xs font-semibold text-gray-500 tracking-wider">
          Memories
        </span>
      </div>

      {/* Add new segment button - chat style (only visible to users with create permission) */}
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

      {/* List of contexts - grouped by type */}
      <div className="flex-1 overflow-y-auto settings-scrollbar">
        <div className="p-2">
          {isLoading && contexts.length === 0 && !userMemory ? (
            <div className="px-3 py-8 text-sm text-gray-400 text-center animate-pulse">
              Loading...
            </div>
          ) : (
            <>
              {/* ===== USER MEMORY (no header, just the item) ===== */}
              {isUserMemoryEnabled && userMemory && (
                <div className="mb-1">{renderMemoryItem(userMemory, true)}</div>
              )}

              {/* ===== DIVIDER (if both sections visible) ===== */}
              {isUserMemoryEnabled && userMemory && contexts.length > 0 && (
                <div className="border-t border-gray-100/80 my-3" />
              )}

              {/* ===== ORGANIZATION MEMORY SECTION ===== */}
              {contexts.length > 0 && (
                <div>
                  {isUserMemoryEnabled && userMemory && (
                    <div className="flex items-center gap-1.5 px-2 mb-2">
                      <BuildingsIcon
                        size={12}
                        weight="bold"
                        className="text-indigo-500"
                      />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Organization
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    {contexts.map((ctx) => renderMemoryItem(ctx, false))}
                  </div>
                </div>
              )}

              {/* Empty state - only show if NO memories at all */}
              {contexts.length === 0 && !userMemory && (
                <div className="px-3 py-8 text-sm text-gray-400 text-center">
                  No memories yet
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* iPhone-style Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-3 py-3 border-t border-gray-100/80">
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
  );
}

export default OrgContextDocumentList;
