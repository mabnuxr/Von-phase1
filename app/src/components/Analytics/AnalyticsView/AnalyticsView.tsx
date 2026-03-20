import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowsOutIcon,
  SidebarSimpleIcon,
  ClockCounterClockwiseIcon,
  XIcon,
} from "@phosphor-icons/react";
import vonFilledLogo from "../../../assets/von-filled-logo.svg";
import {
  DashboardLayout,
  DashboardCustomizationProvider,
  DashboardGrid,
  ErrorBoundary,
} from "@vonlabs/design-components";
import { AnalyticsFilters } from "../AnalyticsFilters";
import { CustomizeButton } from "./CustomizeButton";
import { StatusLine } from "./StatusLine";
import { SaveSplitButton } from "./SaveSplitButton";
import { SharePopover } from "./SharePopover";
import { RefreshButton } from "./RefreshButton";
import { DashboardStatus } from "../../../types/dashboard";
import type { Dashboard, RefreshInfo } from "../../../types/dashboard";
import type { MutationPhase } from "../../../hooks/useMutationPhase";
import type {
  WidgetConfig,
  GridConfig,
  LayoutItem,
} from "@vonlabs/design-components";

interface AnalyticsViewProps {
  dashboard: Dashboard;
  refreshInfo: RefreshInfo | null;
  activeFilters: Record<string, unknown>;
  onRefresh: () => Promise<void>;
  onSave: () => void;
  savePhase: MutationPhase;
  onRevert: () => void;
  onShare: (isSharedWithTenant: boolean) => void;
  sharePhase: MutationPhase;
  /** Show expand icon — navigates to full dashboard page */
  onExpand?: () => void;
  /** Show close (X) icon — closes the dashboard/preview pane */
  onClose?: () => void;
  /** Show Von Chat button */
  onChatClick?: () => void;
  /** Dedicated handler to close the chat pane (distinct from closing the dashboard) */
  onChatClose?: () => void;
  /** Whether the chat pane is currently open */
  isChatOpen?: boolean;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  dashboard,
  refreshInfo,
  activeFilters,
  onRefresh,
  onSave,
  savePhase,
  onRevert,
  onShare,
  sharePhase,
  onExpand,
  onClose,
  onChatClick,
  onChatClose,
  isChatOpen,
}) => {
  const gridConfig = dashboard.gridConfig as unknown as GridConfig;
  const layout = dashboard.layout as unknown as LayoutItem[];
  const widgets = dashboard.widgets as unknown as Record<string, WidgetConfig>;

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
  }, []);

  return (
    <DashboardCustomizationProvider>
      <DashboardLayout>
        <DashboardLayout.Header>
          {/* Title row: name + description | chat + close */}
          <DashboardLayout.HeaderRow>
            <DashboardLayout.HeaderRow.Left>
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-gray-900 truncate">
                  {dashboard.title}
                </h1>
                {dashboard.description && (
                  <p className="text-xs text-gray-700 truncate">
                    {dashboard.description}
                  </p>
                )}
              </div>
            </DashboardLayout.HeaderRow.Left>

            <DashboardLayout.HeaderRow.Right>
              {onExpand && (
                <button
                  onClick={onExpand}
                  className="inline-flex items-center justify-center w-[34px] h-[34px] text-gray-800 bg-white border border-gray-200/70 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Expand dashboard"
                >
                  <ArrowsOutIcon size={14} />
                </button>
              )}

              {/* Animated "Ask Von" ↔ sidebar-icon chat toggle */}
              {onChatClick && (
                <div className="relative" style={{ minWidth: 34 }}>
                  <AnimatePresence mode="wait" initial={false}>
                    {isChatOpen ? (
                      <motion.div
                        key="sidebar-icon"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <button
                          onClick={onChatClose}
                          title="Close chat"
                          className="inline-flex items-center justify-center w-[34px] h-[34px] text-gray-800 bg-gray-100 border border-gray-200/70 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <SidebarSimpleIcon
                            size={14}
                            className="scale-x-[-1]"
                          />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="ask-von"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        onClick={onChatClick}
                        title="Ask Von"
                        className="flex items-center gap-1.5 h-[34px] px-2.5 bg-white text-gray-900 text-xs font-medium rounded-xl border border-gray-200/70 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
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
                  </AnimatePresence>
                </div>
              )}

              {/* Standalone close for panes that pass onClose but no chat (e.g. DashboardPreviewPane) */}
              {!onChatClick && onClose && (
                <button
                  onClick={onClose}
                  title="Close"
                  className="inline-flex items-center justify-center w-[34px] h-[34px] text-gray-800 bg-white border border-gray-200/70 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <XIcon size={14} />
                </button>
              )}

              <RefreshButton onRefresh={onRefresh} />
            </DashboardLayout.HeaderRow.Right>
          </DashboardLayout.HeaderRow>

          {/* Toolbar row: filters, customize, save/draft, share */}
          <DashboardLayout.HeaderRow bordered>
            <DashboardLayout.HeaderRow.Left>
              <AnalyticsFilters
                filters={dashboard.filters?.definitions ?? []}
                activeFilters={activeFilters}
              />
              <CustomizeButton />
            </DashboardLayout.HeaderRow.Left>

            <DashboardLayout.HeaderRow.Right>
              <StatusLine
                state={dashboard.status}
                lastRefreshedAt={refreshInfo?.lastRefreshedAt}
              />
              <SaveSplitButton savePhase={savePhase} onSave={onSave} />
              {dashboard.status === DashboardStatus.Draft && (
                <button
                  onClick={onRevert}
                  title="Discard draft — revert to published version"
                  className="inline-flex items-center justify-center w-[34px] h-[34px] text-gray-800 bg-white border border-gray-200/70 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <ClockCounterClockwiseIcon size={14} />
                </button>
              )}
              <SharePopover
                isSharedWithTenant={dashboard.isSharedWithTenant}
                canShare={dashboard.dashboardVersion >= 1}
                sharePhase={sharePhase}
                onShare={onShare}
                onCopyLink={handleCopyLink}
              />
            </DashboardLayout.HeaderRow.Right>
          </DashboardLayout.HeaderRow>
        </DashboardLayout.Header>

        <DashboardLayout.Canvas>
          <ErrorBoundary>
            <DashboardGrid
              layout={layout}
              widgets={widgets}
              gridConfig={gridConfig}
            />
          </ErrorBoundary>
        </DashboardLayout.Canvas>
      </DashboardLayout>
    </DashboardCustomizationProvider>
  );
};

export { AnalyticsView };
