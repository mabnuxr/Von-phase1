import { useState, useEffect, useMemo } from "react";
import {
  PencilSimpleIcon,
  BrainIcon,
  TrashIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import { ConfirmationModal } from "@vonlabs/design-components";
import {
  useInfiniteMemoryContexts,
  useUpdateMemoryContext,
  useDeleteMemoryContext,
  useCreateMemoryContext,
} from "../../hooks/useMemoryContexts";
import { OrgContextDocumentList } from "../OrgContextDocumentList";
import { OrgContextEditor } from "../OrgContextEditor";
import { MemoryContextPane } from "../MemoryContextPane";
import type { MemoryContext } from "../../types/memoryContext";

export function OrgContextTab() {
  // Selection state
  const [selectedContextId, setSelectedContextId] = useState<string | null>(
    null,
  );

  // Pane state
  const [isPaneOpen, setIsPaneOpen] = useState(false);
  const [paneMode, setPaneMode] = useState<"create" | "edit">("create");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch memory contexts with infinite scroll
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteMemoryContexts("tenant", 10);
  const updateMutation = useUpdateMemoryContext();
  const deleteMutation = useDeleteMemoryContext();
  const createMutation = useCreateMemoryContext();

  // Flatten all pages into a single array
  const contexts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data?.pages]);

  // Auto-select first context when data loads
  useEffect(() => {
    if (contexts.length > 0 && !selectedContextId) {
      setSelectedContextId(contexts[0].id);
    }
  }, [contexts, selectedContextId]);

  // Get selected context
  const selectedContext = contexts.find(
    (ctx: MemoryContext) => ctx.id === selectedContextId,
  );

  // Handle context selection - just select, don't open pane
  const handleSelectContext = (id: string) => {
    setSelectedContextId(id);
  };

  // Handle create click - open create pane
  const handleCreateClick = () => {
    setPaneMode("create");
    setIsPaneOpen(true);
  };

  // Handle edit click - open edit pane
  const handleEditClick = () => {
    if (selectedContext) {
      setPaneMode("edit");
      setIsPaneOpen(true);
    }
  };

  // Handle pane close
  const handlePaneClose = () => {
    setIsPaneOpen(false);
  };

  // Handle save from pane
  const handleSave = async (data: {
    key: string;
    description: string;
    value: string;
  }) => {
    if (paneMode === "create") {
      // Create new memory
      const newMemory = await createMutation.mutateAsync({
        key: data.key,
        description: data.description,
        accessLevel: "tenant",
      });

      // If content was added, update it immediately
      if (data.value.trim()) {
        await updateMutation.mutateAsync({
          id: newMemory.id,
          data: { value: data.value },
        });
      }

      setSelectedContextId(newMemory.id);
    } else if (selectedContextId) {
      // Update existing memory
      await updateMutation.mutateAsync({
        id: selectedContextId,
        data: {
          key: data.key,
          description: data.description,
          value: data.value,
        },
      });
    }

    setIsPaneOpen(false);
  };

  // Handle delete click - open confirmation modal
  const handleDeleteClick = () => {
    if (selectedContext) {
      setIsDeleteModalOpen(true);
    }
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!selectedContextId) return;
    await deleteMutation.mutateAsync(selectedContextId);
    setSelectedContextId(null);
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Org Context</h2>
          <div className="flex flex-row items-center gap-2">
            <div className="flex-shrink-0">
              <InfoIcon size={20} className="text-indigo-600" />
            </div>
            <span className="mt-[2px] ml-auto text-xs font-medium text-indigo-600">
              User memory coming soon
            </span>
          </div>
        </div>

        <div className="flex items-center mt-0.5">
          <p className="text-sm text-gray-500">
            Von extracts insights from your team's questions to better
            understand your business.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        {/* Error state */}
        {error && (
          <div className="text-center py-8 px-6 bg-red-50/80 rounded-2xl backdrop-blur-sm">
            <p className="text-sm text-red-500">Failed to load memory</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && contexts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
              <BrainIcon
                size={32}
                weight="duotone"
                className="text-indigo-400"
              />
            </div>
            <h3 className="text-base font-medium text-gray-600 mb-1">
              No memories yet
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Insights will appear here as your team asks questions.
            </p>
            <button
              onClick={handleCreateClick}
              className="h-[32px] px-4 flex items-center justify-center gap-2 rounded-lg bg-gray-900 text-white text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-gray-800"
            >
              Add new segment
            </button>
          </div>
        )}

        {/* Two Column Layout */}
        {(isLoading || contexts.length > 0) && (
          <div className="mt-2 w-[75%] mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-indigo-100/50 border border-gray-200/40 h-full overflow-hidden">
            <div className="flex h-full">
              {/* Left Panel - Context List */}
              <div className="w-60 border-r border-gray-100/80 bg-gradient-to-b from-slate-50/50 to-gray-50/30 flex-shrink-0 flex flex-col">
                <OrgContextDocumentList
                  contexts={contexts}
                  selectedContextId={selectedContextId}
                  onSelectContext={handleSelectContext}
                  onCreateClick={handleCreateClick}
                  isLoading={isLoading}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                />
              </div>

              {/* Right Panel - View Content */}
              <div className="flex-1 flex flex-col min-w-0 bg-white/50">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                  <div />
                  {/* Right - Edit & Delete Actions */}
                  <div className="flex items-center gap-0.5">
                    {selectedContext && (
                      <>
                        <button
                          onClick={handleEditClick}
                          className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50 rounded-xl transition-all duration-200 cursor-pointer"
                          title="Edit"
                        >
                          <PencilSimpleIcon size={16} weight="regular" />
                        </button>
                        <button
                          onClick={handleDeleteClick}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
                          title="Delete"
                        >
                          <TrashIcon size={16} weight="regular" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content Area - View Mode */}
                <div className="flex-1 overflow-y-auto p-5">
                  {selectedContext ? (
                    <div className="flex flex-col gap-5 h-full">
                      {/* Description */}
                      <div className="bg-gray-50/60 rounded-xl p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                          When should the agent use this?
                        </label>
                        <p className="text-sm text-gray-700">
                          {selectedContext.description || "—"}
                        </p>
                      </div>

                      {/* Memory Content */}
                      <div className="flex-1 flex flex-col min-h-0 bg-gray-50/60 rounded-xl p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                          Memory Content
                        </label>
                        <div className="flex-1 overflow-hidden">
                          <OrgContextEditor
                            content={selectedContext.value || ""}
                            onChange={() => {}}
                            isEditing={false}
                            placeholder="No content yet"
                            contentKey={`${selectedContextId}-${selectedContext.updatedAt || selectedContext.createdAt}`}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      {isLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        "Select a memory to view"
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Memory Context Pane (Sidebar for editing/creating) */}
      <MemoryContextPane
        isOpen={isPaneOpen}
        onClose={handlePaneClose}
        mode={paneMode}
        context={paneMode === "edit" ? selectedContext : null}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Memory"
        message="Are you sure you want to delete this memory context? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmVariant="danger"
      />
    </div>
  );
}

export default OrgContextTab;
