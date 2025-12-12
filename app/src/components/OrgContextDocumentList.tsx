import { useRef, useCallback } from "react";
import { FileTextIcon, SpinnerIcon } from "@phosphor-icons/react";
import type { MemoryContext } from "../types/memoryContext";

interface OrgContextDocumentListProps {
  contexts: MemoryContext[];
  selectedContextId: string | null;
  onSelectContext: (id: string) => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function OrgContextDocumentList({
  contexts,
  selectedContextId,
  onSelectContext,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: OrgContextDocumentListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasNextPage || isFetchingNextPage || !fetchNextPage)
      return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Load more when within 100px of bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col h-full">
      {/* List of contexts */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto settings-scrollbar"
      >
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

              {/* Loading indicator for infinite scroll */}
              {isFetchingNextPage && (
                <div className="px-3 py-4 flex items-center justify-center">
                  <SpinnerIcon
                    size={16}
                    className="animate-spin text-gray-400"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrgContextDocumentList;
