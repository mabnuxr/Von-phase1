import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLineRightIcon, PlusIcon } from "@phosphor-icons/react";
import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { useAnalyticsTools } from "../hooks/useAnalyticsTools";
import { useTableServerPagination } from "../hooks/useTableServerPagination";
import { useDrilldown } from "../hooks/useDrilldown";
import { useDrilldownV2 } from "../hooks/useDrilldownV2";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useDashboardUpdate } from "../hooks/useDashboardUpdate";
import { useResizablePane } from "../hooks/useResizablePane";
import {
  AnalyticsView,
  AnalyticsSkeleton,
  AnalyticsError,
} from "../components/Analytics";
import {
  Tooltip,
  useVisibilityToggle,
  type MentionItem,
  type WidgetAddToChatPayload,
} from "@vonlabs/design-components";
import { useWidgetMentionsStore } from "../store/widgetMentionsStore";
import { buildWidgetMention } from "../lib/widgetMentionUtils";
import {
  DrilldownPanel,
  DrilldownPanelV2,
} from "../components/Analytics/DrilldownPanel";
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
  onChatClick: () => void;
  isChatOpen: boolean;
  /** Click handler for the per-widget "Add to chat" icon (opens chat + adds mention). */
  onAddWidgetToChat: (widget: WidgetAddToChatPayload) => void;
}

/**
 * All dashboard-specific state and rendering. Receives key={dashboardId} so it
 * fully resets on navigation — but lives inside Analytics so the chat panel
 * (rendered alongside it) remains untouched.
 */
function DashboardCanvas({
  dashboardId,
  onChatClick,
  isChatOpen,
  onAddWidgetToChat,
}: DashboardCanvasProps) {
  const { data, isLoading, isFetching, error } = useDashboardQuery(dashboardId);

  const {
    handleSave,
    savePhase,
    showSaveToast,
    isFirstSave,
    handleRevert,
    revertPhase,
    handleShare,
    sharePhase,
    handleRefresh,
    editModeMutation,
    editModePhase,
  } = useAnalyticsTools(dashboardId);

  const { handleUpdate } = useDashboardUpdate(dashboardId);

  const handleRename = useCallback(
    (newName: string) => {
      handleUpdate({ dashboard_name: newName });
    },
    [handleUpdate],
  );

  const dashboard = data?.dashboard ?? null;
  const refreshInfo = data?.refreshInfo ?? null;
  const activeFilters = data?.activeFilters ?? {};
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
      isOwner: dashboard?.isOwner,
    },
  );
  const {
    mergedWidgets,
    handlePageChange,
    handleSortChange,
    loadingPanels,
    activeSorts,
  } = useTableServerPagination(dashboardId, dashboard?.widgets ?? {});

  // Drilldown
  const {
    isOpen: isDrilldownOpen,
    panelId: drilldownPanelId,
    title: drilldownTitle,
    query: drilldownQuery,
    data: drilldownData,
    pagination: drilldownPagination,
    currentSort: drilldownSort,
    isLoading: isDrilldownLoading,
    isError: isDrilldownError,
    openDrilldown,
    openPointDrilldown,
    closeDrilldown,
    changePage: changeDrilldownPage,
    changeSort: changeDrilldownSort,
  } = useDrilldown(dashboardId);

  // V2 drilldown runs alongside V1, gated by the `drilldown_v2` LaunchDarkly
  // flag (matched by the backend's V2 endpoint gate). Per-panel routing also
  // requires `widget.drilldown_v2` on the dashboard config — when the flag is
  // off, V2-built panels fall through to the legacy V1 wiring (a no-op for
  // V2-only panels, which is fine: V2-built dashboards are only served to
  // flagged users in practice).
  const { isDrilldownV2Enabled } = useFeatureFlag();
  const drillV2 = useDrilldownV2(dashboardId);
  // Named ``shouldUseV2`` (not ``useV2``) so React's rules-of-hooks lint
  // doesn't mistake this regular callback for a custom hook.
  const shouldUseV2 = useCallback(
    (panelId: string) => {
      if (!isDrilldownV2Enabled) return false;
      const widget = dashboard?.widgets?.[panelId];
      return !!widget?.drilldown_v2;
    },
    [isDrilldownV2Enabled, dashboard?.widgets],
  );

  const handleWidgetDrillDown = useCallback(
    (panelId: string, metricValue?: unknown) => {
      if (shouldUseV2(panelId)) {
        // ``metricValue`` is set when the panel is a KPI tile — the
        // resolved numeric the tile rendered. Surfaced in the
        // breadcrumb's parenthesized suffix. Chart drill-icon clicks
        // pass undefined (no single value to drill into).
        drillV2.openPanelDrilldown(panelId, [], {}, metricValue);
        return;
      }
      openDrilldown(panelId);
    },
    [shouldUseV2, drillV2, openDrilldown],
  );

  const handlePointDrillDown = useCallback(
    (
      panelId: string,
      filters: Record<string, unknown>,
      metricValue?: unknown,
      metricLabel?: string,
      variantId?: string | null,
    ) => {
      if (shouldUseV2(panelId)) {
        // V2: column_path empty = default target; filters pass through as-is
        // (FE assumes the parent click handler already prefixed with the right
        // data_key convention — e.g. point.name, series.name). metricValue
        // carries the clicked point's numeric value (chart) or the clicked
        // cell's value (table); metricLabel carries the column label for
        // table sources so the breadcrumb shows "(Opp Count: 47)" — chart
        // sources leave it null since the axis is already in the segment's
        // main label. variantId routes table cell clicks to a specific L1
        // variant via panel.drilldown_v2.column_variant_map (e.g. clicking
        // "Won deals" opens the "won" variant); null = pick L1's default.
        drillV2.openPanelDrilldown(
          panelId,
          [],
          filters,
          metricValue,
          metricLabel,
          variantId,
        );
        return;
      }
      openPointDrilldown(panelId, filters);
    },
    [shouldUseV2, drillV2, openPointDrilldown],
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
        isFirstSave={isFirstSave}
        onRevert={handleRevert}
        revertPhase={revertPhase}
        onShare={handleShare}
        sharePhase={sharePhase}
        onChatClick={onChatClick}
        isChatOpen={isChatOpen}
        onEditModeChange={editModeMutation.mutate}
        editModePhase={editModePhase}
        onTablePageChange={handlePageChange}
        loadingTablePanels={loadingPanels}
        paginatedWidgets={mergedWidgets}
        onDrillDown={handleWidgetDrillDown}
        onPointDrillDown={handlePointDrillDown}
        onAddWidgetToChat={onAddWidgetToChat}
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
        isDrilldownOpen={isDrilldownOpen || drillV2.isOpen}
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
          dashboard.isOwner ? handleCommitPanelLock : undefined
        }
        canLockPanelFilter={canLockPanelFilter}
        lockedPanelFilterState={lockedPanelFilterState}
      />
      {/* Edit mode banner — floats above drilldown panel when both are active */}
      <EditModeBanner
        visible={dashboard.isEditable && (isDrilldownOpen || drillV2.isOpen)}
        className="absolute bottom-0 left-0 right-0 z-[51] pointer-events-none flex justify-center pb-4"
      />
      <DrilldownPanel
        isOpen={isDrilldownOpen}
        onClose={closeDrilldown}
        widgetTitle={
          drilldownTitle ||
          (drilldownPanelId && dashboard.widgets?.[drilldownPanelId]?.title) ||
          "Drilldown"
        }
        query={
          drilldownQuery ||
          (drilldownPanelId &&
            dashboard.widgets?.[drilldownPanelId]?.queryInfo?.sql) ||
          ""
        }
        data={drilldownData}
        pagination={drilldownPagination}
        isLoading={isDrilldownLoading}
        isError={isDrilldownError}
        onPageChange={changeDrilldownPage}
        onSortChange={changeDrilldownSort}
        sortState={drilldownSort}
      />
      {/* V2 drilldown panel — only mounted when the flag is on so v1-only
          users can never see V2 chrome. The handlers above won't open the
          drill state when the flag is off, but a conditional mount also
          keeps the bottom-sheet's hooks (react-query subscriptions, etc.)
          out of the v1 path entirely. */}
      {isDrilldownV2Enabled && (
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
        />
      )}
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
    ],
  );

  const handleRemovePendingWidget = useCallback(
    ({ id }: { id: string }) =>
      setPendingWidgetMentions((prev) => prev.filter((m) => m.id !== id)),
    [],
  );

  const handleAskVonClick = useCallback(() => {
    if (!isChatPanelOpen) openChatPanel();
    requestAnimationFrame(() => {
      chatSessionRef.current?.focus();
    });
  }, [isChatPanelOpen, openChatPanel]);

  const {
    widthCss: chatPaneWidth,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useResizablePane();

  return (
    <div className="flex h-full w-full gap-1.5">
      <div className="flex-1 min-w-0 h-full relative">
        {/* key={dashboardId} resets all dashboard-specific state on navigation */}
        <DashboardCanvas
          key={dashboardId}
          dashboardId={dashboardId}
          onChatClick={handleAskVonClick}
          isChatOpen={isChatPanelOpen}
          onAddWidgetToChat={handleAddWidgetToChat}
        />
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
            dashboardId={dashboardId}
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
