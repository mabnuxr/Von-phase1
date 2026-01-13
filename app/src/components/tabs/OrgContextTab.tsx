import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { PencilSimpleIcon, BrainIcon, TrashIcon } from "@phosphor-icons/react";
import { ConfirmationModal } from "@vonlabs/design-components";
import { Streamdown } from "streamdown";
import {
  useMemoryContexts,
  useUpdateMemoryContext,
  useDeleteMemoryContext,
  useCreateMemoryContext,
} from "../../hooks/useMemoryContexts";
import { OrgContextDocumentList } from "../OrgContextDocumentList";
import { MemoryContextPane } from "../MemoryContextPane";
import type { MemoryContext } from "../../types/memoryContext";
import { useToast } from "../../hooks/useToast";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { usePermissions, Resource } from "../../hooks/usePermissions";
import { ApiError } from "../../services/apiClient";

export function OrgContextTab() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial view from URL parameter (default to "org")
  const viewFromUrl = searchParams.get("view");
  const initialView: "org" | "personal" =
    viewFromUrl === "personal" ? "personal" : "org";

  // Selection state
  const [selectedContextId, setSelectedContextId] = useState<string | null>(
    null,
  );

  // Pane state
  const [isPaneOpen, setIsPaneOpen] = useState(false);
  const [paneMode, setPaneMode] = useState<"create" | "edit">("create");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Toast notifications
  const { showToast } = useToast();

  // Feature flags
  const { isUserMemoryEnabled } = useFeatureFlag();

  // Get permissions for org memory (tenant-level)
  const { data: orgMemoryPermissions } = usePermissions(
    Resource.MEMORY_CONTEXT,
    { access_level: "tenant" },
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const prevPageRef = useRef(currentPage);

  // Fetch org memory contexts with pagination
  const { data, isLoading, error } = useMemoryContexts(
    "tenant",
    currentPage,
    20,
  );

  // Fetch user memory (only when feature flag is enabled)
  const {
    data: userMemoryData,
    isLoading: isUserMemoryLoading,
    refetch: refetchUserMemory,
  } = useMemoryContexts("user", 1, 1, { enabled: isUserMemoryEnabled });
  const updateMutation = useUpdateMemoryContext();
  const deleteMutation = useDeleteMemoryContext();
  const createMutation = useCreateMemoryContext();

  // Extract contexts and pagination info (memoized to prevent useEffect loop)
  const contexts = useMemo(() => data?.data || [], [data?.data]);
  const pagination = data?.pagination;

  // Extract user memory (single item or null)
  const userMemory = useMemo(
    () => (isUserMemoryEnabled ? userMemoryData?.data?.[0] || null : null),
    [userMemoryData?.data, isUserMemoryEnabled],
  );

  // Refresh user memory on mount to reflect updates made via chat
  useEffect(() => {
    if (isUserMemoryEnabled) {
      refetchUserMemory();
    }
  }, [isUserMemoryEnabled, refetchUserMemory]);

  // Auto-create user memory if feature is enabled but no user memory exists
  const [isCreatingUserMemory, setIsCreatingUserMemory] = useState(false);
  const hasAttemptedUserMemoryCreation = useRef(false);

  useEffect(() => {
    // Only proceed if we have loaded user memory data (not undefined)
    // and it's empty (length === 0 means no user memory exists)
    const userMemoryLoaded = userMemoryData !== undefined;
    const hasNoUserMemory =
      userMemoryLoaded && (userMemoryData?.data?.length ?? 0) === 0;

    const shouldCreateUserMemory =
      isUserMemoryEnabled &&
      !isUserMemoryLoading &&
      userMemoryLoaded &&
      hasNoUserMemory &&
      !isCreatingUserMemory &&
      !hasAttemptedUserMemoryCreation.current;

    if (shouldCreateUserMemory) {
      hasAttemptedUserMemoryCreation.current = true;
      setIsCreatingUserMemory(true);

      createMutation
        .mutateAsync({
          key: "User Memory",
          description:
            "Personal context and preferences that apply only to your conversations",
          value: "",
          accessLevel: "user",
        })
        .then((newMemory) => {
          console.log("[OrgContextTab] User memory created successfully");
          refetchUserMemory();
          // Auto-select the new user memory if no org contexts exist
          if (contexts.length === 0 && newMemory?.id) {
            setSelectedContextId(newMemory.id);
          }
        })
        .catch((error) => {
          console.error("[OrgContextTab] Failed to create user memory:", error);
        })
        .finally(() => {
          setIsCreatingUserMemory(false);
        });
    }
  }, [
    isUserMemoryEnabled,
    isUserMemoryLoading,
    userMemoryData,
    isCreatingUserMemory,
    createMutation,
    refetchUserMemory,
    contexts.length,
  ]);

  // Combined loading state
  const isAnyLoading =
    isLoading ||
    (isUserMemoryEnabled && (isUserMemoryLoading || isCreatingUserMemory));

  // Auto-select first org memory context when data loads or page changes
  // Prioritize org memory over user memory for initial selection
  useEffect(() => {
    const pageChanged = prevPageRef.current !== currentPage;

    // Select first org memory context if:
    // 1. No context is selected, OR
    // 2. Page has changed
    if (!selectedContextId || pageChanged) {
      if (contexts.length > 0) {
        // Prefer org memory (first in list)
        setSelectedContextId(contexts[0].id);
      } else if (userMemory) {
        // Fall back to user memory if no org memories exist
        setSelectedContextId(userMemory.id);
      }
    }

    // Update previous page reference
    prevPageRef.current = currentPage;
  }, [contexts, userMemory, selectedContextId, currentPage]);

  // Auto-navigate to previous page if current page is empty and not the first page
  useEffect(() => {
    if (
      !isLoading &&
      contexts.length === 0 &&
      currentPage > 1 &&
      pagination?.totalPages !== undefined &&
      currentPage > pagination.totalPages
    ) {
      setCurrentPage(currentPage - 1);
    }
  }, [contexts.length, currentPage, isLoading, pagination?.totalPages]);

  // Get selected context (search both user memory and org contexts)
  const selectedContext = useMemo(() => {
    if (selectedContextId === userMemory?.id) return userMemory;
    return contexts.find((ctx: MemoryContext) => ctx.id === selectedContextId);
  }, [selectedContextId, userMemory, contexts]);

  // Permission flags derived from org memory permissions
  const canCreateOrgMemory = orgMemoryPermissions?.create ?? false;
  const canUpdateOrgMemory = orgMemoryPermissions?.update ?? false;
  const canDeleteOrgMemory = orgMemoryPermissions?.delete ?? false;

  // Determine if the selected context can be edited
  // - User memory: always editable by the user
  // - Org memory: only editable if user has update permission (admins)
  const canEditSelectedContext = useMemo(() => {
    if (!selectedContext) return false;
    const isUserMemory = selectedContext.accessLevel === "user";
    return isUserMemory || canUpdateOrgMemory;
  }, [selectedContext, canUpdateOrgMemory]);

  // Handle context selection - just select, don't open pane
  const handleSelectContext = (id: string) => {
    setSelectedContextId(id);
  };

  // Handle tab change - auto-select first item in the new tab and update URL
  const handleTabChange = (tab: "org" | "personal") => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("view", tab);
      return newParams;
    });

    if (tab === "org") {
      // Select first org memory if available
      if (contexts.length > 0) {
        setSelectedContextId(contexts[0].id);
      }
    } else {
      // Select user memory if available
      if (userMemory) {
        setSelectedContextId(userMemory.id);
      }
    }
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
    try {
      if (paneMode === "create") {
        // Create new memory with all fields including value in ONE call
        const newMemory = await createMutation.mutateAsync({
          key: data.key,
          description: data.description,
          value: data.value,
          accessLevel: "tenant",
        });

        setSelectedContextId(newMemory.id);
        showToast({
          message: "Memory created successfully",
          variant: "success",
        });
      } else if (selectedContextId) {
        // Update existing memory
        // Don't send key field for default context (it's readonly)
        const updateData: {
          key?: string;
          description: string;
          value: string;
        } = {
          description: data.description,
          value: data.value,
        };

        // Only include key if not a default context or user memory
        if (
          !selectedContext?.isDefault &&
          selectedContext?.accessLevel !== "user"
        ) {
          updateData.key = data.key;
        }

        await updateMutation.mutateAsync({
          id: selectedContextId,
          data: updateData,
        });
        showToast({
          message: "Memory updated successfully",
          variant: "success",
        });
      }

      setIsPaneOpen(false);
    } catch (error) {
      console.error("Failed to save memory:", error);

      // Extract error message from API error
      let errorMessage = "Failed to save memory. Please try again.";

      if (error instanceof ApiError) {
        errorMessage = error.message;

        // Check for validation errors (422)
        if (error.statusCode === 422 && error.response) {
          const response = error.response as Record<string, unknown>;
          if (response.detail && typeof response.detail === "string") {
            errorMessage = response.detail;
          } else if (Array.isArray(response.detail)) {
            // Pydantic validation errors
            const validationErrors = response.detail as Array<{
              loc: string[];
              msg: string;
            }>;
            errorMessage = validationErrors
              .map((err) => `${err.loc.join(".")}: ${err.msg}`)
              .join(", ");
          }
        }
      }

      showToast({
        message: errorMessage,
        variant: "error",
      });

      // Keep pane open so user can retry
    }
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

    try {
      await deleteMutation.mutateAsync(selectedContextId);
      setSelectedContextId(null);
      setIsDeleteModalOpen(false);
      showToast({
        message: "Memory deleted successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to delete memory:", error);

      let errorMessage = "Failed to delete memory. Please try again.";
      if (error instanceof ApiError) {
        errorMessage = error.message;
      }

      showToast({
        message: errorMessage,
        variant: "error",
      });

      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Memory</h2>
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

        {/* Empty state - only show when not loading and no memory exists (and not creating user memory) */}
        {!isAnyLoading &&
          contexts.length === 0 &&
          !userMemory &&
          !isCreatingUserMemory && (
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
        {(isAnyLoading || contexts.length > 0 || userMemory) && (
          <div className="mt-2 w-[75%] mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-indigo-100/50 border border-gray-200/40 h-full overflow-hidden">
            <div className="flex h-full">
              {/* Left Panel - Context List */}
              <div className="w-60 h-full border-r border-gray-100/80 bg-gradient-to-b from-slate-50/50 to-gray-50/30 flex-shrink-0 flex flex-col">
                <OrgContextDocumentList
                  contexts={contexts}
                  userMemory={userMemory}
                  isUserMemoryEnabled={isUserMemoryEnabled}
                  selectedContextId={selectedContextId}
                  onSelectContext={handleSelectContext}
                  onCreateClick={handleCreateClick}
                  isLoading={isAnyLoading}
                  currentPage={pagination?.page || 1}
                  totalPages={pagination?.totalPages || 1}
                  onPageChange={setCurrentPage}
                  canCreateOrgMemory={canCreateOrgMemory}
                  onTabChange={handleTabChange}
                  initialView={initialView}
                />
              </div>

              {/* Right Panel - View Content */}
              <div className="flex-1 flex flex-col min-w-0 bg-white/50">
                {/* Toolbar - only show when there are actions available */}
                {selectedContext && canEditSelectedContext && (
                  <div className="flex items-center justify-end px-4 py-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={handleEditClick}
                        className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50 rounded-xl transition-all duration-200 cursor-pointer"
                        title="Edit"
                      >
                        <PencilSimpleIcon size={16} weight="regular" />
                      </button>
                      {/* Hide delete button for user memory (can't delete) and non-admin on org memory */}
                      {selectedContext?.accessLevel !== "user" &&
                        canDeleteOrgMemory && (
                          <button
                            onClick={handleDeleteClick}
                            disabled={
                              deleteMutation.isPending ||
                              selectedContext?.isDefault
                            }
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              selectedContext?.isDefault
                                ? "Cannot delete default context"
                                : "Delete"
                            }
                          >
                            <TrashIcon size={16} weight="regular" />
                          </button>
                        )}
                    </div>
                  </div>
                )}

                {/* Content Area - View Mode */}
                <div className="flex-1 overflow-y-auto settings-scrollbar p-5">
                  {selectedContext ? (
                    <div className="flex flex-col gap-5 h-full">
                      {/* Description */}
                      <div className="bg-gray-50/60 rounded-xl p-4">
                        <label className="text-xs font-semibold text-gray-500 tracking-wider mb-2 block">
                          When should the agent use this?
                        </label>
                        <p className="text-sm text-gray-700">
                          {selectedContext.description || "—"}
                        </p>
                      </div>

                      {/* Memory Content */}
                      <div className="flex-1 flex flex-col min-h-0 bg-gray-50/60 rounded-xl p-4">
                        <label className="text-xs font-semibold text-gray-500 tracking-wider mb-2 block">
                          Memory Content
                        </label>
                        <div className="flex-1 overflow-auto settings-scrollbar">
                          <div className="prose prose-sm max-w-none text-sm [&>*]:text-sm [&>*]:leading-relaxed">
                            <Streamdown parseIncompleteMarkdown={false}>
                              {selectedContext.value || "No content yet"}
                            </Streamdown>
                          </div>
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
