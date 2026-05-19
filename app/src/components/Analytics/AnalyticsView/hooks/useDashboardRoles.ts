import { useCreatorName } from "../../../../hooks/useCreatorName";
import type { Dashboard } from "../../../../types/dashboard";

export function useDashboardRoles(dashboard: Dashboard) {
  const isDashboardOwner = dashboard.accessLevel === "owner";
  // Editors share the owner's edit affordances per BE M2's editor+ rule.
  // Strictly owner-only actions (transfer, delete) stay gated by `isDashboardOwner`.
  const canEditDashboard =
    dashboard.accessLevel === "owner" || dashboard.accessLevel === "editor";

  const { name: creatorName, isLoading: isCreatorLoading } = useCreatorName({
    isOwner: isDashboardOwner,
    createdBy: dashboard.createdBy,
    createdByName: dashboard.createdByName,
  });

  return {
    isDashboardOwner,
    canEditDashboard,
    creatorName,
    isCreatorLoading,
  };
}
