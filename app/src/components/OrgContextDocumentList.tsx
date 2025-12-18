import { FileTextIcon, PlusIcon, CaretLeft, CaretRight } from "@phosphor-icons/react";
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
}

export function OrgContextDocumentList({
  contexts,
  selectedContextId,
  onSelectContext,
  onCreateClick,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
}: OrgContextDocumentListProps) {

  return (
    <div className="flex flex-col h-full">
      {/* Header with title */}
      <div className="px-3 py-3 border-b border-gray-100/80">
        <span className="text-xs font-semibold text-gray-500 tracking-wider">
          Memories
        </span>
      </div>

      {/* Add new segment button - chat style */}
      <div className="px-3 py-3">
        <button
          onClick={onCreateClick}
          className="w-full h-[32px] flex items-center justify-center gap-2 rounded-lg bg-gray-900 text-white text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-gray-800"
        >
          New Memory
          <PlusIcon size={14} weight="bold" />
        </button>
      </div>

      {/* List of contexts */}
      <div className="flex-1 overflow-y-auto settings-scrollbar">
        <div className="p-2">
          {isLoading && contexts.length === 0 ? (
            <div className="px-3 py-8 text-sm text-gray-400 text-center animate-pulse">
              Loading...
            </div>
          ) : contexts.length === 0 ? (
            <div className="px-3 py-8 text-sm text-gray-400 text-center">
              No memories yet
            </div>
          ) : (
            <div className="space-y-1">
              {contexts.map((ctx) => {
                const isSelected = ctx.id === selectedContextId;

                return (
                  <button
                    key={ctx.id}
                    onClick={() => onSelectContext(ctx.id)}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-xl cursor-pointer
                      transition-all duration-200
                      ${
                        isSelected
                          ? "bg-white shadow-sm shadow-indigo-100/50 ring-1 ring-indigo-100/50"
                          : "hover:bg-white/70"
                      }
                    `}
                  >
                    <div className="flex items-start gap-2.5">
                      <FileTextIcon
                        size={15}
                        weight={isSelected ? "duotone" : "regular"}
                        className={`flex-shrink-0 mt-0.5 transition-colors duration-200 ${
                          isSelected ? "text-indigo-600" : "text-gray-500"
                        }`}
                      />
                      <span
                        className={`text-[13px] leading-snug line-clamp-2 transition-colors duration-200 ${
                          isSelected
                            ? "text-gray-800 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {ctx.key}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
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
