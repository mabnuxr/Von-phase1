import { useCallback } from "react";
import { ArrowsOutIcon, XIcon } from "@phosphor-icons/react";
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
  /** Show close (X) icon — closes the dashboard pane */
  onClose?: () => void;
  /** Show Von Chat button */
  onChatClick?: () => void;
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
              {onChatClick && !isChatOpen && (
                <button
                  onClick={onChatClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-800 bg-white border border-gray-200/70 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <img
                    src={vonFilledLogo}
                    alt="Von"
                    width={16}
                    height={16}
                    className="flex-shrink-0"
                  />
                  Chat
                </button>
              )}
              {onExpand && (
                <button
                  onClick={onExpand}
                  className="inline-flex items-center justify-center w-[34px] h-[34px] text-gray-800 bg-white border border-gray-200/70 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Expand dashboard"
                >
                  <ArrowsOutIcon size={14} />
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center w-[34px] h-[34px] text-gray-800 bg-white border border-gray-200/70 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Close dashboard"
                >
                  <XIcon size={14} />
                </button>
              )}
            </DashboardLayout.HeaderRow.Right>
          </DashboardLayout.HeaderRow>

          {/* Toolbar row: filters, customize, save/draft, share */}
          <DashboardLayout.HeaderRow bordered>
            <DashboardLayout.HeaderRow.Left>
              <AnalyticsFilters
                filters={dashboard.filters ?? []}
                activeFilters={activeFilters}
              />
              <CustomizeButton />
            </DashboardLayout.HeaderRow.Left>

            <DashboardLayout.HeaderRow.Right>
              <StatusLine
                state={dashboard.status}
                lastRefreshedAt={refreshInfo?.lastRefreshedAt}
              />
              <SaveSplitButton
                state={dashboard.status}
                lastSavedAt={dashboard.updatedAt}
                savePhase={savePhase}
                onSave={onSave}
                onRevert={onRevert}
              />
              <SharePopover
                isSharedWithTenant={dashboard.isSharedWithTenant}
                canShare={dashboard.dashboardVersion >= 1}
                sharePhase={sharePhase}
                onShare={onShare}
                onCopyLink={handleCopyLink}
              />
              <RefreshButton onRefresh={onRefresh} />
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
