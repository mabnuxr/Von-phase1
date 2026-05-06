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
  FilePreview,
  FilesPreviewPanel,
  getFileInfo,
  type FileAttachment,
} from "@vonlabs/design-components";
import { Streamdown } from "streamdown";
import {
  useMemoryContexts,
  useInfiniteMemoryContexts,
  useUpdateMemoryContext,
  useDeleteMemoryContext,
  useCreateMemoryContext,
  memoryContextKeys,
} from "../../hooks/useMemoryContexts";
import { useQueryClient } from "@tanstack/react-query";
import { OrgContextDocumentListV2 } from "../OrgContextDocumentListV2";
import { MemoryContextEditor } from "../MemoryContextEditor";
import { BulkImportPane } from "../BulkImportPane";
import type { MemoryContext } from "../../types/memoryContext";
import { useToast } from "../../hooks/useToast";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { usePermissions, Resource } from "../../hooks/usePermissions";
import { ApiError } from "../../services/apiClient";
import { useCreateAndSendMessage } from "../../hooks/useCreateAndSendMessage";
import { folderKeys } from "../../hooks/folders";
import {
  memoryFilesService,
  generateMemoryId,
} from "../../services/memoryFilesService";

export interface OrgContextTabV2Props {
  /**
   * Which memory surface to render. "org" shows the tenant-level memory list
   * and editor; "user" shows the single per-user memory card.
   */
  view: "org" | "user";
}

/**
 * Convert a server-persisted MemoryAttachment into a FileAttachment for chip
 * rendering. The `file` field is a zero-byte placeholder Blob so the existing
 * chip components keep working; `uploadId` holds the FileMetadata id which
 * the preview drawer hands to the download endpoint to resolve the storage
 * path server-side. The s3 key is intentionally NOT held client-side.
 */
function summaryToAttachment(
  summary: NonNullable<MemoryContext["attachments"]>[number],
): FileAttachment {
  const info = getFileInfo(summary.mimeType);
  return {
    id: summary.fileId,
    file: new File([], summary.fileName, { type: summary.mimeType }),
    name: summary.fileName,
    size: summary.fileSize,
    type: summary.mimeType,
    extension: summary.extension || info?.extension || "",
    category:
      (summary.category as FileAttachment["category"]) ??
      info?.category ??
      "document",
    status: "uploaded",
    uploadId: summary.fileId,
  };
}

/**
 * Inverse — turn an editor-local FileAttachment into the wire shape the BE
 * expects on memory create/update. The BE accepts fileIds only and looks
 * up the rest of the metadata server-side.
 */
function attachmentToWire(a: FileAttachment): { fileId: string } | null {
  if (a.status !== "uploaded" || !a.uploadId) return null;
  return { fileId: a.uploadId };
}

export function OrgContextTabV2({ view }: OrgContextTabV2Props) {
  const showOrg = view === "org";
  const showUser = view === "user";
  const queryClient = useQueryClient();

  // Deep-link support: when the agent surfaces a memory_url like
  // `/settings?tab=memory-org&memory=<id>`, that id auto-selects the
  // matching memory in the sidebar list. Read once on mount.
  const deepLinkMemoryId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("memory");
  }, []);

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
  // Stable client-side ObjectId for the in-flight create flow. Generated when
  // the user opens the create editor so file uploads can be presigned against
  // the future memory id before the memory itself exists. Reset on cancel
  // and on successful save.
  const [draftMemoryId, setDraftMemoryId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isEditing = editMode !== "none";

  // Toast notifications
  const { showToast } = useToast();

  // Feature flags
  const { isUserMemoryEnabled, isAgentV2: isAgentV2Flag } = useFeatureFlag();

  // Bulk-import handoff: creates a new conversation seeded with the pasted
  // content + a brief directive. We DON'T navigate — the pane stays open
  // and shows an inline "Von is updating your memory" state. Once the user
  // memory value changes (polled below) we close the pane. The created
  // conversation is still accessible from the sidebar.
  //
  // `onCreated` mirrors the sidebar refetch the hook normally fires under
  // `navigateOnCreate=true` — without it the chat sidebar stays cached
  // and the new conversation only appears after a hard reload.
  const bulkImportFlow = useCreateAndSendMessage({
    agentVersion: isAgentV2Flag ? "v2" : "v1",
    isAgentV2: isAgentV2Flag,
    // Empty title — let the backend auto-derive from the first message,
    // matching how the regular New Conversation flow behaves.
    title: "",
    navigateOnCreate: false,
    onCreated: () => {
      queryClient.refetchQueries({
        queryKey: folderKeys.unfiled("conversation"),
      });
    },
  });

  // Currently previewed attachment — null when the preview drawer is closed.
  const [previewingAttachment, setPreviewingAttachment] =
    useState<FileAttachment | null>(null);

  // When the surface flips between org and user (Settings tab swap) the
  // preview drawer's content belongs to a memory that's no longer
  // visible — close it so the next mount starts clean.
  useEffect(() => {
    setPreviewingAttachment(null);
  }, [view]);

  // Bulk import drawer state — user memory only (org bulk import descoped).
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  // While importing we hold the pane open and show a loading state. The
  // ref captures the user-memory value at submit time so we can detect
  // the agent's first write to it via poll-and-compare.
  const [isImportProcessing, setIsImportProcessing] = useState(false);
  const importBaselineValueRef = useRef<string | null>(null);
  const importTimeoutRef = useRef<number | null>(null);
  // Preview URL: for persisted attachments (uploadId set + 0-byte placeholder
  // File) we fetch a presigned download URL from the BE. For brand-new in-flight
  // attachments (real local File), we lazily createObjectURL.
  const [persistedPreviewUrl, setPersistedPreviewUrl] = useState<string | null>(
    null,
  );
  const previewObjectUrl = useMemo(() => {
    if (!previewingAttachment) return null;
    if (previewingAttachment.uploadId && previewingAttachment.file.size === 0) {
      return persistedPreviewUrl;
    }
    return URL.createObjectURL(previewingAttachment.file);
  }, [previewingAttachment, persistedPreviewUrl]);
  useEffect(() => {
    // Revoke local blob URLs only — presigned BE URLs aren't object URLs.
    return () => {
      if (
        previewObjectUrl &&
        previewingAttachment &&
        previewingAttachment.file.size > 0
      ) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [previewObjectUrl, previewingAttachment]);

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
    if (showUser && isUserMemoryEnabled) {
      refetchUserMemory();
    }
  }, [showUser, isUserMemoryEnabled, refetchUserMemory]);

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
          console.log("[OrgContextTabV2] User memory created successfully");
          refetchUserMemory();
        })
        .catch((error) => {
          console.error(
            "[OrgContextTabV2] Failed to create user memory:",
            error,
          );
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

  // Auto-select org memory context when data loads. If a deep-link id is
  // present in the URL (?memory=<id>), keep paginating until either the
  // matching context shows up (and select it) or pagination exhausts;
  // fall back to the first memory in the list if not found.
  useEffect(() => {
    if (selectedOrgContextId || contexts.length === 0) return;
    if (deepLinkMemoryId) {
      const match = contexts.find((c) => c.id === deepLinkMemoryId);
      if (match) {
        setSelectedOrgContextId(match.id);
        return;
      }
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
        return;
      }
    }
    setSelectedOrgContextId(contexts[0].id);
  }, [
    contexts,
    selectedOrgContextId,
    deepLinkMemoryId,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // Get selected org context
  const selectedOrgContext = useMemo(() => {
    return contexts.find(
      (ctx: MemoryContext) => ctx.id === selectedOrgContextId,
    );
  }, [selectedOrgContextId, contexts]);

  // Fetch a presigned download URL whenever a persisted attachment opens.
  // Persisted chips have a 0-byte placeholder File and a `uploadId`
  // (FileMetadata id) — the BE resolves it to a presigned GET URL.
  // Freshly uploaded chips with a real File use a local blob URL instead.
  useEffect(() => {
    if (!previewingAttachment) {
      setPersistedPreviewUrl(null);
      return;
    }
    if (previewingAttachment.file.size > 0 || !previewingAttachment.uploadId) {
      setPersistedPreviewUrl(null);
      return;
    }
    let cancelled = false;
    memoryFilesService
      .getDownloadUrl(previewingAttachment.uploadId)
      .then((res) => {
        if (!cancelled) setPersistedPreviewUrl(res.downloadUrl);
      })
      .catch((err) => {
        console.error("Failed to fetch attachment download URL", err);
        if (!cancelled) setPersistedPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [previewingAttachment]);

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
  // pending edits explicitly via Cancel. Also closes the attachment
  // preview drawer — its content is bound to the previously-selected
  // memory and would otherwise stay open across the section switch.
  const handleSelectOrgContext = (id: string) => {
    setSelectedOrgContextId(id);
    setEditMode("none");
    setEditingContext(null);
    setPreviewingAttachment(null);
  };

  // Handle create click - flips the right panel into create mode. Generates
  // a fresh draft memory id so file uploads can presign against it before
  // the memory itself is created.
  const handleCreateClick = () => {
    setEditingContext(null);
    setDraftMemoryId(generateMemoryId());
    setEditMode("create");
  };

  // Handle edit click for org memory
  const handleEditOrgClick = () => {
    if (selectedOrgContext) {
      setEditingContext(selectedOrgContext);
      setDraftMemoryId(null);
      setEditMode("edit");
    }
  };

  // Handle edit click for user memory
  const handleEditUserClick = () => {
    if (userMemory) {
      setEditingContext(userMemory);
      setDraftMemoryId(null);
      setEditMode("edit");
    }
  };

  // Editor → presign + S3 PUT + confirm at file pick time. Returns just
  // the FileMetadata id; the editor stores it on the chip's uploadId so
  // attachmentToWire can serialize it on save.
  const uploadEditorFile = async (file: File): Promise<{ fileId: string }> => {
    try {
      // Edit mode: target the existing memory's id. Create mode: target
      // the client-generated draft id; the BE presign endpoint accepts
      // any 24-hex string, including ids of memories that don't exist
      // yet (FileMetadata.memory_id binds the file to the future memory).
      const target = editingContext?.id ?? draftMemoryId;
      if (!target) throw new Error("No memory id available for upload");
      const att = await memoryFilesService.uploadFile(target, file);
      return { fileId: att.fileId };
    } catch (err) {
      const detail = err instanceof Error ? err.message : "please try again.";
      showToast({
        message: `Failed to upload "${file.name}" — ${detail}`,
        variant: "error",
      });
      throw err;
    }
  };

  // Bulk import submit — kick off a new conversation seeded with the pasted
  // content and a short directive so the agent merges it into user memory.
  // The directive is phrased without naming any tools because this message
  // is visible in the conversation transcript. The pane stays open showing
  // a loading state; the poll effect below closes it once the user memory
  // value changes.
  const handleBulkImportSubmit = async (input: string) => {
    const pasted = input.trim();
    if (!pasted) return;
    setEditMode("none");
    setEditingContext(null);
    // Close the side pane immediately — the processing UI takes over the
    // user-memory main window so the user has the full surface to watch
    // the agent work.
    setIsBulkImportOpen(false);

    importBaselineValueRef.current = userMemory?.value ?? "";
    setIsImportProcessing(true);

    const primed = [
      "I'm importing memory from another AI assistant. Please merge the content below into my user memory — review for duplicates, structure preferences, instructions, and context cleanly, and preserve my words verbatim where useful.",
      "",
      "---",
      "",
      pasted,
    ].join("\n");

    try {
      await bulkImportFlow.handleSendMessage(primed);
    } catch (error) {
      console.error("Failed to start memory import:", error);
      let errorMessage = "Failed to start memory import. Please try again.";
      if (error instanceof ApiError) errorMessage = error.message;
      showToast({ message: errorMessage, variant: "error" });
      setIsImportProcessing(false);
      importBaselineValueRef.current = null;
    }
  };

  // While an import is in flight, refetch user memory every 2.5s and watch
  // for the value to change from the snapshot taken at submit. First
  // change → import landed: close the pane, success toast, refetch. After
  // 60s with no change → close anyway with an info toast (the conversation
  // is still in the sidebar, agent may still be working).
  useEffect(() => {
    if (!isImportProcessing) return;

    const POLL_MS = 5000;
    const TIMEOUT_MS = 60_000;

    const intervalId = window.setInterval(() => {
      refetchUserMemory();
    }, POLL_MS);

    importTimeoutRef.current = window.setTimeout(() => {
      setIsImportProcessing(false);
      setIsBulkImportOpen(false);
      importBaselineValueRef.current = null;
      showToast({
        message:
          "Import is still running — check the conversation in the sidebar for progress.",
        variant: "info",
      });
    }, TIMEOUT_MS);

    return () => {
      window.clearInterval(intervalId);
      if (importTimeoutRef.current !== null) {
        window.clearTimeout(importTimeoutRef.current);
        importTimeoutRef.current = null;
      }
    };
  }, [isImportProcessing, refetchUserMemory, showToast]);

  // Detect the first user-memory mutation after an import was kicked off.
  useEffect(() => {
    if (!isImportProcessing) return;
    const baseline = importBaselineValueRef.current;
    if (baseline === null) return;
    const current = userMemory?.value ?? "";
    if (current !== baseline) {
      setIsImportProcessing(false);
      setIsBulkImportOpen(false);
      importBaselineValueRef.current = null;
      if (importTimeoutRef.current !== null) {
        window.clearTimeout(importTimeoutRef.current);
        importTimeoutRef.current = null;
      }
      showToast({
        message: "Memory imported successfully",
        variant: "success",
      });
    }
  }, [isImportProcessing, userMemory?.value, showToast]);

  // Exit the inline editor without saving. Any draft files already uploaded
  // via the draft endpoint stay orphan until BE-side cleanup picks them up.
  const handleCancelEdit = () => {
    setEditMode("none");
    setEditingContext(null);
    setDraftMemoryId(null);
  };

  // Handle save from the inline editor. Attachments are already uploaded
  // (the editor presigns + S3 PUT at file pick time); save just persists
  // the text fields and the full attachments array (commands-style — the BE
  // takes whatever the FE sends as the new state).
  const handleSave = async (data: {
    key: string;
    description: string;
    value: string;
    attachments: FileAttachment[];
  }) => {
    try {
      const wireAttachments = data.attachments
        .map(attachmentToWire)
        .filter(
          (a): a is NonNullable<ReturnType<typeof attachmentToWire>> =>
            a !== null,
        );

      if (editMode === "create") {
        // Create flow is org-only (user memory is auto-created singleton).
        // Send the same draft id we presigned against so the s3 keys we
        // already uploaded against `{tenant}/memory/{draftId}/...` line up
        // with the new memory's id.
        const newMemory = await createMutation.mutateAsync({
          ...(draftMemoryId ? { id: draftMemoryId } : {}),
          key: data.key,
          description: data.description,
          value: data.value,
          accessLevel: "tenant",
          ...(wireAttachments.length ? { attachments: wireAttachments } : {}),
        });
        setSelectedOrgContextId(newMemory.id);
        showToast({
          message: "Memory created successfully",
          variant: "success",
        });
      } else if (editingContext) {
        // Update existing memory. The BE replaces the attachments array
        // wholesale on every update — send the full desired state.
        const updateData: {
          key?: string;
          description: string;
          value: string;
          attachments?: typeof wireAttachments;
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

        if (editingContext.accessLevel === "tenant") {
          updateData.attachments = wireAttachments;
        }

        await updateMutation.mutateAsync({
          id: editingContext.id,
          data: updateData,
        });

        // Refetch so the chip strip + sidebar reflect the new attachment
        // set immediately.
        if (editingContext.accessLevel === "tenant") {
          await queryClient.invalidateQueries({
            queryKey: memoryContextKeys.all,
          });
        }

        showToast({
          message: "Memory updated successfully",
          variant: "success",
        });
      }

      setEditMode("none");
      setEditingContext(null);
      setDraftMemoryId(null);
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
    if (selectedOrgContext && !selectedOrgContext.isDefault) {
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

    // Server-persisted attachments come from the BE response (hydrated
    // FileMetadata).
    const contextAttachments: FileAttachment[] = context.attachments
      ? context.attachments.map(summaryToAttachment)
      : [];

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

        {/* Attached files — always rendered (even with zero entries) so
            layout stays stable across memories. Uses the same card-style
            FilePreview as the chat-bar input. Org memory only — user
            memory is text-only and renders nothing here. */}
        {context.accessLevel === "tenant" && (
          <div className="w-full min-w-0 px-4 pt-1 flex flex-col gap-1.5">
            <label className="text-xs text-gray-800">Attachments</label>
            {contextAttachments.length > 0 ? (
              <div className="flex flex-row flex-wrap items-start gap-2">
                {contextAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    onClick={() => setPreviewingAttachment(attachment)}
                    className="cursor-pointer"
                  >
                    <FilePreview attachment={attachment} removable={false} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No files attached.</p>
            )}
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
      {/* Page Header — title on the left, surface-specific actions on the
          right (e.g. Import memory on the user surface). */}
      <div className="px-4 pt-4 pb-6 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {showUser ? "User Memory" : "Org Memory"}
          </h2>
          <p className="text-sm text-gray-600">
            {showUser
              ? "Manage your personal preferences and context"
              : "Define context shared across all users in your organization"}
          </p>
        </div>
        {showUser && isUserMemoryEnabled && (
          <button
            onClick={() => setIsBulkImportOpen(true)}
            disabled={bulkImportFlow.isCreating || !userMemory}
            className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs text-sm text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Import memory"
          >
            <DownloadSimpleIcon size={14} weight="regular" />
            Import memory
          </button>
        )}
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
                    <OrgContextDocumentListV2
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
                            ? `create-${draftMemoryId ?? "blank"}`
                            : (editingContext?.id ?? "edit")
                        }
                        mode={editMode as "create" | "edit"}
                        context={editingContext}
                        onSave={handleSave}
                        onCancel={handleCancelEdit}
                        initialAttachments={
                          editingContext?.attachments
                            ? editingContext.attachments.map(
                                summaryToAttachment,
                              )
                            : []
                        }
                        onPreviewAttachment={setPreviewingAttachment}
                        onUploadFile={uploadEditorFile}
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

          {/* ===== USER MEMORY SECTION =====
              Single-card view of the per-user memory. Auto-created on first
              load; user can edit but not delete. Import button lives in the
              page header above. */}
          {showUser && isUserMemoryEnabled && (
            <div className="w-[60%]">
              <div className="w-full bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="flex w-full h-[calc(100vh-220px)]">
                  <div className="flex-1 w-0 flex flex-col min-w-0 bg-white/50 relative">
                    {/* Floating Edit action — hidden during edit mode and
                        the bulk-import processing state. */}
                    {!isEditing && !isImportProcessing && userMemory && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
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

                    {isImportProcessing ? (
                      <div
                        className="flex flex-col h-full w-full overflow-hidden p-6"
                        aria-label="Von is updating your memory"
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
                              Von is updating your memory
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
                    ) : isEditing ? (
                      <MemoryContextEditor
                        key={editingContext?.id ?? "edit"}
                        mode="edit"
                        context={editingContext}
                        onSave={handleSave}
                        onCancel={handleCancelEdit}
                        initialAttachments={[]}
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

      {/* Bulk import drawer — user memory only. Pane stays open after
          submit and shows a loading state until the agent's first write
          to user memory lands. */}
      {showUser && (
        <BulkImportPane
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          onSubmit={handleBulkImportSubmit}
        />
      )}

      {/* Shared attachment preview drawer — generic panel from
          design-components. Handles PDF / DOCX / XLSX / CSV / text / md /
          images; same component the Commands drawer uses. */}
      <FilesPreviewPanel
        contextName={editingContext?.key || "Memory"}
        files={
          previewingAttachment && previewObjectUrl
            ? [
                {
                  file: previewingAttachment,
                  previewUrl: previewObjectUrl,
                },
              ]
            : []
        }
        isOpen={previewingAttachment !== null}
        onClose={() => setPreviewingAttachment(null)}
      />
    </div>
  );
}

export default OrgContextTabV2;
