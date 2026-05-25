import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { report } from "../lib/analytics/tracker";
import { ArrowLineRightIcon, PlusIcon } from "@phosphor-icons/react";
import { dashboardKeys, useDashboardQuery } from "../hooks/useDashboardQuery";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { useAnalyticsTools } from "../hooks/useAnalyticsTools";
import { useTableServerPagination } from "../hooks/useTableServerPagination";
import { useDrilldownV2 } from "../hooks/useDrilldownV2";
import { useDashboardUpdate } from "../hooks/useDashboardUpdate";
import { useResizablePane } from "../hooks/useResizablePane";
import { useRestoreDashboardVersion } from "../hooks/useRestoreDashboardVersion";
import { useTeamMembers } from "../hooks/useTeam";
import { useToast } from "../hooks/useToast";
import { useUser } from "../hooks/useUser";
import { ApiError } from "../services/apiClient";
import {
  AnalyticsView,
  AnalyticsSkeleton,
  AnalyticsError,
} from "../components/Analytics";
import { VersionHistoryDrawer } from "../components/Analytics/AnalyticsView/VersionHistoryDrawer";
import { EditLockModal } from "../components/Analytics/AnalyticsView/EditLockModal";
import {
  Tooltip,
  useVisibilityToggle,
  type MentionItem,
  type WidgetAddToChatPayload,
} from "@vonlabs/design-components";
import { useWidgetMentionsStore } from "../store/widgetMentionsStore";
import { buildWidgetMention } from "../lib/widgetMentionUtils";
import { DrilldownPanelV2 } from "../components/Analytics/DrilldownPanel";
import { EditModeBanner } from "../components/Analytics/EditModeBanner";
import { ChatPicker } from "../components/Analytics/ChatPicker";
import { ConversationMoreMenu } from "../components/Analytics/ConversationMoreMenu";
import {
  ChatSession,
  type ChatSessionRef,
} from "../components/chat/ChatSession";
import { AnalyticsChatEmptyState } from "../components/AnalyticsChatEmptyState";
import { useDashboardRefreshEvents } from "../hooks/useDashboardRefreshEvents";
import { useDashboardSchedule } from "../hooks/useDashboardSchedule";
import { useGlobalChat } from "../providers/GlobalChat";
import {
  dashboardAssociatedChatsKeys,
  useDashboardAssociatedChats,
} from "../hooks/useDashboardAssociatedChats";
import {
  getCurrentVariantColumnVariantMap,
  getLevelColumnMaps,
  getLevelDrillableColumns,
  rowDescentFilters,
} from "../utils/drilldownFilters";

interface DashboardCanvasProps {
  dashboardId: string;
  sessionId: string;
  onChatClick: () => void;
  isChatOpen: boolean;
  /** Open the version-history docked panel. The panel docks between
   *  the dashboard canvas and the chat pane — both can be open at
   *  the same time. */
  onOpenVersionHistory: () => void;
  /** Click handler for the per-widget "Add to chat" icon (opens chat + adds mention). */
  onAddWidgetToChat: (widget: WidgetAddToChatPayload) => void;
  /**
   * Historical version selected from the version-history panel.
   * Non-null pins both the render call and filter PATCHes to that
   * `dashboard_version`, and flips the canvas into preview mode
   * (Ask-Von hidden, widget chat icons hidden). `null` keeps the
   * default metadata-driven render.
   */
  previewVersion: number | null;
}

// Salesforce Lightning: /lightning/r/ObjectType/RecordId/view
// Salesforce Classic:   /001... (3-char key prefix identifies object type)
const SF_PREFIX_MAP: Record<string, string> = {
  "001": "Account",
  "003": "Contact",
  "006": "Opportunity",
  "00q": "Lead",
  "00t": "Task",
  "00u": "User",
  "500": "Case",
  a0: "Custom", // custom object prefix starts with 'a'
};

function extractObjectType(href: string): string {
  const lightningMatch = href.match(/\/lightning\/r\/([^/]+)\//);
  if (lightningMatch) return lightningMatch[1];
  const idMatch = href.match(/\/([A-Za-z0-9]{15,18})(?:\/|$|\?|#)/);
  if (idMatch) {
    const prefix = idMatch[1].substring(0, 3).toLowerCase();
    if (SF_PREFIX_MAP[prefix]) return SF_PREFIX_MAP[prefix];
  }
  return "unknown";
}

/**
 * All dashboard-specific state and rendering. Receives key={dashboardId} so it
 * fully resets on navigation — but lives inside Analytics so the chat panel
 * (rendered alongside it) remains untouched.
 */
function DashboardCanvas({
  dashboardId,
  sessionId,
  onChatClick,
  isChatOpen,
  onOpenVersionHistory,
  onAddWidgetToChat,
  previewVersion,
}: DashboardCanvasProps) {
  const { data, isLoading, isFetching, error, latestPublishedVersion } =
    useDashboardQuery(dashboardId, previewVersion);
  const isVersionPreview = previewVersion !== null;

  const editModeEnteredAtRef = useRef<number | null>(null);

  const {
    handleSave,
    savePhase,
    showSaveToast,
    saveToastKind,
    isFirstSave,
    handleShareV2: baseHandleShareV2,
    shareV2Phase,
    handleAcquireLock: baseHandleAcquireLock,
    acquireLockPhase,
    handleDiscardDraft: baseHandleDiscardDraft,
    discardDraftPhase,
    handleSaveDraft,
    saveDraftPhase,
    handleRefresh,
  } = useAnalyticsTools(dashboardId, {
    dashboardVersion: data?.dashboard?.dashboardVersion,
  });

  const handleShareV2 = useCallback(
    (...args: Parameters<typeof baseHandleShareV2>) => {
      const collaboratorCount = data?.dashboard?.userGrants?.length ?? 0;
      report.dashboardShareModalOpened(
        dashboardId,
        collaboratorCount,
        sessionId,
      );
      return baseHandleShareV2(...args);
    },
    [
      baseHandleShareV2,
      dashboardId,
      sessionId,
      data?.dashboard?.userGrants?.length,
    ],
  );

  const handleAcquireLock = useCallback(
    (...args: Parameters<typeof baseHandleAcquireLock>) => {
      editModeEnteredAtRef.current = Date.now();
      const dashStatus =
        (data?.dashboard?.isEditable ?? false) ? "draft" : "published";
      report.dashboardEditEntered({
        dashboardId,
        trigger: "edit_button",
        dashboardStatus: dashStatus,
        sessionId,
      });
      return baseHandleAcquireLock(...args);
    },
    [
      baseHandleAcquireLock,
      data?.dashboard?.isEditable,
      dashboardId,
      sessionId,
    ],
  );

  const handleDiscardDraft = useCallback(
    (...args: Parameters<typeof baseHandleDiscardDraft>) => {
      const timeInEditMs =
        editModeEnteredAtRef.current != null
          ? Date.now() - editModeEnteredAtRef.current
          : 0;
      editModeEnteredAtRef.current = null;
      report.dashboardDiscardClicked({
        dashboardId,
        hadUnsavedChanges: true,
        timeInEditMs,
        sessionId,
      });
      return baseHandleDiscardDraft(...args);
    },
    [baseHandleDiscardDraft, dashboardId, sessionId],
  );

  const { handleUpdate } = useDashboardUpdate(dashboardId);

  const handleRename = useCallback(
    (newName: string) => {
      handleUpdate({ dashboard_name: newName });
    },
    [handleUpdate],
  );

  const handleShareLinkCopied = useCallback(() => {
    report.dashboardShareLinkCopied(dashboardId, sessionId);
  }, [dashboardId, sessionId]);

  const handleWidgetQueryViewed = useCallback(
    (_panelId: string, widgetTitle: string, widgetType: string) => {
      report.dashboardWidgetQueryViewed(
        dashboardId,
        widgetTitle,
        widgetType,
        sessionId,
      );
    },
    [dashboardId, sessionId],
  );

  const handleWidgetSQLCopied = useCallback(
    (_panelId: string, widgetTitle: string) => {
      report.dashboardWidgetSQLCopied(dashboardId, widgetTitle, sessionId);
    },
    [dashboardId, sessionId],
  );

  const dashboard = data?.dashboard ?? null;
  const refreshInfo = data?.refreshInfo ?? null;
  const activeFilters = data?.activeFilters ?? {};

  // Track Dashboard - Page Viewed once the data is loaded
  const pageViewTrackedRef = useRef(false);
  useEffect(() => {
    if (!dashboard || pageViewTrackedRef.current) return;
    pageViewTrackedRef.current = true;
    report.dashboardPageViewed({
      dashboardId,
      dashboardName: dashboard.title,
      viewType: "sidebar",
      mode: dashboard.isEditable ? "draft" : "published",
      owner: dashboard.accessLevel === "owner" ? "me" : "shared",
      dashboardWidgetCount: Object.keys(dashboard.widgets ?? {}).length,
      chatId: null,
      sessionId,
    });
  }, [dashboard, dashboardId, sessionId]);
  const {
    definitions: filterDefinitions,
    filterState,
    panelFilterState,
    lockedFilterState,
    lockedPanelFilterState,
    canApply: filterCanApply,
    isApplying: filterIsApplying,
    handleFilterChange,
    handleRevertFilter,
    handleRemoveFilter,
    handleClearFilter,
    handlePanelFilterChange,
    handleResetPanelFilter,
    handleRevertPanelFilter,
    handleRevertPanel,
    handleApplyPanelFilter,
    canApplyPanelFilter,
    handleCommitPanelLock,
    canLockPanelFilter,
    handleCommitLock,
    canLockFilter,
    getEffectivePanelState,
    handleApply,
  } = useDashboardFilters(
    dashboardId,
    dashboard?.filters?.definitions ?? [],
    activeFilters,
    {
      panelState: dashboard?.filters?.panel_state,
      lockedFilterState: dashboard?.filters?.locked_filter_state,
      lockedPanelFilterState: dashboard?.filters?.locked_panel_filter_state,
      isOwner: dashboard?.accessLevel === "owner",
      // Always pin filter PATCHes to the dashboard version we're
      // currently rendering. `dashboard.dashboardVersion` reflects the
      // metadata-driven version in the default view and the previewed
      // version while version history is driving the canvas, so the BE
      // sees a consistent `dashboard_version` in either mode.
      dashboardVersion: dashboard?.dashboardVersion,
    },
  );
  const {
    mergedWidgets,
    handlePageChange,
    handleSortChange,
    loadingPanels,
    activeSorts,
  } = useTableServerPagination(dashboardId, dashboard?.widgets ?? {});

  // Drilldown — pyramid model. Every panel authored by the current
  // dashboard-creation flow has ``drilldown_v2`` populated; legacy V1
  // panels have been migrated cluster-wide.
  const drillV2 = useDrilldownV2(dashboardId);

  const handleRecordLinkClicked = useCallback(
    (href: string) => {
      const drillWidgetTitle = drillV2.panelId
        ? (dashboard?.widgets?.[drillV2.panelId]?.title ?? "")
        : "";
      report.dashboardDrilldownRecordClicked({
        dashboardId,
        widgetName: drillWidgetTitle,
        recordId: href,
        objectType: extractObjectType(href),
        sessionId,
      });
    },
    [dashboardId, drillV2.panelId, dashboard?.widgets, sessionId],
  );

  const handleWidgetDrillDown = useCallback(
    (panelId: string, metricValue?: unknown) => {
      // ``metricValue`` is set when the panel is a KPI tile — the
      // resolved numeric the tile rendered. Surfaced in the
      // breadcrumb's parenthesized suffix. Chart drill-icon clicks
      // pass undefined (no single value to drill into).
      drillV2.openPanelDrilldown(panelId, [], {}, metricValue);
    },
    [drillV2],
  );

  const handlePointDrillDown = useCallback(
    (
      panelId: string,
      filters: Record<string, unknown>,
      metricValue?: unknown,
      metricLabel?: string,
      variantId?: string | null,
    ) => {
      // column_path empty = default target at L0; filters pass through as-is
      // (parent click handler already keyed by the agent-declared data_key).
      // ``metricValue`` carries the clicked point's numeric value (chart)
      // or the clicked cell's value (table); ``metricLabel`` carries the
      // column label for table sources so the breadcrumb shows
      // "(Opp Count: 47)" — chart sources leave it null since the axis
      // is already in the segment's main label. ``variantId`` routes
      // table cell clicks to a specific L1 variant via
      // ``panel.drilldown_v2.column_variant_map``; null picks L1's default.
      drillV2.openPanelDrilldown(
        panelId,
        [],
        filters,
        metricValue,
        metricLabel,
        variantId,
      );
    },
    [drillV2],
  );

  const handleV2RowDrill = useCallback(
    (
      _rowIndex: number,
      rowData: Record<string, unknown>,
      metricValue?: unknown,
      metricLabel?: string,
      variantId?: string | null,
    ) => {
      // Pyramid model: every click descends to the next level (when one
      // exists). Each chain entry captures ONLY the axes newly introduced at
      // that depth — see `rowDescentFilters` doc — so the breadcrumb reads
      // "Stage: X › Owner: Y" rather than every column from the clicked row
      // (account_count, total_arr, …) leaking in as bogus filters.
      //
      // column_path is a depth marker. We extend it by one segment per
      // descent so server cache keys stay distinct across click paths that
      // happen to share depth; the segment value itself is opaque to routing
      // — we use the first scalar key as a breadcrumb hint.
      //
      // ``variantId`` (when set) routes the next level to a specific
      // variant via the active variant's column_variant_map; null falls
      // back to the next level's is_default. Resolution happens inside
      // DrilldownPanelV2 because that's where the active variant + clicked
      // column id are both known.
      const widget = drillV2.panelId
        ? dashboard?.widgets?.[drillV2.panelId]
        : undefined;
      const levelColumnMaps = getLevelColumnMaps(widget);
      const currentDepth = drillV2.clickChain.length;
      const filters = rowDescentFilters(
        rowData,
        levelColumnMaps[currentDepth] ?? [],
        levelColumnMaps[currentDepth - 1] ?? [],
      );
      const breadcrumbSeg = Object.keys(filters)[0] ?? `L${currentDepth}`;
      const topChainNode = drillV2.clickChain[currentDepth - 1];
      const nextPath = [...(topChainNode?.columnPath ?? []), breadcrumbSeg];
      drillV2.pushLevel(nextPath, filters, metricValue, metricLabel, variantId);
    },
    [drillV2, dashboard],
  );

  // Schedule management
  const {
    schedule,
    isScheduled,
    isPaused: isSchedulePaused,
    isMutating: isScheduleMutating,
    handleCreateSchedule,
    handleUpdateSchedule,
    handlePauseSchedule,
    handleResumeSchedule,
    handleDeleteSchedule,
  } = useDashboardSchedule(dashboardId);

  // Subscribe to Pusher events for dashboard refresh notifications
  const { isRefreshing } = useDashboardRefreshEvents(dashboardId);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !dashboard) {
    return <AnalyticsError error={error?.message ?? null} />;
  }

  return (
    <>
      <AnalyticsView
        dashboard={dashboard}
        embedded
        refreshInfo={refreshInfo}
        filterDefinitions={filterDefinitions}
        filterState={filterState}
        filterCanApply={filterCanApply}
        filterIsApplying={filterIsApplying}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onApplyFilters={handleApply}
        onClearFilter={handleClearFilter}
        onToggleLock={handleCommitLock}
        canLockFilter={canLockFilter}
        onRevertFilter={handleRevertFilter}
        onRefresh={handleRefresh}
        onSave={handleSave}
        savePhase={savePhase}
        showSaveToast={showSaveToast}
        saveToastKind={saveToastKind}
        isFirstSave={isFirstSave}
        onShareV2={handleShareV2}
        shareV2Phase={shareV2Phase}
        onAcquireLock={handleAcquireLock}
        acquireLockPhase={acquireLockPhase}
        onDiscardDraft={handleDiscardDraft}
        discardDraftPhase={discardDraftPhase}
        onSaveDraft={handleSaveDraft}
        saveDraftPhase={saveDraftPhase}
        onChatClick={onChatClick}
        onOpenVersionHistory={onOpenVersionHistory}
        isChatOpen={isChatOpen}
        isVersionPreview={isVersionPreview}
        latestPublishedVersion={latestPublishedVersion}
        onTablePageChange={handlePageChange}
        loadingTablePanels={loadingPanels}
        paginatedWidgets={mergedWidgets}
        onDrillDown={handleWidgetDrillDown}
        onPointDrillDown={handlePointDrillDown}
        onAddWidgetToChat={onAddWidgetToChat}
        onLinkCopied={handleShareLinkCopied}
        onWidgetQueryViewed={handleWidgetQueryViewed}
        onWidgetSQLCopied={handleWidgetSQLCopied}
        onTableSortChange={handleSortChange}
        tableSortStates={activeSorts}
        onRename={handleRename}
        schedule={schedule}
        isScheduled={isScheduled}
        isSchedulePaused={isSchedulePaused}
        isScheduleMutating={isScheduleMutating}
        onCreateSchedule={handleCreateSchedule}
        onUpdateSchedule={handleUpdateSchedule}
        onPauseSchedule={handlePauseSchedule}
        onResumeSchedule={handleResumeSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        isRefetchingData={isFetching && !isLoading}
        isRefreshing={isRefreshing}
        isDrilldownOpen={drillV2.isOpen}
        panelFilterState={panelFilterState}
        lockedFilterState={lockedFilterState}
        getEffectivePanelState={getEffectivePanelState}
        onPanelFilterChange={handlePanelFilterChange}
        onResetPanelFilter={handleResetPanelFilter}
        onRevertPanelFilter={handleRevertPanelFilter}
        onRevertPanel={handleRevertPanel}
        onApplyPanelFilter={handleApplyPanelFilter}
        canApplyPanelFilter={canApplyPanelFilter}
        onTogglePanelLock={
          dashboard.accessLevel === "owner" ? handleCommitPanelLock : undefined
        }
        canLockPanelFilter={canLockPanelFilter}
        lockedPanelFilterState={lockedPanelFilterState}
      />
      {/* Edit mode banner — floats above drilldown panel when both are active */}
      <EditModeBanner
        visible={dashboard.isEditable && drillV2.isOpen}
        className="absolute bottom-0 left-0 right-0 z-[51] pointer-events-none flex justify-center pb-4"
      />
      <DrilldownPanelV2
        drill={drillV2}
        widgetTitle={
          drillV2.panelId
            ? (dashboard.widgets?.[drillV2.panelId]?.title ?? "Drilldown")
            : "Drilldown"
        }
        levelColumnMaps={getLevelColumnMaps(
          drillV2.panelId ? dashboard.widgets?.[drillV2.panelId] : undefined,
        )}
        levelDrillableColumns={getLevelDrillableColumns(
          drillV2.panelId ? dashboard.widgets?.[drillV2.panelId] : undefined,
        )}
        currentLevelColumnVariantMap={getCurrentVariantColumnVariantMap(
          drillV2.panelId ? dashboard.widgets?.[drillV2.panelId] : undefined,
          drillV2.clickChain.length,
          drillV2.currentVariantId,
        )}
        onRowDrill={handleV2RowDrill}
        onRecordLinkClicked={handleRecordLinkClicked}
      />
    </>
  );
}

/**
 * Outer shell — persists across dashboard navigation. Chat panel lives here
 * so it never remounts when the user switches dashboards.
 */
const Analytics = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>() as {
    dashboardId: string;
  };
  const [searchParams] = useSearchParams();

  // Stable session ID for this dashboard view — resets on dashboardId change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sessionId = useMemo(() => crypto.randomUUID(), [dashboardId]);

  // Read conversationId from query params (deep-link support: "View in Dashboard" CTA).
  // Validate the shape — id flows into URL paths downstream, so reject
  // anything that isn't a plain id to close off path-injection.
  const rawConversationIdFromParams = searchParams.get("conversationId");
  const conversationIdFromParams =
    rawConversationIdFromParams &&
    /^[A-Za-z0-9_-]+$/.test(rawConversationIdFromParams)
      ? rawConversationIdFromParams
      : null;

  // Global chat state — persists across dashboard navigation
  const {
    activeChatId,
    setActiveChatId,
    isChatPanelOpen,
    openChatPanel,
    closeChatPanel,
  } = useGlobalChat();

  // Shares the React Query cache with ChatPicker (one request per dashboard).
  const { data: associatedChatsData } =
    useDashboardAssociatedChats(dashboardId);
  const queryClient = useQueryClient();

  // Local fallback for conversations created during this session before they're
  // reflected in the sidebar list
  const [createdConversationId, setCreatedConversationId] = useState<
    string | null
  >(null);
  const {
    isVisible: isRenamingChat,
    show: startRenamingChat,
    hide: stopRenamingChat,
  } = useVisibilityToggle(false);

  // Track which dashboardId was active when the create was initiated so that
  // an in-flight response from a previous dashboard doesn't overwrite state
  // after the user has navigated to a different dashboard.
  const activeDashboardIdRef = useRef(dashboardId);
  const chatSessionRef = useRef<ChatSessionRef>(null);

  // Widget chips queued before a conversation exists (new-chat path).
  // Passed to ChatSession so NewChatInner can render them; flushed into the
  // widget-mentions store once a conversationId resolves via auto-select.
  // Cleared without flush when a conversation is created via first send —
  // the outgoing message payload already includes the chips, so re-adding
  // them to the store would show stale chips in the resulting existing chat.
  const [pendingWidgetMentions, setPendingWidgetMentions] = useState<
    MentionItem[]
  >([]);
  const pendingWidgetMentionsRef = useRef(pendingWidgetMentions);
  pendingWidgetMentionsRef.current = pendingWidgetMentions;
  // Set when the user clicks "New chat" so the auto-select effect skips one
  // cycle instead of immediately re-selecting the most-recent associated chat.
  const userClearedChatRef = useRef(false);
  const addWidgetMentionToStore = useWidgetMentionsStore((s) => s.add);

  const handleConversationCreated = useCallback(
    (conversationId: string) => {
      if (activeDashboardIdRef.current === dashboardId) {
        setCreatedConversationId(conversationId);
        setActiveChatId(conversationId);
        setPendingWidgetMentions([]);
        // Newly-created chat belongs to this dashboard — refresh the
        // ChatPicker's "Recently used" list so it shows up immediately
        // instead of waiting for the stale-time to elapse.
        queryClient.invalidateQueries({
          queryKey: dashboardAssociatedChatsKeys.byDashboard(dashboardId),
        });
      }
    },
    [dashboardId, setActiveChatId, queryClient],
  );

  // On dashboard switch, reset dashboard-specific local state. Clear the
  // active chat so auto-select picks the new dashboard's most-recent
  // associated chat on the next render. Deep-link id wins and is set by
  // the effect below.
  useEffect(() => {
    const prevDashboardId = activeDashboardIdRef.current;
    if (prevDashboardId === dashboardId) return;
    activeDashboardIdRef.current = dashboardId;
    setCreatedConversationId(null);
    setPendingWidgetMentions([]);
    // Tear down version-history preview on dashboard switch so the
    // new dashboard never inherits another's preview selection.
    setIsVersionHistoryOpen(false);
    setPreviewVersion(null);
    if (!conversationIdFromParams) {
      setActiveChatId(null);
    }
  }, [dashboardId, conversationIdFromParams, setActiveChatId]);

  // Deep-link support: when a conversationId is present in the URL, activate it.
  useEffect(() => {
    if (conversationIdFromParams) {
      setActiveChatId(conversationIdFromParams);
      openChatPanel();
    }
  }, [conversationIdFromParams, setActiveChatId, openChatPanel]);

  // The active conversation: global selection takes priority, then local fallback
  const conversationId = activeChatId ?? createdConversationId;

  // Fetch dashboard metadata for the chat panel (React Query cache — no duplicate request
  // since DashboardCanvas calls this same hook with the same key)
  const { data } = useDashboardQuery(dashboardId);
  const dashboardTitle = data?.dashboard?.title ?? "";
  const dashboardVersion = data?.dashboard?.dashboardVersion ?? 0;

  // Auto-select the most-recent associated chat when the panel is open and
  // nothing is selected (fresh open, or cleared by a dashboard switch).
  // Deep-link id is set by the effect above and takes precedence.
  // Does not override the user's manual pick — only fills an empty slot.
  useEffect(() => {
    if (!isChatPanelOpen) return;
    if (conversationIdFromParams) return;
    if (activeChatId) return;
    if (!associatedChatsData) return;
    if (userClearedChatRef.current) {
      userClearedChatRef.current = false;
      return;
    }

    const associated = associatedChatsData.conversations;
    const selectedId =
      associated.length > 0 ? associated[0].conversationId : null;
    if (!selectedId) return;

    setActiveChatId(selectedId);

    if (pendingWidgetMentionsRef.current.length > 0) {
      pendingWidgetMentionsRef.current.forEach((m) =>
        addWidgetMentionToStore(selectedId, m),
      );
      setPendingWidgetMentions([]);
    }
  }, [
    isChatPanelOpen,
    activeChatId,
    associatedChatsData,
    setActiveChatId,
    conversationIdFromParams,
    addWidgetMentionToStore,
  ]);

  const handleNewChat = useCallback(() => {
    userClearedChatRef.current = true;
    setActiveChatId(null);
    setCreatedConversationId(null);
  }, [setActiveChatId]);

  // Widget "Add to chat" handler — opens the chat pane, then routes the
  // mention to the store (existing convo) or pending state (new chat).
  const handleAddWidgetToChat = useCallback(
    (widget: WidgetAddToChatPayload) => {
      const dashboard = data?.dashboard;
      if (!dashboard) return;
      report.dashboardWidgetAddedToChat(
        dashboardId,
        widget.title,
        widget.type,
        sessionId,
      );
      const mention = buildWidgetMention(widget, {
        dashboardId: dashboard.id,
        dashboardVersion: dashboard.dashboardVersion,
        dashboardName: dashboard.title,
      });
      if (!isChatPanelOpen) openChatPanel();
      if (conversationId) {
        addWidgetMentionToStore(conversationId, mention);
      } else {
        setPendingWidgetMentions((prev) =>
          prev.some((m) => m.id === mention.id) ? prev : [...prev, mention],
        );
      }
      requestAnimationFrame(() => {
        chatSessionRef.current?.focus();
      });
    },
    [
      data?.dashboard,
      isChatPanelOpen,
      openChatPanel,
      conversationId,
      addWidgetMentionToStore,
      dashboardId,
      sessionId,
    ],
  );

  const handleRemovePendingWidget = useCallback(
    ({ id }: { id: string }) =>
      setPendingWidgetMentions((prev) => prev.filter((m) => m.id !== id)),
    [],
  );

  // Version history is the second right-edge surface. It docks
  // between the dashboard canvas and the chat pane, so both can be
  // open at the same time — opening one no longer closes the other.
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  // Historical `dashboard_version` the user picked from the panel.
  // Drives render + filter PATCHes downstream; cleared when the panel
  // closes (or the dashboard switches) so we never leak preview state
  // across navigations.
  const [previewVersion, setPreviewVersion] = useState<number | null>(null);

  const dashboardIsEditMode =
    (data?.dashboard?.isEditable ?? false) && previewVersion === null;
  const dashboardWidgetCount = Object.keys(
    data?.dashboard?.widgets ?? {},
  ).length;

  // Track Dashboard - Closed on unmount
  const pageOpenedAtRef = useRef(Date.now());
  const dashboardIdRef = useRef(dashboardId);
  dashboardIdRef.current = dashboardId;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  useEffect(() => {
    const openedAt = Date.now();
    pageOpenedAtRef.current = openedAt;
    return () => {
      report.dashboardClosed(
        dashboardIdRef.current,
        Date.now() - pageOpenedAtRef.current,
        sessionIdRef.current,
      );
    };
  }, [dashboardId]);

  const handleAskVonClick = useCallback(() => {
    report.dashboardAskVonClicked(
      dashboardId,
      "dashboard_fullscreen",
      sessionId,
    );
    if (!isChatPanelOpen) openChatPanel();
    requestAnimationFrame(() => {
      chatSessionRef.current?.focus();
    });
  }, [isChatPanelOpen, openChatPanel, dashboardId, sessionId]);

  const handleOpenVersionHistory = useCallback(() => {
    report.dashboardVersionHistoryOpened(
      dashboardId,
      "overflow_menu",
      sessionId,
    );
    setIsVersionHistoryOpen(true);
  }, [dashboardId, sessionId]);

  const handleCloseVersionHistory = useCallback(() => {
    setIsVersionHistoryOpen(false);
    // Closing the panel pops the user back onto the live dashboard.
    // Clearing here (rather than on the dashboardId effect alone)
    // makes sure the canvas re-renders the metadata-driven version
    // immediately, even when the user stays on the same dashboard.
    setPreviewVersion(null);
  }, []);

  const handleSelectVersion = useCallback(
    (dashboardVersion: number) => {
      report.dashboardVersionHistoryEntryPreviewed(
        dashboardId,
        String(dashboardVersion),
        new Date().toISOString(),
        sessionId,
      );
      setPreviewVersion(dashboardVersion);
    },
    [dashboardId, sessionId],
  );

  // ── Restore as draft (VON-1282) ───────────────────────────────────
  //
  // The drawer's footer CTA routes through here. Success drops the user
  // back onto the live (now editable) dashboard — the new active draft —
  // by closing the panel and clearing the preview pin. Lock-conflict
  // errors reuse the EditLockModal:
  //   - HELD_BY_OTHER → default copy ("X is currently editing this
  //     dashboard / Ask them to save the draft to continue editing it.")
  //   - LOCK_REQUIRED → swapped copy ("You must be in edit mode to
  //     restore a draft.") so the user knows to click Edit first.
  const { showToast } = useToast();
  const { user } = useUser();
  const { data: teamMembersData } = useTeamMembers(user?.tenantId);
  const restoreMutation = useRestoreDashboardVersion(dashboardId);

  const [restoreLockModal, setRestoreLockModal] = useState<
    { kind: "held_by_other" } | { kind: "lock_required" } | null
  >(null);

  const dashboardLockHolderName = useMemo(() => {
    const holderId = data?.dashboard?.editLock?.userId;
    if (!holderId) return null;
    const member = teamMembersData?.find((m) => m.id === holderId);
    if (!member) return null;
    return `${member.firstName} ${member.lastName}`.trim() || member.email;
  }, [data?.dashboard?.editLock?.userId, teamMembersData]);

  const handleCloseRestoreLockModal = useCallback(() => {
    setRestoreLockModal(null);
  }, []);

  const handleRestoreVersion = useCallback(
    async (dashboardVersion: number, versionLabel: string) => {
      try {
        await restoreMutation.mutateAsync(dashboardVersion);
        // Restored. Close the version-history drawer and drop the
        // preview pin so the canvas re-fetches metadata and renders the
        // new active draft via `editable_version` — same flow as
        // entering edit mode normally (the lock is retained).
        handleCloseVersionHistory();
        showToast({
          message: `Dashboard version ${versionLabel} is restored, you can continue to edit.`,
          variant: "success",
        });
      } catch (error) {
        const code =
          error instanceof ApiError
            ? (error.response as { error?: { code?: string } })?.error?.code
            : undefined;
        if (code === "APP_DASHBOARD_LOCK_HELD_BY_OTHER") {
          // Refresh detail so `editLock` reflects the new holder before
          // the modal reads it for the name.
          queryClient.invalidateQueries({
            queryKey: dashboardKeys.detail(dashboardId),
          });
          setRestoreLockModal({ kind: "held_by_other" });
          return;
        }
        if (code === "APP_DASHBOARD_LOCK_REQUIRED") {
          setRestoreLockModal({ kind: "lock_required" });
          return;
        }
        if (code === "APP_DASHBOARD_NOT_FOUND") {
          showToast({
            message: "This dashboard no longer exists.",
            variant: "error",
          });
          return;
        }
        console.error("[Analytics] Restore version failed:", error);
        showToast({
          message: "Failed to restore version. Please try again.",
          variant: "error",
        });
      }
    },
    [
      restoreMutation,
      queryClient,
      dashboardId,
      showToast,
      handleCloseVersionHistory,
    ],
  );

  const {
    widthCss: chatPaneWidth,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useResizablePane();

  return (
    <div className="flex h-full w-full gap-1.5">
      {/* Lock-conflict modal for the restore-as-draft flow. Reuses the
          modal that EditButton already shows for the acquire-lock 409,
          so the two conflict surfaces stay visually identical. Copy
          swaps when nobody is holding the lock — the user just needs
          to enter edit mode first. */}
      <EditLockModal
        isOpen={restoreLockModal !== null}
        onClose={handleCloseRestoreLockModal}
        holderName={dashboardLockHolderName}
        title={
          restoreLockModal?.kind === "lock_required"
            ? "You must be in edit mode to restore a draft"
            : undefined
        }
        description={
          restoreLockModal?.kind === "lock_required"
            ? "Click Edit on the dashboard to start an edit session, then try restoring again."
            : undefined
        }
      />
      {/* Shared dashboard card. The dashboard canvas and the version
          history side-pane sit inside this wrapper so they read as
          one continuous panel: the wrapper owns the card chrome
          (rounded corners, border, shadow), AnalyticsView is
          rendered with `embedded` so DashboardLayout drops its own
          chrome, and the version history pane sits flush against
          the canvas with just a 1px left divider. */}
      <div className="flex-1 min-w-0 h-full flex bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="flex-1 min-w-0 h-full relative flex flex-col">
          {/* key={dashboardId} resets all dashboard-specific state on navigation */}
          <DashboardCanvas
            key={dashboardId}
            dashboardId={dashboardId}
            sessionId={sessionId}
            onChatClick={handleAskVonClick}
            isChatOpen={isChatPanelOpen}
            onOpenVersionHistory={handleOpenVersionHistory}
            onAddWidgetToChat={handleAddWidgetToChat}
            previewVersion={previewVersion}
          />
        </div>

        <div
          className="h-full flex-shrink-0 relative flex flex-col bg-white border-l border-gray-100"
          style={{
            width: isVersionHistoryOpen ? "380px" : "0px",
            overflow: isVersionHistoryOpen ? undefined : "hidden",
            transition: "width 0.3s ease",
          }}
          aria-hidden={!isVersionHistoryOpen}
          // `inert` removes the collapsed panel + its focusable controls
          // (close button, tabs) from screen readers and the tab order.
          inert={!isVersionHistoryOpen}
        >
          <VersionHistoryDrawer
            dashboardId={dashboardId}
            isOpen={isVersionHistoryOpen}
            onClose={handleCloseVersionHistory}
            selectedVersion={previewVersion}
            onSelectVersion={handleSelectVersion}
            editLockUserId={data?.dashboard?.editLock?.userId ?? null}
            onRestoreVersion={handleRestoreVersion}
            isRestorePending={restoreMutation.isPending}
          />
        </div>
      </div>

      <div
        className="h-full flex-shrink-0 relative flex flex-col bg-white rounded-xl shadow-xs border border-gray-100"
        style={{
          width: isChatPanelOpen ? chatPaneWidth : "0px",
          overflow: isChatPanelOpen ? undefined : "hidden",
          transition: isResizing ? "none" : "width 0.3s ease",
        }}
      >
        {/* Resize handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-indigo-500/30 transition-colors z-10 group touch-none"
          style={{ marginLeft: "-3px" }}
        >
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-transparent group-hover:bg-indigo-400 transition-colors" />
        </div>

        {/* Chat picker — persistent header that lets users switch conversations */}
        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 border-b border-gray-100">
          <ChatPicker
            activeChatId={activeChatId}
            onSelect={setActiveChatId}
            isRenaming={isRenamingChat}
            onRenameEnd={stopRenamingChat}
            dashboardId={dashboardId}
          />
          <Tooltip content="New chat">
            <button
              onClick={handleNewChat}
              className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <PlusIcon size={14} weight="bold" />
            </button>
          </Tooltip>
          <ConversationMoreMenu
            conversationId={activeChatId}
            onDeleted={() => {
              setActiveChatId(null);
              setCreatedConversationId(null);
            }}
            onStartRename={startRenamingChat}
          />
          <Tooltip content="Collapse chat">
            <button
              onClick={closeChatPanel}
              className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLineRightIcon size={14} weight="bold" />
            </button>
          </Tooltip>
        </div>

        {/* Chat content — always render ChatSession so it never unmounts on dashboard switch */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatSession
            ref={chatSessionRef}
            key={conversationId ?? `new-${dashboardId}`}
            conversationId={conversationId}
            compact
            placeholder="Ask questions or make changes..."
            disableInput={isVersionHistoryOpen}
            disabledTooltip={
              isVersionHistoryOpen
                ? "Close the dashboard version history to chat"
                : undefined
            }
            dashboardId={dashboardId}
            analyticsSessionId={sessionId}
            dashboardMode={dashboardIsEditMode ? "edit" : "published"}
            dashboardWidgetCount={dashboardWidgetCount}
            dashboardTitle={dashboardTitle}
            dashboardVersion={dashboardVersion}
            onCreated={handleConversationCreated}
            pendingWidgetMentions={pendingWidgetMentions}
            onPendingWidgetMentionRemoved={handleRemovePendingWidget}
          >
            <ChatSession.EmptyState>
              <AnalyticsChatEmptyState />
            </ChatSession.EmptyState>
          </ChatSession>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
