import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ArrowLineRightIcon, PlusIcon } from "@phosphor-icons/react";
import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { useAnalyticsTools } from "../hooks/useAnalyticsTools";
import { useTableServerPagination } from "../hooks/useTableServerPagination";
import { useDrilldown } from "../hooks/useDrilldown";
import { useDashboardUpdate } from "../hooks/useDashboardUpdate";
import { useResizablePane } from "../hooks/useResizablePane";
import {
  AnalyticsView,
  AnalyticsSkeleton,
  AnalyticsError,
} from "../components/Analytics";
import { Tooltip, useVisibilityToggle } from "@vonlabs/design-components";
import { DrilldownPanel } from "../components/Analytics/DrilldownPanel";
import { EditModeBanner } from "../components/Analytics/EditModeBanner";
import { ChatPicker } from "../components/Analytics/ChatPicker";
import { ConversationMoreMenu } from "../components/Analytics/ConversationMoreMenu";
import { ChatSession } from "../components/chat/ChatSession";
import { AnalyticsChatEmptyState } from "../components/AnalyticsChatEmptyState";
import { useDashboardRefreshEvents } from "../hooks/useDashboardRefreshEvents";
import { useDashboardSchedule } from "../hooks/useDashboardSchedule";
import { useGlobalChat } from "../providers/GlobalChat";
import { useChatSidebarV2 } from "../hooks/useChatSidebarV2";

interface DashboardCanvasProps {
  dashboardId: string;
  onChatClick: () => void;
  isChatOpen: boolean;
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
    pendingRows: filterPendingRows,
    activeCount: filterActiveCount,
    canApply: filterCanApply,
    isApplying: filterIsApplying,
    handleFilterChange,
    handleRemoveFilter,
    handleAddFilter,
    handleRemovePendingRow,
    handleCommitPendingRow,
    handleApply,
    handleClearAll,
  } = useDashboardFilters(
    dashboardId,
    dashboard?.filters?.definitions ?? [],
    activeFilters,
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
        filterPendingRows={filterPendingRows}
        filterActiveCount={filterActiveCount}
        filterCanApply={filterCanApply}
        filterIsApplying={filterIsApplying}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onAddFilter={handleAddFilter}
        onRemovePendingRow={handleRemovePendingRow}
        onCommitPendingRow={handleCommitPendingRow}
        onApplyFilters={handleApply}
        onClearAll={handleClearAll}
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
        onDrillDown={openDrilldown}
        onPointDrillDown={openPointDrilldown}
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
        isDrilldownOpen={isDrilldownOpen}
      />
      {/* Edit mode banner — floats above drilldown panel when both are active */}
      <EditModeBanner
        visible={dashboard.isEditable && isDrilldownOpen}
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

  // Read conversationId from query params (deep-link support: "View in Dashboard" CTA)
  const conversationIdFromParams = searchParams.get("conversationId");

  // Global chat state — persists across dashboard navigation
  const {
    activeChatId,
    setActiveChatId,
    isChatPanelOpen,
    openChatPanel,
    closeChatPanel,
  } = useGlobalChat();

  const { unfiledConversations } = useChatSidebarV2();

  // Select the most recent conversation each time the panel opens
  // (ref declared here so it's available before the effect below)
  const prevChatPanelOpenRef = useRef(false);

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

  const handleConversationCreated = useCallback(
    (conversationId: string) => {
      if (activeDashboardIdRef.current === dashboardId) {
        setCreatedConversationId(conversationId);
        setActiveChatId(conversationId);
      }
    },
    [dashboardId, setActiveChatId],
  );

  // Update refs on dashboard change and reset the local created-conversation
  // fallback (it's dashboard-specific). Don't touch activeChatId — the chat
  // panel should persist across dashboard navigation.
  useEffect(() => {
    activeDashboardIdRef.current = dashboardId;
    setCreatedConversationId(null);
  }, [dashboardId]);

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

  // Select the most recent conversation each time the panel opens.
  // Skips auto-selection when a deep link already set the active conversation.
  useEffect(() => {
    const justOpened = isChatPanelOpen && !prevChatPanelOpenRef.current;
    prevChatPanelOpenRef.current = isChatPanelOpen;

    if (!justOpened) return;

    if (conversationIdFromParams) return;

    if (unfiledConversations.length === 0) return;

    setActiveChatId(unfiledConversations[0].conversationId);
  }, [
    isChatPanelOpen,
    unfiledConversations,
    setActiveChatId,
    conversationIdFromParams,
  ]);

  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    setCreatedConversationId(null);
  }, [setActiveChatId]);

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
          onChatClick={openChatPanel}
          isChatOpen={isChatPanelOpen}
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
            key={conversationId ?? `new-${dashboardId}`}
            conversationId={conversationId}
            compact
            placeholder="Ask questions or make changes..."
            dashboardId={dashboardId}
            dashboardTitle={dashboardTitle}
            dashboardVersion={dashboardVersion}
            onCreated={handleConversationCreated}
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
