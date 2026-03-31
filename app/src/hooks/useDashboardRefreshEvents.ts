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

const MIN_REFRESH_DISPLAY_MS = 2000;

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

    let minDisplayTimer: ReturnType<typeof setTimeout> | null = null;

    const handleRefreshStarted = (data: DashboardRefreshStartedEvent) => {
      if (data.dashboardId !== dashboardId) {
        return;
      }

      setIsRefreshing(true);
      if (minDisplayTimer) clearTimeout(minDisplayTimer);

      showToast({
        message:
          "Dashboard refresh started, widgets will be refreshed automatically once its complete.",
        variant: "info",
      });
    };

    const handleRefreshCompleted = (data: DashboardRefreshCompletedEvent) => {
      if (data.dashboardId !== dashboardId) {
        return;
      }

      showToast({
        message: data.success
          ? "Dashboard refresh complete! Your dashboard data has been updated."
          : "Dashboard refresh failed. Please try again.",
        variant: data.success ? "success" : "error",
      });

      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });

      // Hold the refreshing state for a minimum duration so the user sees
      // the loading skeleton before new data appears
      minDisplayTimer = setTimeout(
        () => setIsRefreshing(false),
        MIN_REFRESH_DISPLAY_MS,
      );
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
      if (minDisplayTimer) clearTimeout(minDisplayTimer);
    };
  }, [userChannel, showToast, dashboardId, queryClient]);

  return { isRefreshing };
}
