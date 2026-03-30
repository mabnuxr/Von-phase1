import { useState, useMemo, useCallback } from "react";
import type { MentionItem } from "@vonlabs/design-components";
import { MentionItemType } from "@vonlabs/design-components";

import { useDashboardList } from "./useDashboardList";
import { useFeatureFlag } from "./useFeatureFlag";

export function useChatMentions() {
  const { isDeepResearchEnabled } = useFeatureFlag();

  const [mentionsActivated, setMentionsActivated] = useState(false);
  const { data: dashboardListData, isLoading: isLoadingMentions } =
    useDashboardList(mentionsActivated);

  const mentionItems: MentionItem[] = useMemo(
    () =>
      dashboardListData?.data.map((d) => ({
        id: d.dashboard_id,
        name: d.dashboard_name,
        type: MentionItemType.Dashboard,
        version: d.dashboard_version,
      })) ?? [],
    [dashboardListData],
  );

  const enableMentions = isDeepResearchEnabled;

  const onMentionsActivated = useCallback(() => setMentionsActivated(true), []);

  return {
    enableMentions,
    mentionItems,
    isLoadingMentions,
    onMentionsActivated,
  };
}
