import { useCallback, useMemo, useState } from "react";
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
import type { User } from "../../../../services";
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
  /**
   * Dispatch the unified share mutation. Returns a promise that
   * resolves on a successful response and rejects on any error. The
   * dialog awaits this on the Add-People submit so it can close on
   * success and stay open on error — relying on the derived
   * "success" phase alone has a one-render lag that misses the
   * transition cleanly.
   */
  onShareV2?: (payload: ShareDashboardV2Request) => Promise<void>;
  teamMembers: TeamMember[] | undefined;
  currentUserId: string | undefined;
  /**
   * Full current-user record from `useUser`. Used to resolve the
   * caller's own row immediately without waiting for the team-members
   * query — that query can lag the dialog open by a few hundred ms,
   * which otherwise flashes the raw user id in place of the name.
   */
  currentUser?: User | null;
  isDashboardCollabEnabled: boolean;
}

export function useDashboardShareV2({
  dashboard,
  onShareV2,
  teamMembers,
  currentUserId,
  currentUser,
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

  // Drives the in-modal success pill's copy. Each handler stamps a
  // label before dispatching the share mutation; the dialog reads it
  // when `shareV2Phase` transitions to "success". Remove gets its own
  // line so the cue matches the action ("Removed access" vs the
  // generic "Access updated" used for scope toggles, grant adds, and
  // grant updates).
  const [lastSaveLabel, setLastSaveLabel] = useState<string>("Access updated");

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

  // People list shown in the dialog body — synthesises an owner row
  // from `created_by` so attribution is always visible at the top of
  // the list (the dialog's `sortedGrants` pins `role === "owner"` to
  // the first slot). Any stray explicit grant for the owner is
  // filtered out: BE rejects new grants on the creator
  // (`cannot_grant_to_owner`), but legacy data can still carry one
  // and would otherwise render the owner twice.
  const grants = useMemo<ShareDialogPersonV2[]>(() => {
    // Three paths to a display name for a given userId, in order:
    //   1. If it's the current viewer — read straight from the user
    //      record we already hold. No teamMembers query needed, so
    //      the caller's own row never flashes the raw id.
    //   2. If teamMembers is still loading (`undefined`) — return
    //      empty strings so the row renders as "avatar skeleton +
    //      empty name" until the query resolves. The Avatar pulses
    //      to signal the loading state.
    //   3. Otherwise teamMembers has resolved. Look up the grant's
    //      user — if it's missing (deleted teammate, cross-tenant
    //      external user, stale grant), surface "Unknown user" so
    //      the row reads as a stable resolved state rather than a
    //      forever-pulsing skeleton.
    const resolveDisplay = (
      userId: string,
    ): { name: string; email: string } => {
      if (currentUser && currentUser.id === userId) {
        const full =
          `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim();
        return {
          name: full || currentUser.name || currentUser.email,
          email: currentUser.email,
        };
      }
      if (!teamMembers) return { name: "", email: "" };
      const member = teamMembers.find((m) => m.id === userId);
      if (!member) return { name: "Unknown user", email: "" };
      return {
        name: `${member.firstName} ${member.lastName}`.trim() || member.email,
        email: member.email,
      };
    };

    const ownerRow: ShareDialogPersonV2 | null = ownerUserId
      ? {
          userId: ownerUserId,
          ...resolveDisplay(ownerUserId),
          role: "owner",
          isYou: ownerUserId === currentUserId,
        }
      : null;

    const explicitRows: ShareDialogPersonV2[] = currentUserGrants
      .filter((grant) => grant.user_id !== ownerUserId)
      .map((grant) => ({
        userId: grant.user_id,
        ...resolveDisplay(grant.user_id),
        role: grant.role,
        isYou: grant.user_id === currentUserId,
      }));

    return ownerRow ? [ownerRow, ...explicitRows] : explicitRows;
  }, [currentUserGrants, teamMembers, currentUserId, currentUser, ownerUserId]);

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
    async (nextScope: DashboardScopeV2): Promise<void> => {
      setLastSaveLabel("Access updated");
      await onShareV2?.(
        payloadFrom({ is_shared_with_tenant: nextScope === "org_wide" }),
      );
    },
    [onShareV2, payloadFrom],
  );

  const handleDataScopeChange = useCallback(
    async (next: DataScopeOptionV2 | null): Promise<void> => {
      setLastSaveLabel("Access updated");
      await onShareV2?.(payloadFrom({ shared_data_scope: next }));
    },
    [onShareV2, payloadFrom],
  );

  const handleGrantAdd = useCallback(
    async (
      userIds: string[],
      role: GrantableRoleV2,
      dataScope: DataScopeOptionV2 | null,
    ): Promise<void> => {
      setLastSaveLabel("Access updated");
      // Merge new grants; if a user already has one, the new role wins.
      const merged = new Map<string, DashboardUserGrantRequest>();
      for (const g of currentUserGrants) {
        merged.set(g.user_id, { user_id: g.user_id, role: g.role });
      }
      for (const id of userIds) {
        merged.set(id, { user_id: id, role });
      }
      await onShareV2?.(
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
    async (userId: string, role: GrantableRoleV2): Promise<void> => {
      setLastSaveLabel("Access updated");
      await onShareV2?.(
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
    async (userId: string): Promise<void> => {
      setLastSaveLabel("Removed access");
      await onShareV2?.(
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
      lastSaveLabel,
    }),
    [
      dataScopingAvailable,
      currentScope,
      currentSharedDataScope,
      currentAccessLevel,
      directory,
      grants,
      lastSaveLabel,
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
