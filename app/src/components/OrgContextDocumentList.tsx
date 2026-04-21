import {
  CaretLeft,
  CaretRight,
  LockKeyIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import type { MemoryContext } from "../types/memoryContext";

/** Lightweight descriptor for a Von-proposed new section. The real content
 *  lives on the parent; the list only needs id + title to render its pill. */
export interface ProposedNewSectionPreview {
  id: string;
  key: string;
}

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
  /** Map of context id → number of Von-proposed incoming updates. Each entry
   *  renders an "Update N" badge on that memory's pill. */
  updateCountByContextId?: Record<string, number>;
  /** Von-proposed new sections from bulk import. Rendered in a separate
   *  "Proposed New" group below the existing memories. */
  proposedNewSections?: ProposedNewSectionPreview[];
  /** Currently-selected proposed-new section, if any. */
  selectedProposedNewId?: string | null;
  /** Fires when the user clicks a proposed-new section pill. */
  onSelectProposedNew?: (id: string) => void;
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
  updateCountByContextId = {},
  proposedNewSections = [],
  selectedProposedNewId = null,
  onSelectProposedNew,
}: OrgContextDocumentListProps) {
  // Helper to render a memory item
  const renderMemoryItem = (ctx: MemoryContext) => {
    const isSelected = ctx.id === selectedContextId;
    const isDefault = ctx.isDefault;
    const proposalCount = updateCountByContextId[ctx.id] ?? 0;
    const hasProposedUpdates = proposalCount > 0;

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
          {hasProposedUpdates && (
            <span
              className="flex-shrink-0 inline-flex items-center h-[18px] px-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] font-medium leading-none"
              title={`${proposalCount} proposed incoming update${
                proposalCount === 1 ? "" : "s"
              }`}
              aria-label={`${proposalCount} proposed incoming update${
                proposalCount === 1 ? "" : "s"
              }`}
            >
              Update {proposalCount}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render one Von-proposed new section pill. Matches the existing memory
  // row's gray styling — provenance is signalled purely by a neutral "NEW"
  // tag rather than a colored wrapper.
  const renderProposedNewItem = (item: ProposedNewSectionPreview) => {
    const isSelected = item.id === selectedProposedNewId;
    return (
      <div
        key={item.id}
        className={`
          w-full text-left px-2.5 py-1.5 rounded-xl cursor-pointer
          transition-colors duration-150 border
          ${
            isSelected
              ? "bg-white border-gray-200/60"
              : "bg-transparent border-transparent hover:bg-white hover:border-gray-200/40"
          }
        `}
        onClick={() => onSelectProposedNew?.(item.id)}
      >
        <div className="flex items-start gap-2 min-w-0">
          <SparkleIcon
            size={14}
            weight="regular"
            className="flex-shrink-0 mt-0.5 text-gray-500"
          />
          <span className="flex-1 min-w-0 text-sm line-clamp-1 text-gray-900">
            {item.key}
          </span>
          <span
            className="flex-shrink-0 inline-flex items-center h-[18px] px-1.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-medium leading-none"
            aria-label="Proposed new section"
          >
            NEW
          </span>
        </div>
      </div>
    );
  };

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
          {isLoading && contexts.length === 0 ? (
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
          ) : contexts.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {contexts.map((ctx) => renderMemoryItem(ctx))}
            </div>
          ) : (
            <div className="px-3 py-8 text-sm text-gray-400 text-center">
              No organization memories yet
            </div>
          )}

          {/* Proposed new sections — dashed separator above to set them apart
              from the real memories without resorting to a heavy background. */}
          {proposedNewSections.length > 0 && (
            <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
              <div className="px-2.5 pt-0.5 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium tracking-wider uppercase text-gray-500">
                  Proposed New
                </span>
                <span className="inline-flex items-center h-[18px] min-w-[18px] px-1.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium leading-none">
                  {proposedNewSections.length}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {proposedNewSections.map((item) => renderProposedNewItem(item))}
              </div>
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
