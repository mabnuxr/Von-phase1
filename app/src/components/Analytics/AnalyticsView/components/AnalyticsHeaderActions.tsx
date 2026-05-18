import { motion } from "framer-motion";
import { ArrowsOutSimpleIcon, XIcon } from "@phosphor-icons/react";
import { Tooltip } from "@vonlabs/design-components";
import vonFilledLogo from "../../../../assets/von-filled-logo.svg";
import { DataSourcesSlot } from "../DataSourcesSlot";
import { CreatorChip } from "./CreatorChip";
import type { DataSourceGroup } from "../../../../types/dashboard";

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
}: AnalyticsHeaderActionsProps) {
  return (
    <>
      {/* Created-by chip — hidden in version-history preview because the chip
          references the live dashboard's owner; while previewing, sharing /
          ownership context isn't actionable. */}
      {!hideCreatorChip && !isVersionPreview && (
        <CreatorChip
          currentScope={currentScope}
          creatorName={creatorName}
          isCreatorLoading={isCreatorLoading}
        />
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
            src={vonFilledLogo}
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
