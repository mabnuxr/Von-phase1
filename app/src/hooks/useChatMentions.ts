import { useState, useMemo, useCallback } from "react";
import type { MentionItem } from "@vonlabs/design-components";
import { MentionItemType } from "@vonlabs/design-components";

import { useDashboardList } from "./useDashboardList";
import { useAiFields } from "./useVonAiFields";

export function useChatMentions() {
  const [mentionsActivated, setMentionsActivated] = useState(false);
  const { data: dashboardListData, isLoading: isLoadingDashboards } =
    useDashboardList(mentionsActivated);
  const { data: aiFieldsData, isLoading: isLoadingAiFields } = useAiFields(
    "live",
    1,
    50,
    mentionsActivated,
  );

  const mentionItems: MentionItem[] = useMemo(() => {
    const dashboards: MentionItem[] =
      dashboardListData?.data.map((d) => ({
        id: d.dashboard_id,
        name: d.dashboard_name,
        type: MentionItemType.Dashboard,
        version: d.dashboard_version,
      })) ?? [];

    const aiFields: MentionItem[] = aiFieldsData?.data
      ? aiFieldsData.data.map((f) => ({
          id: f.fieldId,
          name: f.displayName ?? f.name,
          type: MentionItemType.AiField,
          version: 0,
          aiFieldContext: { aiFieldId: f.fieldId },
        }))
      : [];

    if (import.meta.env.DEV) {
      console.log(
        "[useChatMentions] dashboards:",
        dashboards.length,
        "aiFields:",
        aiFields.length,
        "data:",
        !!aiFieldsData,
      );
    }
    return [...dashboards, ...aiFields];
  }, [dashboardListData, aiFieldsData]);

  const onMentionsActivated = useCallback(() => setMentionsActivated(true), []);

  return {
    mentionItems,
    isLoadingMentions: isLoadingDashboards || isLoadingAiFields,
    onMentionsActivated,
  };
}
