import { useCallback, useMemo } from "react";
import { useVisibilityToggle } from "@vonlabs/design-components";
import { useDashboardMetadata } from "../../../../hooks/useDashboardMetadata";
import type {
  DashboardUserGrantRequest,
  ShareDashboardV2Request,
} from "../../../../services/dashboardService";
import type {
  Dashboard,
  DashboardUserGrant,
} from "../../../../types/dashboard";
import type { TeamMember } from "../../../../services/teamService";
import type {
  DashboardScopeV2,
  DataScopeOptionV2,
  DirectoryPersonV2,
  GrantableRoleV2,
  ShareDialogPersonV2,
} from "../ShareDashboardDialogV2";
import { buildSharePayload } from "../utils/sharePayload";

interface UseDashboardShareV2Args {
  dashboard: Dashboard;
  onShareV2?: (payload: ShareDashboardV2Request) => void;
  teamMembers: TeamMember[] | undefined;
  currentUserId: string | undefined;
  isDashboardCollabEnabled: boolean;
}

export function useDashboardShareV2({
  dashboard,
  onShareV2,
  teamMembers,
  currentUserId,
  isDashboardCollabEnabled,
}: UseDashboardShareV2Args) {
  // Sharing state is sourced from the on-demand `GET /metadata` query
  // when the dialog is open — every open re-reads authoritative scope/grants
  // instead of relying on the render cache, which can drift if another
  // collaborator changed access.
  const {
    isVisible: isShareDialogOpen,
    show: openShareDialog,
    hide: closeShareDialog,
  } = useVisibilityToggle();
  const setIsShareDialogOpen = useCallback(
    (open: boolean) => {
      if (open) openShareDialog();
      else closeShareDialog();
    },
    [openShareDialog, closeShareDialog],
  );

  const { data: shareMetadata } = useDashboardMetadata(dashboard.id, {
    enabled: isShareDialogOpen && isDashboardCollabEnabled,
    forceFresh: true,
  });

  const dataScopingAvailable =
    dashboard.data_sources?.some((s) => s.type === "salesforce") ?? false;

  const currentScope: "restricted" | "tenant" =
    shareMetadata?.scope ??
    dashboard.scope ??
    (dashboard.isSharedWithTenant ? "tenant" : "restricted");

  const currentUserGrants: DashboardUserGrant[] = useMemo(
    () => shareMetadata?.user_grants ?? dashboard.userGrants ?? [],
    [shareMetadata?.user_grants, dashboard.userGrants],
  );

  // `shared_data_scope` legitimately carries `null` (== "no data scoping").
  // `??` would fall through to the render cache's value in that case and
  // misleadingly read as ON. Switch to metadata unconditionally once loaded.
  const currentSharedDataScope = shareMetadata
    ? shareMetadata.shared_data_scope
    : (dashboard.sharedDataScope ?? null);

  const currentAccessLevel =
    shareMetadata?.access_level ?? dashboard.accessLevel ?? "viewer";

  const ownerUserId = shareMetadata?.created_by ?? dashboard.createdBy;

  // Directory excludes the dashboard owner (backend rejects with
  // `cannot_grant_to_owner`) and inactive members.
  const directory = useMemo<DirectoryPersonV2[]>(
    () =>
      (teamMembers ?? [])
        .filter((m) => m.isActive && m.id !== ownerUserId)
        .map((m) => ({
          userId: m.id,
          name: `${m.firstName} ${m.lastName}`.trim() || m.email,
          email: m.email,
        })),
    [teamMembers, ownerUserId],
  );

  // People list shown in the dialog body — explicit grants only. Owner is
  // implicit (covered by ownership) and intentionally hidden here.
  const grants = useMemo<ShareDialogPersonV2[]>(() => {
    return currentUserGrants.map((grant) => {
      const member = teamMembers?.find((m) => m.id === grant.user_id);
      const displayName = member
        ? `${member.firstName} ${member.lastName}`.trim() || member.email
        : grant.user_id;
      return {
        userId: grant.user_id,
        name: displayName,
        email: member?.email ?? "",
        role: grant.role,
        isYou: grant.user_id === currentUserId,
      };
    });
  }, [currentUserGrants, teamMembers, currentUserId]);

  const payloadFrom = useCallback(
    (overrides: Partial<ShareDashboardV2Request>): ShareDashboardV2Request =>
      buildSharePayload({
        currentScope,
        currentUserGrants,
        currentSharedDataScope,
        overrides,
      }),
    [currentScope, currentUserGrants, currentSharedDataScope],
  );

  const handleScopeChange = useCallback(
    (nextScope: DashboardScopeV2) => {
      onShareV2?.(
        payloadFrom({ is_shared_with_tenant: nextScope === "org_wide" }),
      );
    },
    [onShareV2, payloadFrom],
  );

  const handleDataScopeChange = useCallback(
    (next: DataScopeOptionV2 | null) => {
      onShareV2?.(payloadFrom({ shared_data_scope: next }));
    },
    [onShareV2, payloadFrom],
  );

  const handleGrantAdd = useCallback(
    (
      userIds: string[],
      role: GrantableRoleV2,
      dataScope: DataScopeOptionV2 | null,
    ) => {
      // Merge new grants; if a user already has one, the new role wins.
      const merged = new Map<string, DashboardUserGrantRequest>();
      for (const g of currentUserGrants) {
        merged.set(g.user_id, { user_id: g.user_id, role: g.role });
      }
      for (const id of userIds) {
        merged.set(id, { user_id: id, role });
      }
      onShareV2?.(
        payloadFrom({
          user_grants: Array.from(merged.values()),
          // Add-people view's data-scope toggle is meaningful only when the
          // batch role is "viewer"; for editor batches we don't touch it.
          ...(role === "viewer" ? { shared_data_scope: dataScope } : {}),
        }),
      );
    },
    [onShareV2, payloadFrom, currentUserGrants],
  );

  const handleGrantUpdate = useCallback(
    (userId: string, role: GrantableRoleV2) => {
      onShareV2?.(
        payloadFrom({
          user_grants: currentUserGrants.map((g) =>
            g.user_id === userId
              ? { user_id: g.user_id, role }
              : { user_id: g.user_id, role: g.role },
          ),
        }),
      );
    },
    [onShareV2, payloadFrom, currentUserGrants],
  );

  const handleGrantRemove = useCallback(
    (userId: string) => {
      onShareV2?.(
        payloadFrom({
          user_grants: currentUserGrants
            .filter((g) => g.user_id !== userId)
            .map((g) => ({ user_id: g.user_id, role: g.role })),
        }),
      );
    },
    [onShareV2, payloadFrom, currentUserGrants],
  );

  // Split return: derived `shareState` (changes when the dialog refetches —
  // grants, scope, data-scope) is kept separate from `shareActions` (stable
  // handler refs). Bundling them would make `AnalyticsToolbarActions`
  // re-render whenever the dialog reopens and refetches metadata. The shell
  // reads `currentScope` directly via destructuring so it doesn't carry the
  // full state object either.
  const shareState = useMemo(
    () => ({
      dataScopingAvailable,
      currentScope,
      currentSharedDataScope,
      currentAccessLevel,
      directory,
      grants,
    }),
    [
      dataScopingAvailable,
      currentScope,
      currentSharedDataScope,
      currentAccessLevel,
      directory,
      grants,
    ],
  );

  const shareActions = useMemo(
    () => ({
      setIsShareDialogOpen,
      handleScopeChange,
      handleDataScopeChange,
      handleGrantAdd,
      handleGrantUpdate,
      handleGrantRemove,
    }),
    [
      setIsShareDialogOpen,
      handleScopeChange,
      handleDataScopeChange,
      handleGrantAdd,
      handleGrantUpdate,
      handleGrantRemove,
    ],
  );

  return { shareState, shareActions };
}

export type DashboardShareState = ReturnType<
  typeof useDashboardShareV2
>["shareState"];
export type DashboardShareActions = ReturnType<
  typeof useDashboardShareV2
>["shareActions"];
