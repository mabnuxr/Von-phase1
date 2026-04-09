import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "./useDashboardQuery";
import { useUserPusherChannel } from "./useUserPusherChannel";
import { useUser } from "./useUser";
import { useToast } from "./useToast";
import {
  UserChannelEvents,
  type DashboardRefreshStartedEvent,
  type DashboardRefreshCompletedEvent,
} from "../types/userChannelEvents";

const REFRESH_SAFETY_TIMEOUT_MS = 60_000;

export function useDashboardRefreshEvents(dashboardId: string) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { showToast } = useToast();
  const { channel: userChannel } = useUserPusherChannel({
    tenantId: user?.tenantId,
    userId: user?.id,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!userChannel) {
      return;
    }

    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const handleRefreshStarted = (data: DashboardRefreshStartedEvent) => {
      if (data.dashboardId !== dashboardId) {
        return;
      }

      setIsRefreshing(true);

      // Safety: if REFRESH_COMPLETED never fires, clear after timeout
      if (safetyTimer) clearTimeout(safetyTimer);
      safetyTimer = setTimeout(
        () => setIsRefreshing(false),
        REFRESH_SAFETY_TIMEOUT_MS,
      );
    };

    const handleRefreshCompleted = (data: DashboardRefreshCompletedEvent) => {
      if (data.dashboardId !== dashboardId) {
        return;
      }

      if (!data.success) {
        showToast({
          message: "Dashboard refresh failed. Please try again.",
          variant: "error",
        });
      }

      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });

      // Clear the safety timer since we got the completed event
      if (safetyTimer) clearTimeout(safetyTimer);
      safetyTimer = null;

      setIsRefreshing(false);
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
      userChannel.unbind(
        UserChannelEvents.DASHBOARD_REFRESH_STARTED,
        handleRefreshStarted,
      );
      userChannel.unbind(
        UserChannelEvents.DASHBOARD_REFRESH_COMPLETED,
        handleRefreshCompleted,
      );
      if (safetyTimer) clearTimeout(safetyTimer);
      // Reset on cleanup (dashboardId change or unmount) so the loading
      // state doesn't stay stuck when navigating to a different dashboard
      setIsRefreshing(false);
    };
  }, [userChannel, showToast, dashboardId, queryClient]);

  return { isRefreshing };
}
