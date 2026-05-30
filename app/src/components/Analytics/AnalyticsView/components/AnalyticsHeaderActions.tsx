import { motion } from "framer-motion";
import { ArrowsOutSimpleIcon, XIcon } from "@phosphor-icons/react";
import { Tooltip } from "@vonlabs/design-components";
import { DataSourcesSlot } from "../DataSourcesSlot";
import { CreatorChip } from "./CreatorChip";
import { EditLockBadge } from "../EditLockBadge";
import { LOGO_MARK_URL } from "../../../../config/constants";
import type { Dashboard, DataSourceGroup } from "../../../../types/dashboard";
import type { TenantMember } from "../../../../services/tenantMembersService";

interface AnalyticsHeaderActionsProps {
  hideCreatorChip: boolean | undefined;
  isVersionPreview: boolean;
  currentScope: "restricted" | "tenant";
  creatorName: string | null;
  isCreatorLoading: boolean;
  isEditMode: boolean;
  isSaved: boolean;
  onExpand: (() => void) | undefined;
  dataSources: DataSourceGroup[] | undefined;
  onChatClick: (() => void) | undefined;
  isChatOpen: boolean | undefined;
  onClose: (() => void) | undefined;
  // ── Edit-lock badge context — swaps in for the "Created by" chip
  //    while editing. The badge surfaces the live edit holder + last
  //    edit time and doubles as a version-history entry point. Hidden
  //    in version-history preview because the chip would misleadingly
  //    attribute the historical snapshot to the current editor.
  canEditDashboard: boolean;
  editLock: Dashboard["editLock"];
  lastEditedBy: Dashboard["lastEditedBy"];
  lastEditedAt: Dashboard["lastEditedAt"];
  currentUserId: string | undefined;
  tenantMembers: TenantMember[] | undefined;
  onOpenVersionHistory?: () => void;
}

export function AnalyticsHeaderActions({
  hideCreatorChip,
  isVersionPreview,
  currentScope,
  creatorName,
  isCreatorLoading,
  isEditMode,
  isSaved,
  onExpand,
  dataSources,
  onChatClick,
  isChatOpen,
  onClose,
  canEditDashboard,
  editLock,
  lastEditedBy,
  lastEditedAt,
  currentUserId,
  tenantMembers,
  onOpenVersionHistory,
}: AnalyticsHeaderActionsProps) {
  // While in edit mode, the EditLockBadge replaces the "Created by"
  // chip — the lock holder + last-edit time is more informative than
  // creator attribution at that point. Falls back to the chip outside
  // of edit mode (or when the badge isn't applicable: viewer-only
  // access, missing lock data, or version-history preview).
  const showEditLockBadge =
    canEditDashboard && isEditMode && !isVersionPreview && !!editLock;

  return (
    <>
      {showEditLockBadge && editLock ? (
        <EditLockBadge
          editLock={editLock}
          currentUserId={currentUserId}
          tenantMembers={tenantMembers}
          lastEditedBy={lastEditedBy}
          lastEditedAt={lastEditedAt}
          onClick={onOpenVersionHistory}
        />
      ) : (
        /* Created-by chip — hidden in version-history preview because the
           chip references the live dashboard's owner; while previewing,
           sharing / ownership context isn't actionable. */
        !hideCreatorChip &&
        !isVersionPreview && (
          <CreatorChip
            currentScope={currentScope}
            creatorName={creatorName}
            isCreatorLoading={isCreatorLoading}
          />
        )
      )}

      {onExpand && !isEditMode && (
        <button
          onClick={isSaved ? onExpand : undefined}
          disabled={!isSaved}
          className={`flex items-center gap-1.5 h-[34px] px-2.5 text-sm font-medium rounded-xl border transition-colors whitespace-nowrap ${
            !isSaved
              ? "text-gray-400 bg-gray-100 border-gray-200/70 cursor-not-allowed"
              : "text-gray-800 bg-white border-gray-200/70 hover:bg-gray-50 cursor-pointer"
          }`}
        >
          <ArrowsOutSimpleIcon size={13} />
          View in Dashboards
        </button>
      )}

      {/* Data sources pill — header-right, next to Ask Von */}
      {dataSources && <DataSourcesSlot dataSources={dataSources} />}

      {/* "Ask Von" button — shown whenever the chat panel is closed.
          Version-history preview no longer hides it: the panel docks
          alongside the dashboard, and users asked for the chat entry point
          to stay reachable while browsing versions. Chat still binds to the
          live dashboard regardless of which version is currently previewed. */}
      {onChatClick && !isChatOpen && (
        <motion.button
          key="ask-von"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          onClick={onChatClick}
          title="Ask Von"
          className="flex items-center gap-1.5 h-[34px] px-2.5 bg-white text-gray-900 text-sm rounded-xl border border-gray-200/70 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
        >
          <img
            src={LOGO_MARK_URL}
            alt="Von"
            width={15}
            height={15}
            className="flex-shrink-0"
          />
          Ask Von
        </motion.button>
      )}

      {/* Standalone close for panes that pass onClose but no chat
          (e.g. DashboardPreviewPane) */}
      {!onChatClick && onClose && (
        <Tooltip content="Close">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-[34px] h-[34px] text-gray-800 bg-white border border-gray-200/70 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <XIcon size={14} />
          </button>
        </Tooltip>
      )}
    </>
  );
}
