import { useEffect } from "react";
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

export function useDashboardRefreshEvents(dashboardId: string) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { showToast } = useToast();
  const { channel: userChannel } = useUserPusherChannel({
    tenantId: user?.tenantId,
    userId: user?.id,
  });

  useEffect(() => {
    if (!userChannel) {
      return;
    }

    const handleRefreshStarted = (data: DashboardRefreshStartedEvent) => {
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
      if (data.dashboardId !== dashboardId) {
        return;
      }

      if (data.success) {
        showToast({
          message:
            "Dashboard refresh complete! Your dashboard data has been updated.",
          variant: "success",
        });

        queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(dashboardId),
        });
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
}
