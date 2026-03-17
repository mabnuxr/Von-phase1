import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { ConversationMode } from "@vonlabs/design-components";
import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useAnalyticsTools } from "../hooks/useAnalyticsTools";
import { useAppShell } from "../hooks/useAppShell";
import { useVisibilityToggle } from "@vonlabs/design-components";
import { useResizablePane } from "../hooks/useResizablePane";
import {
  AnalyticsView,
  AnalyticsSkeleton,
  AnalyticsError,
} from "../components/Analytics";
import { AnalyticsChatContainer } from "../components/AnalyticsChatContainer";
import { useDashboardRefreshEvents } from "../hooks/useDashboardRefreshEvents";
import { conversationsService } from "../services/conversationsService";

const Analytics = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>() as {
    dashboardId: string;
  };
  const [searchParams] = useSearchParams();

  // Read conversationId from query params
  const conversationIdFromParams = searchParams.get("conversationId");

  // Tracks the dashboardId at the time each mutation fires so onSuccess can
  // discard results that belong to a dashboard the user has already left.
  const currentDashboardIdRef = useRef(dashboardId);
  currentDashboardIdRef.current = dashboardId;

  const [createdConversationId, setCreatedConversationId] = useState<
    string | null
  >(null);

  const {
    mutate: createConversation,
    reset: resetConversation,
    isPending: isCreatingConversation,
    isError: conversationCreateFailed,
  } = useMutation({
    mutationFn: ({ title, forDashboardId }: { title: string; forDashboardId: string }) =>
      conversationsService.createConversation(
        title,
        ConversationMode.DashboardBuilder,
        "v2",
      ).then((res) => ({ res, forDashboardId })),
    onSuccess: ({ res, forDashboardId }) => {
      if (forDashboardId !== currentDashboardIdRef.current) return;
      setCreatedConversationId(res.conversation.conversationId);
    },
    onError: (err) => {
      console.error("[Analytics] Failed to create conversation:", err);
    },
  });

  const {
    isVisible: isChatOpen,
    show: openChat,
    hide: closeChat,
  } = useVisibilityToggle();

  const conversationId = conversationIdFromParams ?? createdConversationId;

  const { data, isLoading, error } = useDashboardQuery(dashboardId);
  const {
    handleSave,
    savePhase,
    handleRevert,
    handleShare,
    sharePhase,
    handleRefresh,
  } = useAnalyticsTools(dashboardId);

  const dashboard = data?.dashboard ?? null;
  const refreshInfo = data?.refreshInfo ?? null;
  const activeFilters = data?.activeFilters ?? {};
  const {
    widthCss: chatPaneWidth,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useResizablePane();
  const { collapseSidebar } = useAppShell();

  // Subscribe to Pusher events for dashboard refresh notifications
  useDashboardRefreshEvents(dashboardId);

  // Collapse left sidebar on mount
  useEffect(() => {
    collapseSidebar();
  }, [collapseSidebar]);

  // Reset mutation state when navigating to a different dashboard
  useEffect(() => {
    setCreatedConversationId(null);
    resetConversation();
  }, [dashboardId, resetConversation]);

  // Auto-create a DashboardBuilder conversation when no conversationId is provided
  useEffect(() => {
    if (
      conversationIdFromParams ||
      createdConversationId ||
      isCreatingConversation ||
      conversationCreateFailed ||
      !dashboard ||
      !isChatOpen
    )
      return;

    createConversation({ title: dashboard.title, forDashboardId: dashboardId });
  }, [
    conversationIdFromParams,
    createdConversationId,
    isCreatingConversation,
    conversationCreateFailed,
    dashboard,
    dashboardId,
    isChatOpen,
    createConversation,
  ]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !dashboard) {
    return <AnalyticsError error={error?.message ?? null} />;
  }

  return (
    <div className="flex h-full w-full gap-1">
      <div className="flex-1 min-w-0">
        <AnalyticsView
          dashboard={dashboard}
          refreshInfo={refreshInfo}
          activeFilters={activeFilters}
          onRefresh={handleRefresh}
          onSave={handleSave}
          savePhase={savePhase}
          onRevert={handleRevert}
          onShare={handleShare}
          sharePhase={sharePhase}
          onChatClick={openChat}
          isChatOpen={isChatOpen}
          onClose={isChatOpen ? closeChat : undefined}
        />
      </div>

      {isChatOpen && (
        <div
          style={{
            width: chatPaneWidth,
            transition: isResizing ? "none" : "width 0.3s ease",
            flexShrink: 0,
            position: "relative",
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

          {conversationId ? (
            <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
              <AnalyticsChatContainer
                conversationId={conversationId}
                dashboardId={dashboardId!}
                dashboardTitle={dashboard.title}
                dashboardVersion={dashboard.dashboardVersion}
              />
            </div>
          ) : conversationCreateFailed ? (
            <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-gray-500">
                Failed to start conversation.
              </p>
              <button
                className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                onClick={resetConversation}
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs flex items-center justify-center">
              <p className="text-sm text-gray-400">Starting conversation...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
