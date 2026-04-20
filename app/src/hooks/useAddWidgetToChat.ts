import { useCallback } from "react";
import type { WidgetAddToChatPayload } from "@vonlabs/design-components";
import type { Dashboard } from "../types/dashboard";
import { useWidgetMentionsStore } from "../store/widgetMentionsStore";
import { buildWidgetMention } from "../lib/widgetMentionUtils";

/**
 * Returns a handler that pushes a widget-mention chip into the chat for the
 * active conversation. No-op when there's no conversation or no dashboard
 * (widget refs require parent dashboard identity — see UI-contract.md).
 */
export function useAddWidgetToChat(
  conversationId: string | null,
  dashboard: Dashboard | null,
) {
  const addWidgetMention = useWidgetMentionsStore((s) => s.add);
  return useCallback(
    (widget: WidgetAddToChatPayload) => {
      if (!conversationId || !dashboard) return;
      addWidgetMention(
        conversationId,
        buildWidgetMention(widget, {
          dashboardId: dashboard.id,
          dashboardVersion: dashboard.dashboardVersion,
          dashboardName: dashboard.title,
        }),
      );
    },
    [addWidgetMention, conversationId, dashboard],
  );
}
