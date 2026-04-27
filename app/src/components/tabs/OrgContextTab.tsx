import { useState, useEffect, useMemo, useRef } from "react";
import {
  PencilSimpleIcon,
  TrashIcon,
  BrainIcon,
  DownloadSimpleIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import {
  DeleteConfirmationPopup,
  SidePane,
  type FileAttachment,
} from "@vonlabs/design-components";
import { Streamdown } from "streamdown";
import {
  useMemoryContexts,
  useInfiniteMemoryContexts,
  useUpdateMemoryContext,
  useDeleteMemoryContext,
  useCreateMemoryContext,
} from "../../hooks/useMemoryContexts";
import { OrgContextDocumentList } from "../OrgContextDocumentList";
import { MemoryContextEditor } from "../MemoryContextEditor";
import { MemoryFileChip } from "../MemoryFileChip";
import { BulkImportPane } from "../BulkImportPane";
import type { MemoryContext } from "../../types/memoryContext";
import { useToast } from "../../hooks/useToast";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { usePermissions, Resource } from "../../hooks/usePermissions";
import { ApiError } from "../../services/apiClient";

export interface OrgContextTabProps {
  /**
   * Which memory surface to render. "org" shows the tenant-level memory list
   * and editor; "user" shows the single per-user memory card.
   */
  view: "org" | "user";
}

export function OrgContextTab({ view }: OrgContextTabProps) {
  const showOrg = view === "org";
  const showUser = view === "user";

  // Selection state for org memory
  const [selectedOrgContextId, setSelectedOrgContextId] = useState<
    string | null
  >(null);

  // Inline editor state — replaces the old side-pane drawer. The right content
  // panel flips into this mode when the user clicks edit or create.
  const [editMode, setEditMode] = useState<"none" | "create" | "edit">("none");
  const [editingContext, setEditingContext] = useState<MemoryContext | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isEditing = editMode !== "none";

  // Toast notifications
  const { showToast } = useToast();

  // Feature flags
  const { isUserMemoryEnabled } = useFeatureFlag();

  // Attachments persisted per memory context. Session-only for now (not
  // round-tripped through the backend), so files survive preview ↔ edit
  // navigation but are cleared on page reload. Keyed by the memory's id.
  const [attachmentsByContextId, setAttachmentsByContextId] = useState<
    Record<string, FileAttachment[]>
  >({});

  // Currently previewed attachment — null when the preview drawer is closed.
  const [previewingAttachment, setPreviewingAttachment] =
    useState<FileAttachment | null>(null);

  // Bulk import drawer state + the post-submit "reviewing" phase. User
  // memory only — org bulk import was descoped. While processing, the
  // center pane shows a subtle reviewing pill so the user can see Von
  // working before the memory updates.
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBulkImportProcessing, setIsBulkImportProcessing] = useState(false);
  const bulkImportTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (bulkImportTimerRef.current !== null) {
        window.clearTimeout(bulkImportTimerRef.current);
      }
    };
  }, []);
  // Object URL for the local File, lazily created on open so we don't leak
  // URLs for attachments the user never previews. Revoked on close.
  const previewObjectUrl = useMemo(() => {
    if (!previewingAttachment) return null;
    return URL.createObjectURL(previewingAttachment.file);
  }, [previewingAttachment]);
  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  // Get permissions for org memory (tenant-level)
  const { data: orgMemoryPermissions } = usePermissions(
    Resource.MEMORY_CONTEXT,
    { access_level: "tenant" },
  );

  // Fetch org memory contexts with infinite scroll — pages get accumulated
  // as the user scrolls past the sentinel in the sidebar list.
  const {
    data: orgInfiniteData,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteMemoryContexts("tenant", 20);

  // Fetch user memory (only when viewing user memory and feature flag is enabled)
  const {
    data: userMemoryData,
    isLoading: isUserMemoryLoading,
    refetch: refetchUserMemory,
  } = useMemoryContexts("user", 1, 1, {
    enabled: showUser && isUserMemoryEnabled,
  });
  const updateMutation = useUpdateMemoryContext();
  const deleteMutation = useDeleteMemoryContext();
  const createMutation = useCreateMemoryContext();

  // Flatten the per-page arrays into a single list. Memoized so consumers
  // don't see a new reference on every render.
  const contexts = useMemo(
    () => orgInfiniteData?.pages.flatMap((p) => p.data) ?? [],
    [orgInfiniteData],
  );

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

  // Auto-select first org memory context when data loads.
  useEffect(() => {
    if (!selectedOrgContextId && contexts.length > 0) {
      setSelectedOrgContextId(contexts[0].id);
    }
  }, [contexts, selectedOrgContextId]);

  // Get selected org context
  const selectedOrgContext = useMemo(() => {
    return contexts.find(
      (ctx: MemoryContext) => ctx.id === selectedOrgContextId,
    );
  }, [selectedOrgContextId, contexts]);

  // Permission flags derived from org memory permissions.
  // Dev-only override: in a non-prod build, setting
  // localStorage.__devAdminMemory = "1" forces the edit UI on. The backend
  // still enforces permissions, so saves will 403 unless the server also
  // grants access.
  const devAdminOverride =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    window.localStorage.getItem("__devAdminMemory") === "1";
  const canCreateOrgMemory =
    devAdminOverride || (orgMemoryPermissions?.create ?? false);
  const canUpdateOrgMemory =
    devAdminOverride || (orgMemoryPermissions?.update ?? false);
  const canDeleteOrgMemory =
    devAdminOverride || (orgMemoryPermissions?.delete ?? false);

  // Selecting a different context just swaps it. Save/cancel discard any
  // pending edits explicitly via Cancel.
  const handleSelectOrgContext = (id: string) => {
    setSelectedOrgContextId(id);
    setEditMode("none");
    setEditingContext(null);
  };

  // Handle create click - flips the right panel into create mode
  const handleCreateClick = () => {
    setEditingContext(null);
    setEditMode("create");
  };

  // Handle edit click for org memory
  const handleEditOrgClick = () => {
    if (selectedOrgContext) {
      setEditingContext(selectedOrgContext);
      setEditMode("edit");
    }
  };

  // Handle edit click for user memory
  const handleEditUserClick = () => {
    if (userMemory) {
      setEditingContext(userMemory);
      setEditMode("edit");
    }
  };

  // Bulk import submit — appends the pasted content to the user's existing
  // memory value and persists any uploaded attachments. UI-only: real
  // ingestion would replace the timer with a stream-driven update.
  const handleBulkImportSubmit = (
    input: string,
    files: FileAttachment[],
  ) => {
    if (!userMemory) return;
    setIsBulkImportProcessing(true);
    setEditMode("none");
    setEditingContext(null);

    if (bulkImportTimerRef.current !== null) {
      window.clearTimeout(bulkImportTimerRef.current);
    }
    bulkImportTimerRef.current = window.setTimeout(async () => {
      try {
        const existing = (userMemory.value ?? "").trim();
        const pasted = input.trim();
        const nextValue = [
          existing,
          existing && pasted ? "\n\n---\n\n" : "",
          pasted,
        ]
          .filter(Boolean)
          .join("");

        await updateMutation.mutateAsync({
          id: userMemory.id,
          data: {
            description: userMemory.description,
            value: nextValue,
          },
        });
        if (files.length > 0) {
          setAttachmentsByContextId((prev) => ({
            ...prev,
            [userMemory.id]: [...(prev[userMemory.id] ?? []), ...files],
          }));
        }
        showToast({
          message: "Memory imported successfully",
          variant: "success",
        });
      } catch (error) {
        console.error("Failed to import user memory:", error);
        let errorMessage = "Failed to import memory. Please try again.";
        if (error instanceof ApiError) errorMessage = error.message;
        showToast({ message: errorMessage, variant: "error" });
      } finally {
        setIsBulkImportProcessing(false);
        bulkImportTimerRef.current = null;
      }
    }, 2400);
  };

  // Exit the inline editor without saving
  const handleCancelEdit = () => {
    setEditMode("none");
    setEditingContext(null);
  };

  // Handle save from the inline editor
  const handleSave = async (data: {
    key: string;
    description: string;
    value: string;
    attachments: FileAttachment[];
  }) => {
    try {
      if (editMode === "create") {
        // Create new memory with all fields including value in ONE call
        const newMemory = await createMutation.mutateAsync({
          key: data.key,
          description: data.description,
          value: data.value,
          accessLevel: "tenant",
        });

        setSelectedOrgContextId(newMemory.id);
        if (data.attachments.length > 0) {
          setAttachmentsByContextId((prev) => ({
            ...prev,
            [newMemory.id]: data.attachments,
          }));
        }
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
        setAttachmentsByContextId((prev) => ({
          ...prev,
          [editingContext.id]: data.attachments,
        }));
        showToast({
          message: "Memory updated successfully",
          variant: "success",
        });
      }

      setEditMode("none");
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

    const contextAttachments = attachmentsByContextId[context.id] ?? [];

    return (
      <div className="flex flex-col gap-3 w-full min-w-0 overflow-hidden">
        {/* Memory title — shown at the top of the preview */}
        <h2 className="text-lg font-semibold text-gray-900 break-words">
          {context.key}
        </h2>

        {/* Description */}
        <div className="bg-gray-50/60 rounded-xl p-4 w-full min-w-0 overflow-hidden">
          <label className="text-xs text-gray-800 mb-1 block">
            When should the agent use this?
          </label>
          <p className="text-sm text-gray-900 break-words whitespace-pre-wrap">
            {context.description || "—"}
          </p>
        </div>

        {/* Attached files — rendered between description and content so they
            read as supporting material the agent can pull from. */}
        {contextAttachments.length > 0 && (
          <div className="w-full min-w-0 px-4 pt-1 flex flex-col gap-1.5">
            <label className="text-xs text-gray-800">Attachments</label>
            <div className="flex flex-wrap gap-1.5">
              {contextAttachments.map((attachment) => (
                <MemoryFileChip
                  key={attachment.id}
                  attachment={attachment}
                  onClick={() => setPreviewingAttachment(attachment)}
                  removable={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Memory Content */}
        <div className="w-full min-w-0 overflow-hidden px-4 pb-4 pt-2">
          <label className="text-xs text-gray-800 mb-1 block">
            Memory Content
          </label>
          <div className="prose prose-sm max-w-full w-full text-sm [&>*]:text-sm [&>*]:leading-relaxed [&>*]:break-words [&>*]:overflow-hidden [&_[data-streamdown]:first-child]:!mt-1 [&_pre]:overflow-x-auto [&_code]:break-all">
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
      <div className="px-4 pt-4 pb-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">
          {showUser ? "User Memory" : "Org Memory"}
        </h2>
        <p className="text-sm text-gray-600">
          {showUser
            ? "Manage your personal preferences and context"
            : "Define context shared across all users in your organization"}
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
          {showOrg && (
            <div className="w-[60%]">
              {/* Org Memory Card — list | editor in a single card */}
              <div className="w-full bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="flex w-full h-[calc(100vh-220px)]">
                  {/* Left Panel - Context List */}
                  <div className="w-60 h-full border-r border-gray-100/80 bg-gradient-to-b from-slate-50/50 to-gray-50/30 flex-shrink-0 flex flex-col">
                    <OrgContextDocumentList
                      contexts={contexts}
                      selectedContextId={selectedOrgContextId}
                      onSelectContext={handleSelectOrgContext}
                      onCreateClick={handleCreateClick}
                      isLoading={isOrgLoading}
                      hasNextPage={hasNextPage}
                      onLoadMore={fetchNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                      canCreateOrgMemory={canCreateOrgMemory}
                    />
                  </div>

                  {/* Right Panel - View Content */}
                  <div className="flex-1 w-0 flex flex-col min-w-0 bg-white/50 relative">
                    {/* Floating edit/delete actions — top-right, hidden while
                        the inline editor is active so they don't overlap the
                        form. */}
                    {!isEditing &&
                      selectedOrgContext &&
                      !(isOrgLoading && contexts.length === 0) &&
                      contexts.length > 0 &&
                      (canUpdateOrgMemory ||
                        (canDeleteOrgMemory &&
                          !selectedOrgContext.isDefault)) && (
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                          {canDeleteOrgMemory &&
                            !selectedOrgContext.isDefault && (
                              <button
                                onClick={handleDeleteClick}
                                disabled={deleteMutation.isPending}
                                className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-gray-200/80 shadow-xs hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete"
                              >
                                <TrashIcon
                                  size={14}
                                  weight="regular"
                                  className="text-red-600"
                                />
                              </button>
                            )}
                          {canUpdateOrgMemory && (
                            <button
                              onClick={handleEditOrgClick}
                              className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs text-sm text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <PencilSimpleIcon
                                size={14}
                                weight="regular"
                                className="text-gray-900"
                              />
                              Edit
                            </button>
                          )}
                        </div>
                      )}

                    {/* Inline editor takes over the right panel in edit/create mode */}
                    {isEditing ? (
                      <MemoryContextEditor
                        key={
                          editMode === "create"
                            ? `create-${editingContext?.id ?? "blank"}`
                            : (editingContext?.id ?? "edit")
                        }
                        mode={editMode as "create" | "edit"}
                        context={editingContext}
                        onSave={handleSave}
                        onCancel={handleCancelEdit}
                        initialAttachments={
                          editingContext
                            ? (attachmentsByContextId[editingContext.id] ?? [])
                            : []
                        }
                        onPreviewAttachment={setPreviewingAttachment}
                        isSaving={
                          createMutation.isPending || updateMutation.isPending
                        }
                      />
                    ) : (
                      /* Content Area */
                      <div className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden settings-scrollbar p-4">
                        {isOrgLoading && contexts.length === 0 ? (
                          <div
                            className="flex flex-col gap-4 w-full"
                            aria-label="Loading memory"
                          >
                            <div className="bg-gray-50/60 rounded-xl p-4 space-y-2">
                              <div className="h-3 w-44 bg-gray-100 rounded animate-pulse" />
                              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                            </div>
                            <div className="bg-gray-50/60 rounded-xl p-4 space-y-2">
                              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                              <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
                              <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                            </div>
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
                              Insights will appear here as your team asks
                              questions.
                            </p>
                          </div>
                        ) : (
                          renderContentView(selectedOrgContext)
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== USER MEMORY SECTION ===== */}
          {showUser && isUserMemoryEnabled && (
            <div className="w-[55%] max-w-[680px]">
              <div className="w-full bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="flex w-full h-[calc(100vh-300px)] min-h-[480px]">
                  {/* Content area */}
                  <div className="flex-1 w-0 flex flex-col min-w-0 bg-white/50 relative">
                    {/* Floating Import + Edit actions — top-right, mirrors
                        org memory's pattern. Hidden during edit mode and
                        bulk-import processing so they don't overlap the
                        form or the reviewing skeleton. */}
                    {!isEditing && !isBulkImportProcessing && userMemory && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                        <button
                          onClick={() => setIsBulkImportOpen(true)}
                          className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs text-sm text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                          title="Import memory"
                        >
                          <DownloadSimpleIcon size={14} weight="regular" />
                          Import memory
                        </button>
                        <button
                          onClick={handleEditUserClick}
                          className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs text-sm text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <PencilSimpleIcon
                            size={14}
                            weight="regular"
                            className="text-gray-900"
                          />
                          Edit
                        </button>
                      </div>
                    )}

                    {isBulkImportProcessing ? (
                      <div
                        className="flex flex-col h-full w-full overflow-hidden p-6"
                        aria-label="Von is reviewing the import"
                      >
                        <div className="space-y-3 opacity-60">
                          <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200/80 bg-white shadow-xs">
                            <SparkleIcon
                              size={14}
                              weight="fill"
                              className="text-gray-500 memory-sparkle-pulse"
                            />
                            <span className="text-sm text-gray-700">
                              Von is reviewing the import
                            </span>
                            <span
                              className="inline-flex items-center gap-1 ml-0.5"
                              aria-hidden
                            >
                              <span className="h-1 w-1 rounded-full bg-gray-400 memory-dot-bounce" />
                              <span
                                className="h-1 w-1 rounded-full bg-gray-400 memory-dot-bounce"
                                style={{ animationDelay: "150ms" }}
                              />
                              <span
                                className="h-1 w-1 rounded-full bg-gray-400 memory-dot-bounce"
                                style={{ animationDelay: "300ms" }}
                              />
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : isEditing && editingContext?.accessLevel === "user" ? (
                      <MemoryContextEditor
                        key={editingContext.id}
                        mode="edit"
                        context={editingContext}
                        onSave={handleSave}
                        onCancel={handleCancelEdit}
                        initialAttachments={
                          attachmentsByContextId[editingContext.id] ?? []
                        }
                        onPreviewAttachment={setPreviewingAttachment}
                        isSaving={
                          createMutation.isPending || updateMutation.isPending
                        }
                      />
                    ) : isUserMemoryLoading || isCreatingUserMemory ? (
                      <div
                        className="flex flex-col gap-4 w-full p-4"
                        aria-label="Loading user memory"
                      >
                        <div className="bg-gray-50/60 rounded-xl p-4 space-y-2">
                          <div className="h-3 w-44 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="bg-gray-50/60 rounded-xl p-4 space-y-2">
                          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                    ) : userMemory ? (
                      <div className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden settings-scrollbar p-4">
                        {renderContentView(userMemory)}
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal — mirrors the folder-delete experience */}
      <DeleteConfirmationPopup
        isOpen={isDeleteModalOpen}
        itemLabel={selectedOrgContext?.key ?? "this memory"}
        itemType="memory"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Bulk import drawer — user memory only. Submit appends the pasted
          content to the user's existing memory and persists attachments. */}
      {showUser && (
        <BulkImportPane
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          onSubmit={handleBulkImportSubmit}
        />
      )}

      {/* Shared attachment preview drawer. Renders an object URL of the
          selected file — <iframe> handles PDFs + most text formats, <img>
          handles images. */}
      <SidePane
        isOpen={previewingAttachment !== null}
        onClose={() => setPreviewingAttachment(null)}
        title={
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">
              {previewingAttachment?.name ?? "Preview"}
            </span>
            <span className="text-xs text-gray-600">
              {previewingAttachment?.extension ?? ""}
            </span>
          </div>
        }
        width="640px"
        minWidth={440}
        maxWidth="960px"
        storageKey="memory-attachment-preview-width"
        resizable
      >
        {previewingAttachment && previewObjectUrl && (
          <div className="h-full w-full min-h-0 flex items-center justify-center">
            {previewingAttachment.category === "image" ? (
              <img
                src={previewObjectUrl}
                alt={previewingAttachment.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <iframe
                src={previewObjectUrl}
                title={previewingAttachment.name}
                className="w-full h-full border border-gray-200 rounded-lg bg-white"
              />
            )}
          </div>
        )}
      </SidePane>
    </div>
  );
}

export default OrgContextTab;
