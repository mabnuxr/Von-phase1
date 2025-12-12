import { useState, useEffect, useMemo } from "react";
import {
  PencilSimpleIcon,
  XIcon,
  CheckIcon,
  BrainIcon,
  TrashIcon,
  SidebarSimpleIcon,
} from "@phosphor-icons/react";
import { ConfirmationModal } from "@vonlabs/design-components";
import {
  useInfiniteMemoryContexts,
  useUpdateMemoryContext,
  useDeleteMemoryContext,
} from "../../hooks/useMemoryContexts";
import { OrgContextDocumentList } from "../OrgContextDocumentList";
import { OrgContextEditor } from "../OrgContextEditor";
import type { MemoryContext } from "../../types/memoryContext";

export function OrgContextTab() {
  // Sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Selection and editing state
  const [selectedContextId, setSelectedContextId] = useState<string | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState("");

  // Delete confirmation modal state
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

  // Handle context selection
  const handleSelectContext = (id: string) => {
    if (isEditing) {
      handleCancelEdit();
    }
    setSelectedContextId(id);
  };

  // Handle entering edit mode
  const handleStartEdit = () => {
    if (selectedContext) {
      setEditingContent(selectedContext.value);
      setIsEditing(true);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingContent("");
  };

  // Handle saving
  const handleSave = async () => {
    if (!selectedContextId) return;

    await updateMutation.mutateAsync({
      id: selectedContextId,
      data: { value: editingContent },
    });

    setIsEditing(false);
    setEditingContent("");
  };

  // Handle delete - open confirmation modal
  const handleDelete = () => {
    if (!selectedContextId) return;
    setIsDeleteModalOpen(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!selectedContextId) return;
    await deleteMutation.mutateAsync(selectedContextId);
    setSelectedContextId(null);
    setIsDeleteModalOpen(false);
  };

  // Get display content
  const displayContent = isEditing
    ? editingContent
    : selectedContext?.value || "";

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Org Context</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Von extracts insights from your team's questions to better understand
          your business.
        </p>
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
            <p className="text-sm text-gray-400">
              Insights will appear here as your team asks questions.
            </p>
          </div>
        )}

        {/* Two Column Layout */}
        {(isLoading || contexts.length > 0) && (
          <div className="mt-2 w-[75%] mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-indigo-100/50 border border-gray-200/40 h-full overflow-hidden">
            <div className="flex h-full">
              {/* Left Panel - Context List */}
              <div
                className={`
                  border-r border-gray-100/80 bg-gradient-to-b from-slate-50/50 to-gray-50/30 flex-shrink-0 flex flex-col
                  transition-all duration-300 ease-in-out
                  ${isSidebarCollapsed ? "w-0 overflow-hidden border-r-0" : "w-60"}
                `}
              >
                <OrgContextDocumentList
                  contexts={contexts}
                  selectedContextId={selectedContextId}
                  onSelectContext={handleSelectContext}
                  isLoading={isLoading}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                />
              </div>

              {/* Right Panel - Content */}
              <div className="flex-1 flex flex-col min-w-0 bg-white/50">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2.5">
                  {/* Left - Sidebar toggle */}
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50 rounded-xl transition-all duration-200 cursor-pointer"
                    title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                  >
                    <SidebarSimpleIcon size={18} weight="regular" />
                  </button>

                  {/* Center - Title */}
                  <h3 className="text-[13px] font-medium text-gray-600 truncate flex-1 mx-4 text-center">
                    {selectedContext?.key || ""}
                  </h3>

                  {/* Right - Actions */}
                  <div className="flex items-center gap-0.5">
                    {selectedContext && (
                      <>
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all duration-200 cursor-pointer"
                              title="Cancel"
                            >
                              <XIcon size={16} weight="regular" />
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={updateMutation.isPending}
                              className="p-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer"
                              title="Save"
                            >
                              <CheckIcon size={16} weight="bold" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={handleStartEdit}
                              className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50 rounded-xl transition-all duration-200 cursor-pointer"
                              title="Edit"
                            >
                              <PencilSimpleIcon size={16} weight="regular" />
                            </button>
                            <button
                              onClick={handleDelete}
                              disabled={deleteMutation.isPending}
                              className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
                              title="Delete"
                            >
                              <TrashIcon size={16} weight="regular" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-hidden">
                  {selectedContext ? (
                    <OrgContextEditor
                      content={displayContent}
                      onChange={setEditingContent}
                      isEditing={isEditing}
                      placeholder="No content"
                    />
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
