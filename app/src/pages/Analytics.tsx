import { useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDashboardQuery,
  useRefreshDashboardMutation,
  dashboardKeys,
} from "../hooks/useDashboardQuery";
import { useResizablePane } from "../hooks/useResizablePane";
import { useAppShell } from "../hooks/useAppShell";
import {
  AnalyticsView,
  AnalyticsSkeleton,
  AnalyticsError,
} from "../components/Analytics";
import { AnalyticsChatContainer } from "../components/AnalyticsChatContainer";
import { useUserPusherChannel } from "../hooks/useUserPusherChannel";
import { useUser } from "../hooks/useUser";
import { useToast } from "../hooks/useToast";
import {
  UserChannelEvents,
  type DashboardRefreshStartedEvent,
  type DashboardRefreshCompletedEvent,
} from "../types/userChannelEvents";

const Analytics = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const location = useLocation();
  const conversationId =
    (location.state as { conversationId?: string } | null)?.conversationId ??
    null;
  const { data, isLoading, error } = useDashboardQuery(dashboardId);
  const refreshMutation = useRefreshDashboardMutation(dashboardId);

  const dashboard = data?.dashboard ?? null;
  const refreshInfo = data?.refreshInfo ?? null;
  const activeFilters = data?.activeFilters ?? {};
  const { collapseSidebar } = useAppShell();
  const {
    width: chatPaneWidth,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useResizablePane();

  const { mutateAsync: refreshAsync } = refreshMutation;
  const handleRefresh = useCallback(async () => {
    try {
      await refreshAsync();
    } catch (error) {
      console.error("[Analytics] Refresh failed:", error);
    }
  }, [refreshAsync]);

  // Pusher setup for dashboard refresh notifications
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { showToast } = useToast();
  const { channel: userChannel } = useUserPusherChannel({
    tenantId: user?.tenantId,
    userId: user?.id,
  });

  // Track timeout for cleanup
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to dashboard refresh events
  useEffect(() => {
    if (!userChannel) {
      return;
    }

    const handleRefreshStarted = (data: DashboardRefreshStartedEvent) => {
      // Only handle events for the currently viewed dashboard
      if (data.dashboardId !== dashboardId) {
        return;
      }

      showToast({
        message:
          "Dashboard refresh started, widgets will be refreshed automatically once its complete.",
        variant: "info",
      });
    };

    const handleRefreshCompleted = (data: DashboardRefreshCompletedEvent) => {
      // Only handle events for the currently viewed dashboard
      if (data.dashboardId !== dashboardId) {
        return;
      }

      if (data.success) {
        showToast({
          message:
            "Dashboard refresh complete! Your dashboard data has been updated.",
          variant: "success",
        });

        // Invalidate React Query cache to refetch dashboard data
        refreshTimeoutRef.current = setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: dashboardKeys.detail(dashboardId),
          });
        }, 1000);
      } else {
        showToast({
          message: "Dashboard refresh failed. Please try again.",
          variant: "error",
        });
      }
    };

    userChannel.bind(
      UserChannelEvents.DASHBOARD_REFRESH_STARTED,
      handleRefreshStarted,
    );
    userChannel.bind(
      UserChannelEvents.DASHBOARD_REFRESH_COMPLETED,
      handleRefreshCompleted,
    );

    return () => {
      // Clear any pending refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      userChannel.unbind(
        UserChannelEvents.DASHBOARD_REFRESH_STARTED,
        handleRefreshStarted,
      );
      userChannel.unbind(
        UserChannelEvents.DASHBOARD_REFRESH_COMPLETED,
        handleRefreshCompleted,
      );
    };
  }, [userChannel, showToast, dashboardId, queryClient]);

  // Collapse left sidebar on mount
  useEffect(() => {
    collapseSidebar();
  }, [collapseSidebar]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !dashboard) {
    return <AnalyticsError error={error?.message ?? null} />;
  }

  return (
    <div className="flex h-full w-full gap-2">
      {/* Dashboard content */}
      <div className="flex-1 min-w-0">
        <AnalyticsView
          dashboard={dashboard}
          refreshInfo={refreshInfo}
          activeFilters={activeFilters}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Chat pane */}
      <div
        style={{
          width: `${chatPaneWidth}px`,
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
              dashboardTitle={dashboard.title}
            />
          </div>
        ) : (
          <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs flex items-center justify-center">
            <p className="text-sm text-gray-400">
              No conversation context available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
