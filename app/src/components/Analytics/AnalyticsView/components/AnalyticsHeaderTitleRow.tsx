import { InfoIcon } from "@phosphor-icons/react";
import { Tooltip } from "@vonlabs/design-components";
import { StatusLine } from "../StatusLine";
import { EditLockBadge } from "../EditLockBadge";
import { VersionPreviewChip } from "./VersionPreviewChip";
import type { TeamMember } from "../../../../services/teamService";
import type { Dashboard, RefreshInfo } from "../../../../types/dashboard";
import type { InlineRename } from "../hooks/useInlineRename";

interface AnalyticsHeaderTitleRowProps {
  dashboard: Dashboard;
  refreshInfo: RefreshInfo | null;
  isEditMode: boolean;
  isVersionPreview: boolean;
  isRefetchingData: boolean | undefined;
  isRefreshing: boolean | undefined;
  isDashboardOwner: boolean;
  canEditDashboard: boolean;
  isDashboardCollabEnabled: boolean;
  onRename?: (newName: string) => void;
  onOpenVersionHistory?: () => void;
  currentUserId: string | undefined;
  teamMembers: TeamMember[] | undefined;
  latestPublishedVersion: number | null;
  rename: InlineRename;
}

export function AnalyticsHeaderTitleRow({
  dashboard,
  refreshInfo,
  isEditMode,
  isVersionPreview,
  isRefetchingData,
  isRefreshing,
  isDashboardOwner,
  canEditDashboard,
  isDashboardCollabEnabled,
  onRename,
  onOpenVersionHistory,
  currentUserId,
  teamMembers,
  latestPublishedVersion,
  rename,
}: AnalyticsHeaderTitleRowProps) {
  const {
    isRenaming,
    editValue,
    setEditValue,
    renameWidth,
    inputRef,
    titleRef,
    startRename,
    commitRename,
    cancelRename,
  } = rename;

  const canStartRename = isDashboardOwner && !!onRename;

  return (
    <>
      <div className="min-w-0">
        {isRenaming ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") cancelRename();
            }}
            style={renameWidth != null ? { width: renameWidth } : undefined}
            className="text-base font-semibold text-gray-900 bg-transparent border border-gray-300 rounded-lg px-1.5 py-0.5 outline-none focus:border-gray-400"
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <h1
              ref={titleRef}
              className={`text-base font-semibold text-gray-900 truncate ${
                canStartRename ? "cursor-pointer" : ""
              }`}
              onDoubleClick={canStartRename ? startRename : undefined}
            >
              {dashboard.title}
            </h1>
            {dashboard.description && (
              <Tooltip
                content={
                  <span className="block max-w-[240px] whitespace-normal">
                    {dashboard.description}
                  </span>
                }
              >
                <button className="text-gray-700 hover:text-gray-600 transition-colors">
                  <InfoIcon size={16} />
                </button>
              </Tooltip>
            )}
            {/* Edit-lock badge — editor+ only, and hidden in version-history
                preview mode. The "who's editing" hint refers to the live
                dashboard, not the historical snapshot the user is currently
                viewing — surfacing it during preview would misleadingly imply
                the displayed version is being edited. Viewers also don't see
                it (no Edit affordance → no useful signal). */}
            {isDashboardCollabEnabled &&
              canEditDashboard &&
              isEditMode &&
              !isVersionPreview &&
              dashboard.editLock && (
                <EditLockBadge
                  editLock={dashboard.editLock}
                  currentUserId={currentUserId}
                  teamMembers={teamMembers}
                  lastEditedBy={dashboard.lastEditedBy}
                  lastEditedAt={dashboard.lastEditedAt}
                  onClick={onOpenVersionHistory}
                />
              )}
          </div>
        )}
      </div>
      {!isEditMode &&
        !isRefetchingData &&
        !isRefreshing &&
        !isVersionPreview && (
          <StatusLine lastRefreshedAt={refreshInfo?.lastRefreshedAt} />
        )}
      {/* Version-history preview chip — same chip chrome as the
          "Refreshed Xh ago" chip so it reads as a sibling status indicator
          rather than a separate banner. */}
      {isVersionPreview && (
        <VersionPreviewChip
          status={dashboard.status}
          dashboardVersion={dashboard.dashboardVersion}
          latestPublishedVersion={latestPublishedVersion}
        />
      )}
    </>
  );
}
