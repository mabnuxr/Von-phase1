import { useState, useEffect, useMemo, useRef } from "react";
import {
  PencilSimpleIcon,
  TrashIcon,
  BrainIcon,
  SparkleIcon,
  CheckIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";
import {
  DeleteConfirmationPopup,
  FilePreview,
  SidePane,
  type FileAttachment,
} from "@vonlabs/design-components";
import { Streamdown } from "streamdown";
import {
  useMemoryContexts,
  useUpdateMemoryContext,
  useDeleteMemoryContext,
  useCreateMemoryContext,
} from "../../hooks/useMemoryContexts";
import { OrgContextDocumentList } from "../OrgContextDocumentList";
import { MemoryContextEditor } from "../MemoryContextEditor";
import type { ProposalState } from "../MemoryContextEditor";
import { EditVonPane } from "../EditVonPane";
import { BulkImportPane } from "../BulkImportPane";
import { UnsavedChangesModal } from "../Analytics/UnsavedChangesModal";
import { useGlobalChat } from "../../providers/GlobalChat/useGlobalChat";
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

  // Edit-with-Von chat pane — visibility is controlled by GlobalChat, but
  // the pane itself (EditVonPane) owns its conversation state so it never
  // resumes a dashboard-scoped chat.
  const { isChatPanelOpen, openChatPanel, closeChatPanel } = useGlobalChat();

  // Context snippets captured from user selections in Memory Content. Cleared
  // each time the pane closes so a reopened pane starts clean.
  const [selectionSnippets, setSelectionSnippets] = useState<string[]>([]);
  // Whether the user dismissed the memory context chip for this session.
  // Reset on close and on memory switch so a fresh context shows up.
  const [memoryContextDismissed, setMemoryContextDismissed] = useState(false);
  const handleSelectionCapture = (text: string) => {
    // Only collect snippets while the chat pane is open — otherwise we're
    // just silently accumulating state the user can't see.
    if (!isChatPanelOpen) return;
    setSelectionSnippets((prev) =>
      prev.includes(text) ? prev : [...prev, text],
    );
  };
  const handleRemoveSnippet = (text: string) => {
    setSelectionSnippets((prev) => prev.filter((s) => s !== text));
  };
  const handleRemoveMemoryContext = () => {
    setMemoryContextDismissed(true);
  };
  const handleCloseChat = () => {
    setSelectionSnippets([]);
    setMemoryContextDismissed(false);
    setProposal({ kind: "idle" });
    closeChatPanel();
  };

  // Von proposal state — drives the editor's visual treatment and the
  // review card. Owned here so the pane + editor share a single source of
  // truth. Backend wiring will replace the simulate handler with real
  // stream-driven transitions.
  const [proposal, setProposal] = useState<ProposalState>({ kind: "idle" });
  const proposalTimerRef = useRef<number | null>(null);

  // Bulk import drawer state + the post-submit "Von is reviewing..." phase.
  // While processing, the right panel (memory content + chat) flips to a
  // skeleton so the user can see Von working. Once complete, the proposal
  // shows up as a "Proposed New" group in the sidebar.
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBulkImportProcessing, setIsBulkImportProcessing] = useState(false);
  const bulkImportTimerRef = useRef<number | null>(null);

  // Von-proposed new sections waiting for review. Keyed by synthetic ids so
  // they can live in the sidebar alongside real memories without colliding.
  interface ProposedNewSection {
    id: string;
    key: string;
    description: string;
    value: string;
  }
  const [proposedNewSections, setProposedNewSections] = useState<
    ProposedNewSection[]
  >([]);
  const [selectedProposedNewId, setSelectedProposedNewId] = useState<
    string | null
  >(null);

  // Flag set when the user enters edit mode from a bulk-imported proposal.
  // Drives auto-open of the Edit-with-Von chat pane on entry and auto-close
  // on save/cancel, so the pane only exists for this one focused edit.
  const [autoCloseChatOnExit, setAutoCloseChatOnExit] = useState(false);

  // Attachments persisted per memory context. Session-only for now (not
  // round-tripped through the backend), so files survive preview ↔ edit
  // navigation but are cleared on page reload. Keyed by the memory's id.
  const [attachmentsByContextId, setAttachmentsByContextId] = useState<
    Record<string, FileAttachment[]>
  >({});

  // Currently previewed attachment — null when the preview drawer is closed.
  // Owned here so the same preview surface serves both the edit view and
  // the read-only content view.
  const [previewingAttachment, setPreviewingAttachment] =
    useState<FileAttachment | null>(null);
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

  // Clear any pending simulated transition if the component unmounts.
  useEffect(() => {
    return () => {
      if (proposalTimerRef.current !== null) {
        window.clearTimeout(proposalTimerRef.current);
      }
      if (bulkImportTimerRef.current !== null) {
        window.clearTimeout(bulkImportTimerRef.current);
      }
    };
  }, []);

  // UI-only demo seeds for the proposed-new flow. After Von "reviews" the
  // bulk import, these are what pop into the sidebar. Replace with real
  // server-driven proposals once the ingestion endpoint lands.
  const MOCK_PROPOSED_NEW: ProposedNewSection[] = useMemo(
    () => [
      {
        id: "proposed-new-1",
        key: "Dashboard V2 Widget Plans",
        description:
          "When user asks about V2 dashboard widgets, roadmap, or upcoming features",
        value:
          "**Dashboard V2 widget plans (Q2–Q3 2026):**\n\n" +
          "- **Funnel widget** — multi-stage deal pipeline with drop-off %\n" +
          "- **Cohort retention** — monthly cohorts, heatmap view, export to CSV\n" +
          "- **Leaderboard** — top reps by closed ARR, filterable by team\n" +
          "- **Velocity chart** — time-to-close trend, segmented by deal size\n\n" +
          "Owner: Dashboard team. Target: Q3 2026.",
      },
      {
        id: "proposed-new-2",
        key: "Dashboard V2 Widget Library",
        description:
          "When user asks which widgets are available in the new dashboard builder",
        value:
          "**Available widgets (Dashboard V2):**\n\n" +
          "- KPI card, trend chart, bar, column, spline, donut, waterfall\n" +
          "- Combination (column + spline) for MoM vs trailing\n" +
          "- Table widget with inline filters + drill-down\n\n" +
          "All widgets support scheduled refresh and share-to-org visibility.",
      },
      {
        id: "proposed-new-3",
        key: "Dashboard V2 Widget Policies",
        description:
          "When user asks about widget permissions, visibility, or sharing",
        value:
          "**Widget policies:**\n\n" +
          "- Private by default; org-visible requires explicit share\n" +
          "- Only the creator can delete a widget\n" +
          "- Scheduled refreshes run under the creator's credentials\n" +
          "- Data access respects the creator's row-level permissions",
      },
      {
        id: "proposed-new-4",
        key: "Dashboard V2 Widget Specs",
        description:
          "When user asks about data size limits, refresh cadence, or widget performance",
        value:
          "**Widget specs:**\n\n" +
          "- Max 10,000 rows per widget query (paginated)\n" +
          "- Default refresh cadence: hourly. Configurable per widget.\n" +
          "- P95 render target: <500ms for KPI cards, <1.5s for charts\n" +
          "- Cached results live for 15 minutes server-side",
      },
    ],
    [],
  );

  // Bulk import submit handler — branches on which surface is active. Org
  // flow mocks a "Von reviews + proposes new sections" UX; user flow simply
  // appends the import to the single personal memory and persists any
  // attachments. Both are UI-only for now; backend wires later.
  const handleBulkImportSubmit = async (
    input: string,
    files: FileAttachment[],
  ) => {
    setIsBulkImportOpen(false);

    // ---------- User memory branch ----------
    if (showUser) {
      if (!userMemory) return;
      // Flip into the same "Von is reviewing..." skeleton we use for org so
      // bulk import feels consistent across surfaces. Persist runs after the
      // fake delay resolves; backend wiring replaces the timer later.
      setIsBulkImportProcessing(true);
      setEditMode("none");
      setEditingContext(null);
      if (isChatPanelOpen) {
        closeChatPanel();
        setSelectionSnippets([]);
        setMemoryContextDismissed(false);
      }

      if (bulkImportTimerRef.current !== null) {
        window.clearTimeout(bulkImportTimerRef.current);
      }
      bulkImportTimerRef.current = window.setTimeout(async () => {
        try {
          const existing = (userMemory.value ?? "").trim();
          const nextValue = [
            existing,
            existing ? "\n\n---\n\n" : "",
            input.trim(),
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
      }, 2600);
      return;
    }

    // ---------- Org memory branch (default) ----------
    setIsBulkImportProcessing(true);
    // Close the chat pane while Von "reviews" — the status banner lives in
    // the center pane, and the reviewing state shouldn't double-render.
    if (isChatPanelOpen) {
      closeChatPanel();
      setSelectionSnippets([]);
      setMemoryContextDismissed(false);
    }
    // Drop any open editor / selection so the skeleton fills the right pane
    // cleanly without lingering form controls.
    setEditMode("none");
    setEditingContext(null);
    setSelectedProposedNewId(null);

    if (bulkImportTimerRef.current !== null) {
      window.clearTimeout(bulkImportTimerRef.current);
    }
    bulkImportTimerRef.current = window.setTimeout(() => {
      setProposedNewSections(MOCK_PROPOSED_NEW);
      setIsBulkImportProcessing(false);
      bulkImportTimerRef.current = null;
    }, 3200);
  };

  // Canned prompt users can copy into Claude/ChatGPT/Gemini to get an
  // exportable memory dump they can paste back into the drawer's step 2.
  const USER_MEMORY_EXPORT_PROMPT =
    "Export all of my stored memories and any context you've learned about me from past conversations. " +
    "Preserve my words verbatim where possible, especially for instructions and preferences.\n\n" +
    "## Categories (output in this order):\n" +
    "- Preferences\n" +
    "- Instructions\n" +
    "- Context about me\n" +
    "- Projects and goals";

  // Clicking a proposed-new pill flips the right pane into its preview view.
  // Must clear the real-memory selection + any edit session so the preview
  // isn't competing with an existing form.
  const handleSelectProposedNew = (id: string) => {
    setSelectedProposedNewId(id);
    setEditMode("none");
    setEditingContext(null);
  };

  // Insert — promote the proposed-new draft into a real org memory, then
  // drop it from the pending list and select the new memory.
  const handleInsertProposedNew = async (section: ProposedNewSection) => {
    try {
      const newMemory = await createMutation.mutateAsync({
        key: section.key,
        description: section.description,
        value: section.value,
        accessLevel: "tenant",
      });
      setProposedNewSections((prev) =>
        prev.filter((p) => p.id !== section.id),
      );
      setSelectedProposedNewId(null);
      setSelectedOrgContextId(newMemory.id);
      showToast({
        message: "Section added to Org Memory",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to insert proposed section:", error);
      let errorMessage = "Failed to add section. Please try again.";
      if (error instanceof ApiError) errorMessage = error.message;
      showToast({ message: errorMessage, variant: "error" });
    }
  };

  const handleDismissProposedNew = (id: string) => {
    setProposedNewSections((prev) => prev.filter((p) => p.id !== id));
    setSelectedProposedNewId((current) => (current === id ? null : current));
  };

  // Edit — flip the preview into the real MemoryContextEditor in "create"
  // mode so the user can refine fields before inserting. The proposed
  // section is removed from the pending list since the user is now driving
  // creation by hand. We stash the draft fields on a synthetic MemoryContext
  // so the editor hydrates correctly via its `context` prop, even though
  // mode="create" means no id is persisted until the user saves.
  const handleEditProposedNew = (section: ProposedNewSection) => {
    const draft: MemoryContext = {
      id: section.id,
      key: section.key,
      description: section.description,
      value: section.value,
      accessLevel: "tenant",
      isDefault: false,
      createdAt: "",
      createdBy: "",
      updatedAt: null,
    };
    setEditingContext(draft);
    setEditMode("create");
    setSelectedProposedNewId(null);
    setProposedNewSections((prev) =>
      prev.filter((p) => p.id !== section.id),
    );
    // Auto-open the chat pane for this edit so the user can iterate on the
    // Von-drafted section right there. Flagged for auto-close on save/cancel.
    if (!isChatPanelOpen) {
      openChatPanel();
      setAutoCloseChatOnExit(true);
    }
  };

  const handleSimulateProposal = () => {
    if (proposalTimerRef.current !== null) {
      window.clearTimeout(proposalTimerRef.current);
    }
    // Proposals are tied to a specific memory; capture which memory the
    // simulation is targeting so the sidebar badge follows it.
    const targetContextId = editingContext?.id ?? selectedOrgContext?.id;
    if (!targetContextId) return;

    setProposal({
      kind: "loading",
      contextId: targetContextId,
      fields: new Set(["content"]),
    });

    const base =
      (editingContext?.value ?? selectedOrgContext?.value ?? "").trim();
    const proposed =
      (base ? base + "\n\n" : "") +
      "**Von's suggestions**\n\n" +
      "- Restate the outcome before the action items so reviewers skim fast.\n" +
      "- Add an owner and a due date next to each bullet.\n" +
      "- Link back to the source document when citing numbers.\n";

    proposalTimerRef.current = window.setTimeout(() => {
      setProposal({
        kind: "proposed",
        contextId: targetContextId,
        changes: { value: proposed },
      });
      proposalTimerRef.current = null;
    }, 2200);
  };

  const handleProposalApplied = () => setProposal({ kind: "idle" });
  const handleProposalDismissed = () => setProposal({ kind: "idle" });

  // Track a one-shot "accept all" run so the header button can show a
  // pending state without blocking the user from continuing to edit.
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);

  // Get permissions for org memory (tenant-level)
  const { data: orgMemoryPermissions } = usePermissions(
    Resource.MEMORY_CONTEXT,
    { access_level: "tenant" },
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const prevPageRef = useRef(currentPage);

  // Fetch org memory contexts with pagination (only when viewing org)
  const { data, isLoading, error } = useMemoryContexts(
    "tenant",
    currentPage,
    20,
    { enabled: showOrg },
  );

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

  // Extract contexts and pagination info (memoized to prevent useEffect loop)
  const contexts = useMemo(() => data?.data || [], [data?.data]);
  const pagination = data?.pagination;

  // Mock proposal ids the user has already accepted/dismissed in this
  // session — lets us filter out demo seeds after they've been handled so
  // the sidebar badge and review card clear without a real backend.
  const [dismissedMockContextIds, setDismissedMockContextIds] = useState<
    Set<string>
  >(new Set());

  // UI-only demo seeds — prebuilt "proposed" states for the 2nd and 3rd
  // memories so reviewers can click the "Update N" badge and actually see the
  // review card + Insert/Dismiss flow without first triggering a chat turn.
  // Remove once the backend drives real proposals end-to-end.
  const mockProposalsByContextId = useMemo<Record<string, ProposalState>>(() => {
    const map: Record<string, ProposalState> = {};
    const second = contexts[1];
    const third = contexts[2];
    if (second && !dismissedMockContextIds.has(second.id)) {
      const base = (second.value ?? "").trim();
      map[second.id] = {
        kind: "proposed",
        contextId: second.id,
        changes: {
          value:
            (base ? base + "\n\n" : "") +
            "**Von's suggestion**\n\n" +
            "- Add a fallback when the overage tracking sheet is unavailable so the workflow doesn't silently stall.\n",
        },
      };
    }
    if (third && !dismissedMockContextIds.has(third.id)) {
      const base = (third.value ?? "").trim();
      map[third.id] = {
        kind: "proposed",
        contextId: third.id,
        changes: {
          key: third.key + " (Refreshed)",
          value:
            (base ? base + "\n\n" : "") +
            "**Von's suggestions**\n\n" +
            "- Call out Von's context graph explicitly in the differentiators list.\n" +
            "- Include a one-line recap at the top so reviewers skim fast.\n",
        },
      };
    }
    return map;
  }, [contexts, dismissedMockContextIds]);

  // Map of context id → number of pending Von updates, driving the sidebar
  // "Update N" badges. Combines the live proposal with the demo seeds above.
  const updateCountByContextId = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const [id, mock] of Object.entries(mockProposalsByContextId)) {
      if (mock.kind === "proposed") {
        map[id] = Object.values(mock.changes).filter(
          (v) => v !== undefined,
        ).length;
      }
    }
    if (proposal.kind === "proposed") {
      map[proposal.contextId] = Object.values(proposal.changes).filter(
        (v) => v !== undefined,
      ).length;
    } else if (proposal.kind === "loading") {
      map[proposal.contextId] = proposal.fields.size;
    }
    return map;
  }, [mockProposalsByContextId, proposal]);

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

  // Deferred switch target — set when the user clicks a different memory
  // while an edit session is active. Once confirmed, the switch proceeds.
  const [pendingSwitchContextId, setPendingSwitchContextId] = useState<
    string | null
  >(null);

  // Run the actual switch: pick a new memory, exit edit mode, reset context
  // chip dismissal so the new memory's chip shows up in chat.
  const performSwitchToContext = (id: string) => {
    setSelectedOrgContextId(id);
    setEditMode("none");
    setEditingContext(null);
    setMemoryContextDismissed(false);
  };

  // Selecting a different context while in edit mode prompts first, to avoid
  // silently throwing away unsaved changes against the wrong record. If the
  // target memory has a mock/demo proposal waiting, auto-enter edit mode with
  // that proposal hydrated so the reviewer lands directly on the Insert UI.
  const handleSelectOrgContext = (id: string) => {
    if (isEditing) {
      setPendingSwitchContextId(id);
      return;
    }
    const mock = mockProposalsByContextId[id];
    const target = contexts.find((c) => c.id === id);
    if (mock && target) {
      setSelectedOrgContextId(id);
      setEditingContext(target);
      setEditMode("edit");
      setProposal(mock);
      setMemoryContextDismissed(false);
      return;
    }
    performSwitchToContext(id);
  };

  // User confirmed the switch — perform it, and also close the chat pane
  // since the context it was built around is going away.
  const handleConfirmSwitch = () => {
    if (!pendingSwitchContextId) return;
    performSwitchToContext(pendingSwitchContextId);
    setPendingSwitchContextId(null);
    if (isChatPanelOpen) {
      setSelectionSnippets([]);
      setMemoryContextDismissed(false);
      closeChatPanel();
    }
  };

  const handleCancelSwitch = () => {
    setPendingSwitchContextId(null);
  };

  // Open the Ask Von chat pane for the current edit session and flag it for
  // auto-teardown on save/cancel. Idempotent — if the user already has the
  // pane open we don't re-set the flag so their manual pane survives a save.
  const autoOpenChatForEdit = () => {
    if (!isChatPanelOpen) {
      openChatPanel();
      setAutoCloseChatOnExit(true);
    }
  };

  // Accept ALL pending Von changes in one click — applies every mock
  // proposal update, live proposal (if any), AND creates every proposed-new
  // section as a real memory. Mutations run in parallel per bucket but we
  // await the whole thing so we can clear local state + toast at the end.
  const handleAcceptAllChanges = async () => {
    if (isAcceptingAll) return;
    setIsAcceptingAll(true);
    try {
      // 1. Apply all mock proposed updates.
      const mockEntries = Object.entries(mockProposalsByContextId).filter(
        ([, p]) => p.kind === "proposed",
      );
      await Promise.all(
        mockEntries.map(([id, p]) => {
          if (p.kind !== "proposed") return Promise.resolve();
          const target = contexts.find((c) => c.id === id);
          if (!target) return Promise.resolve();
          const updateData: {
            key?: string;
            description: string;
            value: string;
          } = {
            description:
              p.changes.description ?? target.description ?? "",
            value: p.changes.value ?? target.value ?? "",
          };
          if (
            !target.isDefault &&
            target.accessLevel !== "user" &&
            p.changes.key !== undefined
          ) {
            updateData.key = p.changes.key;
          }
          return updateMutation.mutateAsync({ id, data: updateData });
        }),
      );

      // 2. Apply the live proposal too if one is sitting in "proposed".
      if (proposal.kind === "proposed") {
        const target = contexts.find((c) => c.id === proposal.contextId);
        if (target) {
          const updateData: {
            key?: string;
            description: string;
            value: string;
          } = {
            description:
              proposal.changes.description ?? target.description ?? "",
            value: proposal.changes.value ?? target.value ?? "",
          };
          if (
            !target.isDefault &&
            target.accessLevel !== "user" &&
            proposal.changes.key !== undefined
          ) {
            updateData.key = proposal.changes.key;
          }
          await updateMutation.mutateAsync({
            id: proposal.contextId,
            data: updateData,
          });
        }
      }

      // 3. Promote every proposed-new section into a real memory.
      await Promise.all(
        proposedNewSections.map((section) =>
          createMutation.mutateAsync({
            key: section.key,
            description: section.description,
            value: section.value,
            accessLevel: "tenant",
          }),
        ),
      );

      // Clear local state once everything landed.
      const acceptedIds = new Set(mockEntries.map(([id]) => id));
      setDismissedMockContextIds((prev) => {
        const next = new Set(prev);
        acceptedIds.forEach((id) => next.add(id));
        return next;
      });
      setProposedNewSections([]);
      setProposal({ kind: "idle" });
      setSelectedProposedNewId(null);

      const total =
        mockEntries.length +
        (proposal.kind === "proposed" ? 1 : 0) +
        proposedNewSections.length;
      showToast({
        message: `Applied ${total} change${total === 1 ? "" : "s"}`,
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to accept all changes:", error);
      let errorMessage = "Failed to apply some changes. Please try again.";
      if (error instanceof ApiError) errorMessage = error.message;
      showToast({ message: errorMessage, variant: "error" });
    } finally {
      setIsAcceptingAll(false);
    }
  };

  // Handle create click - flips the right panel into create mode
  const handleCreateClick = () => {
    setEditingContext(null);
    setEditMode("create");
    autoOpenChatForEdit();
  };

  // Handle edit click for org memory
  const handleEditOrgClick = () => {
    if (selectedOrgContext) {
      setEditingContext(selectedOrgContext);
      setEditMode("edit");
      autoOpenChatForEdit();
    }
  };

  // Handle edit click for user memory
  const handleEditUserClick = () => {
    if (userMemory) {
      setEditingContext(userMemory);
      setEditMode("edit");
      autoOpenChatForEdit();
    }
  };

  // Close the Edit-with-Von pane if this edit session opened it automatically
  // (bulk-import proposed-new → Edit flow). Mirrors handleCloseChat's cleanup
  // so leaving the edit doesn't leak selection chips or context flags.
  const maybeCloseAutoOpenedChat = () => {
    if (!autoCloseChatOnExit) return;
    closeChatPanel();
    setSelectionSnippets([]);
    setMemoryContextDismissed(false);
    setAutoCloseChatOnExit(false);
  };

  // Exit the inline editor without saving
  const handleCancelEdit = () => {
    setEditMode("none");
    setEditingContext(null);
    maybeCloseAutoOpenedChat();
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
        // Persist attachments under the new id so they remain visible
        // across edit ↔ preview navigation.
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
        // Update the in-memory attachments map for this context — we
        // replace the entry outright (not merge) so remove-in-editor
        // persists correctly.
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
      maybeCloseAutoOpenedChat();
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

  // Render the Von-proposed-new preview. Same shape as the regular content
  // view but every block gets the emerald treatment that already signals
  // "proposal — not yet saved" elsewhere in this surface, plus an Insert /
  // Dismiss / Edit action row pinned at the top.
  const renderProposedNewPreview = (section: ProposedNewSection) => {
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Sticky review banner — mirrors the existing "Von proposed changes"
            card but branded for a brand-new section rather than an update. */}
        <div className="flex-shrink-0 mx-4 mt-4 flex items-start gap-3 px-3 py-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-800">
              <SparkleIcon
                size={14}
                weight="fill"
                className="text-emerald-600"
              />
              Von proposed a new section
            </div>
            <p className="text-xs text-emerald-900/70 mt-0.5">
              Review and insert to add it to your Org Memory
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => handleDismissProposedNew(section.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-800 bg-white border border-gray-200/80 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={() => handleInsertProposedNew(section)}
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-white bg-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon size={12} weight="bold" />
              Insert
            </button>
          </div>
        </div>

        {/* Preview body — mirrors the regular memory preview (gray, not
            emerald) so only the top banner flags this as a proposal. Keeps
            the eye on the content, not on the provenance chrome. */}
        <div className="flex-1 min-h-0 overflow-y-auto settings-scrollbar px-4 pt-4 pb-4 flex flex-col gap-3">
          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900 break-words">
            {section.key}
          </h2>

          {/* Description */}
          <div className="bg-gray-50/60 rounded-xl p-4">
            <label className="block text-xs text-gray-800 mb-1">
              When should the agent use this?
            </label>
            <p className="text-sm text-gray-900 break-words whitespace-pre-wrap">
              {section.description}
            </p>
          </div>

          {/* Memory Content — no card wrapper, tight spacing below description */}
          <div className="px-4 pb-2 pt-2">
            <label className="block text-xs text-gray-800 mb-1">
              Memory Content
            </label>
            <div className="prose prose-sm max-w-full w-full text-sm [&>*]:text-sm [&>*]:leading-relaxed [&>*]:break-words [&_[data-streamdown]:first-child]:!mt-1 [&_pre]:overflow-x-auto [&_code]:break-all">
              <Streamdown parseIncompleteMarkdown={false}>
                {section.value}
              </Streamdown>
            </div>
          </div>
        </div>

        {/* Sticky footer — Edit promotes the preview into the regular form so
            the user can tweak the draft before inserting. */}
        <div className="flex-shrink-0 px-3 py-2.5 border-t border-gray-100 bg-white flex items-center justify-end gap-2">
          <button
            onClick={() => handleEditProposedNew(section)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-900 border border-gray-200/80 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <PencilSimpleIcon size={14} weight="regular" />
            Edit
          </button>
        </div>
      </div>
    );
  };

  // Skeleton placeholder used while Von "reviews" a bulk import. Subtle,
  // gray, centered — the sidebar shows its own skeleton in parallel so the
  // whole card reads as a unified loading surface. Classy over loud: just
  // a pill with a sparkle glyph and three pulsing dots.
  const renderBulkImportSkeleton = () => (
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
  );

  // Find the selected proposed-new section, if any.
  const selectedProposedNew = useMemo(
    () => proposedNewSections.find((p) => p.id === selectedProposedNewId),
    [proposedNewSections, selectedProposedNewId],
  );

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

        {/* Attached files — rendered read-only between description and
            content so they read as supporting material the agent can pull
            from, not a footer afterthought. Clicking any chip opens the
            shared preview drawer; remove is disabled (use Edit to mutate). */}
        {contextAttachments.length > 0 && (
          <div className="w-full min-w-0 px-4 pt-1 flex flex-col gap-1.5">
            <label className="text-xs text-gray-800">Attachments</label>
            <div className="flex flex-wrap gap-1.5">
              {contextAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  onClick={() => setPreviewingAttachment(attachment)}
                >
                  <FilePreview
                    attachment={attachment}
                    removable={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memory Content — no card wrapper, tight spacing below description */}
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

  // Total number of Von-proposed updates pending across ALL memories — used
  // for the pill in the header row. Sum of per-memory badge counts (which
  // includes both live proposals and demo seeds) plus the proposed-new list.
  const totalPendingUpdates = useMemo(() => {
    const updateSum = Object.values(updateCountByContextId).reduce(
      (sum, n) => sum + n,
      0,
    );
    return updateSum + proposedNewSections.length;
  }, [updateCountByContextId, proposedNewSections.length]);

  return (
    <div className="flex flex-col h-full p-2">
      {/* Page Header — on the org surface we pin the bulk import CTA + a
          "N updates pending" pill to the right so the user can see + act on
          incoming proposals from anywhere in the tab. */}
      <div className="px-4 pt-4 pb-6 border-b border-gray-100 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {showUser ? "User Memory" : "Org Memory"}
          </h2>
          <p className="text-sm text-gray-600">
            {showUser
              ? "Manage your personal preferences and context"
              : "Define context shared across all users in your organization"}
          </p>
        </div>
        {showOrg && canCreateOrgMemory && (
          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
            {totalPendingUpdates > 0 && (
              <>
                <span
                  className="inline-flex items-center h-7 px-2.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium"
                  title={`${totalPendingUpdates} pending Von update${
                    totalPendingUpdates === 1 ? "" : "s"
                  }`}
                >
                  {totalPendingUpdates} update
                  {totalPendingUpdates === 1 ? "" : "s"} pending
                </span>
                <button
                  type="button"
                  onClick={handleAcceptAllChanges}
                  disabled={isAcceptingAll}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-emerald-200/80 bg-emerald-600 text-sm text-white hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon size={14} weight="bold" />
                  {isAcceptingAll ? "Applying..." : "Accept all"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsBulkImportOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-gray-200/80 bg-white text-sm text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <DownloadSimpleIcon size={14} weight="regular" />
              Bulk Import
            </button>
          </div>
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
          <div className={isChatPanelOpen ? "w-[85%]" : "w-[75%]"}>
            {/* Org Memory Card — list | editor | chat all live inside one card */}
            <div className="w-full bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
              <div
                className="flex w-full h-[calc(100vh-220px)]"
              >
                {/* Left Panel - Context List */}
                <div className="w-60 h-full border-r border-gray-100/80 bg-gradient-to-b from-slate-50/50 to-gray-50/30 flex-shrink-0 flex flex-col">
                  <OrgContextDocumentList
                    contexts={contexts}
                    selectedContextId={selectedOrgContextId}
                    onSelectContext={handleSelectOrgContext}
                    onCreateClick={handleCreateClick}
                    isLoading={isOrgLoading}
                    currentPage={pagination?.page || 1}
                    totalPages={pagination?.totalPages || 1}
                    onPageChange={setCurrentPage}
                    canCreateOrgMemory={canCreateOrgMemory}
                    updateCountByContextId={updateCountByContextId}
                    proposedNewSections={proposedNewSections.map((p) => ({
                      id: p.id,
                      key: p.key,
                    }))}
                    selectedProposedNewId={selectedProposedNewId}
                    onSelectProposedNew={handleSelectProposedNew}
                    forceSkeletonState={isBulkImportProcessing}
                  />
                </div>

                {/* Right Panel - View Content */}
                <div className="flex-1 w-0 flex flex-col min-w-0 bg-white/50 relative">
                  {/* Floating edit/delete actions — hidden while the inline
                      editor is active so they don't overlap the form. */}
                  {!isEditing &&
                    !selectedProposedNew &&
                    !isBulkImportProcessing &&
                    selectedOrgContext &&
                    !(isOrgLoading && contexts.length === 0) &&
                    contexts.length > 0 &&
                    (canUpdateOrgMemory ||
                      (canDeleteOrgMemory && !selectedOrgContext.isDefault)) && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                        {canDeleteOrgMemory && !selectedOrgContext.isDefault && (
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
                  {isBulkImportProcessing ? (
                    renderBulkImportSkeleton()
                  ) : selectedProposedNew ? (
                    renderProposedNewPreview(selectedProposedNew)
                  ) : isEditing ? (
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
                      onSelectionCapture={handleSelectionCapture}
                      proposal={proposal}
                      onProposalApplied={handleProposalApplied}
                      onProposalDismissed={handleProposalDismissed}
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
                          Insights will appear here as your team asks questions.
                        </p>
                      </div>
                    ) : (
                      renderContentView(selectedOrgContext)
                    )}
                  </div>
                  )}
                </div>

                {/* Right Panel - Edit with Von chat (lives inside the card
                    so list / editor / chat feel tied together). Hidden
                    during bulk-import processing — the reviewing banner and
                    skeleton take over the center pane full-width. */}
                {isChatPanelOpen && !isBulkImportProcessing && (
                  <div className="w-[360px] flex-shrink-0 border-l border-gray-100/80 h-full">
                    <EditVonPane
                      onClose={handleCloseChat}
                      placeholder="Ask Von to help edit this memory..."
                      memoryContext={
                        memoryContextDismissed
                          ? null
                          : editingContext
                            ? {
                                id: editingContext.id,
                                key: editingContext.key,
                              }
                            : selectedOrgContext
                              ? {
                                  id: selectedOrgContext.id,
                                  key: selectedOrgContext.key,
                                }
                              : null
                      }
                      selectionSnippets={selectionSnippets}
                      onRemoveSnippet={handleRemoveSnippet}
                      onRemoveMemoryContext={handleRemoveMemoryContext}
                      onSimulateProposal={handleSimulateProposal}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* ===== USER MEMORY SECTION ===== */}
          {showUser && isUserMemoryEnabled && (
            <div className={isChatPanelOpen ? "w-[85%]" : "w-[75%]"}>
              {/* User Memory Card — mirrors the org card's split-pane
                  structure: content on the left, Edit-with-Von chat on the
                  right when open. Single personal memory so no sidebar. */}
              <div className="w-full bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="flex w-full h-[calc(100vh-220px)]">
                  {/* Content area */}
                  <div className="flex-1 w-0 flex flex-col min-w-0 bg-white/50 relative">
                    {/* Top bar: Import memory + Edit actions pinned in the
                        normal flow so they can't be obscured by scroll or
                        stacking context. Only rendered in preview mode; edit
                        mode and bulk-import processing take over the pane. */}
                    {!isEditing && !isBulkImportProcessing && userMemory && (
                      <div className="flex-shrink-0 flex items-center justify-end gap-1.5 px-4 pt-3 pb-0">
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
                      renderBulkImportSkeleton()
                    ) : isEditing && editingContext?.accessLevel === "user" ? (
                      <MemoryContextEditor
                        key={editingContext.id}
                        mode="edit"
                        context={editingContext}
                        onSave={handleSave}
                        onCancel={handleCancelEdit}
                        onSelectionCapture={handleSelectionCapture}
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

                  {/* Edit-with-Von chat pane. Scoped to the user's personal
                      memory, same pattern as org memory. Hidden during bulk
                      import so the reviewing skeleton owns the full width. */}
                  {isChatPanelOpen && !isBulkImportProcessing && (
                    <div className="w-[360px] flex-shrink-0 border-l border-gray-100/80 h-full">
                      <EditVonPane
                        onClose={handleCloseChat}
                        placeholder="Ask Von to help edit your memory..."
                        memoryContext={
                          memoryContextDismissed
                            ? null
                            : editingContext
                              ? {
                                  id: editingContext.id,
                                  key: editingContext.key,
                                }
                              : userMemory
                                ? {
                                    id: userMemory.id,
                                    key: userMemory.key,
                                  }
                                : null
                        }
                        selectionSnippets={selectionSnippets}
                        onRemoveSnippet={handleRemoveSnippet}
                        onRemoveMemoryContext={handleRemoveMemoryContext}
                      />
                    </div>
                  )}
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

      {/* Unsaved changes prompt — shown when the user tries to switch to
          another memory while an edit session is active. */}
      <UnsavedChangesModal
        isOpen={pendingSwitchContextId !== null}
        title="Discard unsaved changes?"
        body="You have unsaved edits in this memory. Switching will discard them and close the Edit with Von panel."
        confirmLabel="Discard changes"
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />

      {/* Bulk import drawer — only meaningful for org memory, so it's only
          wired up when the user has create access to the tenant list. */}
      <BulkImportPane
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        existingSectionCount={contexts.length}
        onSubmit={handleBulkImportSubmit}
        titleText={showUser ? "Import memory" : "Bulk Import"}
        subtitleText={
          showUser
            ? "Paste an export from another AI below, or describe what to add"
            : undefined
        }
        exportPrompt={showUser ? USER_MEMORY_EXPORT_PROMPT : undefined}
      />

      {/* Shared attachment preview drawer. Renders an object URL of the
          selected file — <iframe> handles PDFs + most text formats, <img>
          handles images. Closes via the SidePane close button; the object
          URL is revoked when the drawer unmounts. */}
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
