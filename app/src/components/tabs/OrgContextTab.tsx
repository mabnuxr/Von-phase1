import { useState, useEffect, useMemo, useRef } from "react";
import { PencilSimpleIcon, BrainIcon } from "@phosphor-icons/react";
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
  // Selection state for org memory
  const [selectedOrgContextId, setSelectedOrgContextId] = useState<
    string | null
  >(null);

  // Pane state
  const [isPaneOpen, setIsPaneOpen] = useState(false);
  const [paneMode, setPaneMode] = useState<"create" | "edit">("create");
  const [editingContext, setEditingContext] = useState<MemoryContext | null>(
    null,
  );
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

  // Toggle state for user memory (enabled by default)
  const [isUserMemoryActive, setIsUserMemoryActive] = useState(true);

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
        .then(() => {
          console.log("[OrgContextTab] User memory created successfully");
          refetchUserMemory();
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
  ]);

  // Combined loading state for org memory
  const isOrgLoading = isLoading;

  // Auto-select first org memory context when data loads or page changes
  useEffect(() => {
    const pageChanged = prevPageRef.current !== currentPage;

    if (!selectedOrgContextId || pageChanged) {
      if (contexts.length > 0) {
        setSelectedOrgContextId(contexts[0].id);
      }
    }

    prevPageRef.current = currentPage;
  }, [contexts, selectedOrgContextId, currentPage]);

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

  // Get selected org context
  const selectedOrgContext = useMemo(() => {
    return contexts.find(
      (ctx: MemoryContext) => ctx.id === selectedOrgContextId,
    );
  }, [selectedOrgContextId, contexts]);

  // Permission flags derived from org memory permissions
  const canCreateOrgMemory = orgMemoryPermissions?.create ?? false;
  const canUpdateOrgMemory = orgMemoryPermissions?.update ?? false;
  const canDeleteOrgMemory = orgMemoryPermissions?.delete ?? false;

  // Handle org context selection
  const handleSelectOrgContext = (id: string) => {
    setSelectedOrgContextId(id);
  };

  // Handle create click - open create pane for org memory
  const handleCreateClick = () => {
    setPaneMode("create");
    setEditingContext(null);
    setIsPaneOpen(true);
  };

  // Handle edit click for org memory
  const handleEditOrgClick = () => {
    if (selectedOrgContext) {
      setPaneMode("edit");
      setEditingContext(selectedOrgContext);
      setIsPaneOpen(true);
    }
  };

  // Handle edit click for user memory
  const handleEditUserClick = () => {
    if (userMemory) {
      setPaneMode("edit");
      setEditingContext(userMemory);
      setIsPaneOpen(true);
    }
  };

  // Handle pane close
  const handlePaneClose = () => {
    setIsPaneOpen(false);
    setEditingContext(null);
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

        setSelectedOrgContextId(newMemory.id);
        showToast({
          message: "Memory created successfully",
          variant: "success",
        });
      } else if (editingContext) {
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
          !editingContext.isDefault &&
          editingContext.accessLevel !== "user"
        ) {
          updateData.key = data.key;
        }

        await updateMutation.mutateAsync({
          id: editingContext.id,
          data: updateData,
        });
        showToast({
          message: "Memory updated successfully",
          variant: "success",
        });
      }

      setIsPaneOpen(false);
      setEditingContext(null);
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
    if (selectedOrgContext) {
      setIsDeleteModalOpen(true);
    }
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!selectedOrgContextId) return;

    try {
      await deleteMutation.mutateAsync(selectedOrgContextId);
      setSelectedOrgContextId(null);
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

  // Render content view for a memory context
  const renderContentView = (context: MemoryContext | null | undefined) => {
    if (!context) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          Select a memory to view
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 w-full min-w-0 overflow-hidden">
        {/* Description */}
        <div className="bg-gray-50/60 rounded-xl p-4 w-full min-w-0 overflow-hidden">
          <label className="text-xs font-semibold text-gray-500 tracking-wider mb-2 block">
            When should the agent use this?
          </label>
          <p className="text-sm text-gray-700 break-words whitespace-pre-wrap">
            {context.description || "—"}
          </p>
        </div>

        {/* Memory Content */}
        <div className="bg-gray-50/60 rounded-xl p-4 w-full min-w-0 overflow-hidden">
          <label className="text-xs font-semibold text-gray-500 tracking-wider mb-2 block">
            Memory Content
          </label>
          <div className="prose prose-sm max-w-full w-full text-sm [&>*]:text-sm [&>*]:leading-relaxed [&>*]:break-words [&>*]:overflow-hidden [&_pre]:overflow-x-auto [&_code]:break-all">
            <Streamdown parseIncompleteMarkdown={false}>
              {context.value || "No content yet"}
            </Streamdown>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full p-2">
      {/* Page Header */}
      <div className="px-4 pt-4 pb-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Memory</h2>
        <p className="text-sm text-gray-600">
          Configure context that helps Von understand you and your organization
        </p>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto settings-scrollbar px-6">
        <div className="pt-6 pb-12 space-y-8 flex flex-col items-center">
          {/* Error state */}
          {error && (
            <div className="text-center py-8 px-6 bg-red-50/80 rounded-2xl backdrop-blur-sm">
              <p className="text-sm text-red-500">Failed to load memory</p>
            </div>
          )}

          {/* ===== ORG MEMORY SECTION ===== */}
          <div className="w-[650px]">
            {/* Section Header - Outside card */}
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Org Memory
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Define context shared across all users in your organization
              </p>
            </div>

            {/* Org Memory Card */}
            <div className="w-[650px] bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-indigo-100/50 border border-gray-200/40 overflow-hidden">
              <div className="flex h-[450px] w-full">
                {/* Left Panel - Context List */}
                <div className="w-56 h-full border-r border-gray-100/80 bg-gradient-to-b from-slate-50/50 to-gray-50/30 flex-shrink-0">
                  <OrgContextDocumentList
                    contexts={contexts}
                    selectedContextId={selectedOrgContextId}
                    onSelectContext={handleSelectOrgContext}
                    onCreateClick={handleCreateClick}
                    onEditClick={handleEditOrgClick}
                    onDeleteClick={handleDeleteClick}
                    isLoading={isOrgLoading}
                    currentPage={pagination?.page || 1}
                    totalPages={pagination?.totalPages || 1}
                    onPageChange={setCurrentPage}
                    canCreateOrgMemory={canCreateOrgMemory}
                    canUpdateOrgMemory={canUpdateOrgMemory}
                    canDeleteOrgMemory={canDeleteOrgMemory}
                    isDeleting={deleteMutation.isPending}
                  />
                </div>

                {/* Right Panel - View Content */}
                <div className="flex-1 w-0 flex flex-col min-w-0 bg-white/50">
                  {/* Content Area */}
                  <div className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden settings-scrollbar p-4">
                    {isOrgLoading && contexts.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        <span className="animate-pulse">Loading...</span>
                      </div>
                    ) : contexts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-3">
                          <BrainIcon
                            size={24}
                            weight="duotone"
                            className="text-indigo-400"
                          />
                        </div>
                        <h4 className="text-sm font-medium text-gray-600 mb-1">
                          No org memories yet
                        </h4>
                        <p className="text-xs text-gray-400 text-center">
                          Insights will appear here as your team asks questions.
                        </p>
                      </div>
                    ) : (
                      renderContentView(selectedOrgContext)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== USER MEMORY SECTION ===== */}
          {isUserMemoryEnabled && (
            <div className="w-[650px]">
              {/* Section Header - Outside card */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 leading-5">
                    User Memory
                  </h3>
                  {/* Toggle Switch */}
                  <button
                    onClick={() => setIsUserMemoryActive(!isUserMemoryActive)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                      isUserMemoryActive ? "bg-violet-500" : "bg-gray-300"
                    }`}
                    role="switch"
                    aria-checked={isUserMemoryActive}
                  >
                    <span
                      className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        isUserMemoryActive
                          ? "translate-x-3.5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Manage your personal preferences and context
                </p>
              </div>

              {/* User Memory Card - Fixed height with scroll */}
              <div
                className={`w-[650px] bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-indigo-100/50 border border-gray-200/40 overflow-hidden h-[200px] relative transition-opacity duration-200 ${
                  !isUserMemoryActive ? "opacity-50" : ""
                }`}
              >
                {!isUserMemoryActive ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-3">
                      <BrainIcon
                        size={24}
                        weight="duotone"
                        className="text-gray-400"
                      />
                    </div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      User Memory Disabled
                    </h4>
                    <p className="text-xs text-gray-400 text-center">
                      Enable the toggle to use your personal memory.
                    </p>
                  </div>
                ) : isUserMemoryLoading || isCreatingUserMemory ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    <span className="animate-pulse">Loading...</span>
                  </div>
                ) : userMemory ? (
                  <div className="h-full w-full min-w-0 overflow-y-auto overflow-x-hidden settings-scrollbar p-4">
                    {/* Edit button - top right */}
                    <button
                      onClick={handleEditUserClick}
                      className="absolute top-3 right-3 p-2 text-violet-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all duration-200 cursor-pointer z-10"
                      title="Edit"
                    >
                      <PencilSimpleIcon size={14} weight="bold" />
                    </button>
                    <div className="prose prose-sm max-w-full w-full text-sm [&>*]:text-sm [&>*]:leading-relaxed [&>*]:break-words [&>*]:overflow-hidden [&_pre]:overflow-x-auto [&_code]:break-all">
                      <Streamdown parseIncompleteMarkdown={false}>
                        {userMemory.value || "No content yet"}
                      </Streamdown>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-3">
                      <BrainIcon
                        size={24}
                        weight="duotone"
                        className="text-violet-400"
                      />
                    </div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1">
                      No user memory yet
                    </h4>
                    <p className="text-xs text-gray-400 text-center">
                      Your personal memory will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Memory Context Pane (Sidebar for editing/creating) */}
      <MemoryContextPane
        isOpen={isPaneOpen}
        onClose={handlePaneClose}
        mode={paneMode}
        context={editingContext}
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
