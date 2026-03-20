import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
import { AnalyticsNewConversationContainer } from "../components/AnalyticsNewConversationContainer";
import { useDashboardRefreshEvents } from "../hooks/useDashboardRefreshEvents";

const Analytics = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>() as {
    dashboardId: string;
  };
  const [searchParams] = useSearchParams();

  // Read conversationId from query params (deep-link support)
  const conversationIdFromParams = searchParams.get("conversationId");

  // Conversation created after the user sends their first message
  const [createdConversationId, setCreatedConversationId] = useState<
    string | null
  >(null);
  // Track which dashboardId was active when the create was initiated so that
  // an in-flight response from a previous dashboard doesn't overwrite state
  // after the user has navigated to a different dashboard.
  const activeDashboardIdRef = useRef(dashboardId);
  const handleConversationCreated = useCallback(
    (conversationId: string) => {
      if (activeDashboardIdRef.current === dashboardId) {
        setCreatedConversationId(conversationId);
      }
    },
    [dashboardId],
  );

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

  // Reset local conversation when navigating to a different dashboard
  useEffect(() => {
    activeDashboardIdRef.current = dashboardId;
    setCreatedConversationId(null);
  }, [dashboardId]);

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
          onChatClose={closeChat}
          isChatOpen={isChatOpen}
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

          <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            {conversationId ? (
              <AnalyticsChatContainer
                key={conversationId}
                conversationId={conversationId}
                dashboardId={dashboardId}
                dashboardTitle={dashboard.title}
                dashboardVersion={dashboard.dashboardVersion}
              />
            ) : (
              <AnalyticsNewConversationContainer
                key={dashboardId}
                dashboardId={dashboardId}
                dashboardTitle={dashboard.title}
                dashboardVersion={dashboard.dashboardVersion}
                onCreated={handleConversationCreated}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
