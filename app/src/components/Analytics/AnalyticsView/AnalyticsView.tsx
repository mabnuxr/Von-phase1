import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowsOutIcon,
  SidebarSimpleIcon,
  ClockCounterClockwiseIcon,
  XIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import vonFilledLogo from "../../../assets/von-filled-logo.svg";
import {
  DashboardLayout,
  DashboardCustomizationProvider,
  DashboardGrid,
  ErrorBoundary,
  TruncateWithText,
} from "@vonlabs/design-components";
import { chartThemeIds } from "@vonlabs/design-components";
import type { ChartThemeId } from "@vonlabs/design-components";
import { AnalyticsFilters } from "../AnalyticsFilters";
import { CustomizeButton } from "./CustomizeButton";
import { StatusLine } from "./StatusLine";
import { PublishButton } from "./PublishButton";
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
  /** Server-side table pagination handler */
  onTablePageChange?: (panelId: string, page: number) => void;
  /** Set of panel IDs currently loading a new page */
  loadingTablePanels?: Set<string>;
  /** Widgets with paginated table data merged in (overrides dashboard.widgets) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paginatedWidgets?: Record<string, any>;
  /** Callback when a widget's drilldown icon is clicked */
  onDrillDown?: (panelId: string) => void;
  /** Initial color theme from backend ui_config */
  defaultColorTheme?: string;
  /** Called when the user changes the color theme */
  onColorThemeChange?: (themeId: string) => void;
  /** Called when the owner renames the dashboard */
  onRename?: (newName: string) => void;
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
  onTablePageChange,
  loadingTablePanels,
  paginatedWidgets,
  onDrillDown,
  defaultColorTheme,
  onColorThemeChange,
  onRename,
}) => {
  const gridConfig = dashboard.gridConfig as unknown as GridConfig;
  const layout = dashboard.layout as unknown as LayoutItem[];
  const widgets = (paginatedWidgets ?? dashboard.widgets) as unknown as Record<
    string,
    WidgetConfig
  >;

  const validatedColorTheme =
    defaultColorTheme && (chartThemeIds as string[]).includes(defaultColorTheme)
      ? (defaultColorTheme as ChartThemeId)
      : undefined;

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
  }, []);

  // Inline rename state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(dashboard.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync editValue when dashboard title changes from the server
  useEffect(() => {
    if (!isEditing) setEditValue(dashboard.title);
  }, [dashboard.title, isEditing]);

  // Auto-focus and select when entering edit mode
  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== dashboard.title) {
      onRename?.(trimmed);
    } else {
      setEditValue(dashboard.title);
    }
  }, [editValue, dashboard.title, onRename]);

  return (
    <DashboardCustomizationProvider
      defaultColorTheme={validatedColorTheme}
      onColorThemeChange={onColorThemeChange}
    >
      <DashboardLayout>
        <DashboardLayout.Header>
          {/* Title row: name + description | chat + close */}
          <DashboardLayout.HeaderRow>
            <DashboardLayout.HeaderRow.Left>
              <div className="min-w-0">
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") {
                        setEditValue(dashboard.title);
                        setIsEditing(false);
                      }
                    }}
                    className="text-base font-semibold text-gray-900 bg-transparent border border-gray-300 rounded-lg px-1.5 py-0.5 outline-none focus:border-gray-400 w-full max-w-md"
                  />
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <h1 className="text-base font-semibold text-gray-900 truncate">
                      {dashboard.title}
                    </h1>
                    {dashboard.isOwner && onRename && (
                      <button
                        onClick={
                          dashboard.dashboardVersion >= 1
                            ? () => setIsEditing(true)
                            : undefined
                        }
                        disabled={dashboard.dashboardVersion < 1}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                          dashboard.dashboardVersion >= 1
                            ? "text-gray-400 hover:text-gray-600 cursor-pointer"
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                        title={
                          dashboard.dashboardVersion >= 1
                            ? "Rename dashboard"
                            : "Save the dashboard to rename"
                        }
                      >
                        <PencilSimpleIcon size={14} />
                      </button>
                    )}
                  </div>
                )}
                {dashboard.description && (
                  <TruncateWithText className="text-xs text-gray-700 max-w-[60%]">
                    {dashboard.description}
                  </TruncateWithText>
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
            </DashboardLayout.HeaderRow.Right>
          </DashboardLayout.HeaderRow>

          {/* Toolbar row: filters, customize, save/draft, share */}
          <DashboardLayout.HeaderRow bordered>
            <DashboardLayout.HeaderRow.Left>
              <AnalyticsFilters
                filters={dashboard.filters?.definitions ?? []}
                activeFilters={activeFilters}
              />
              {dashboard.isOwner && (
                <CustomizeButton
                  canCustomize={dashboard.dashboardVersion >= 1}
                />
              )}
            </DashboardLayout.HeaderRow.Left>

            <DashboardLayout.HeaderRow.Right>
              <StatusLine
                state={dashboard.status}
                lastSavedAt={dashboard.updatedAt}
                lastRefreshedAt={refreshInfo?.lastRefreshedAt}
              />
              {dashboard.isOwner && (
                <>
                  <PublishButton
                    savePhase={savePhase}
                    onSave={onSave}
                    isPublished={dashboard.status === DashboardStatus.Published}
                  />
                  {dashboard.status === DashboardStatus.Draft && (
                    <button
                      onClick={onRevert}
                      title="Discard draft — revert to published version"
                      className="inline-flex items-center justify-center w-[34px] h-[34px] text-gray-800 bg-white border border-gray-200/70 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <ClockCounterClockwiseIcon size={14} />
                    </button>
                  )}
                  <RefreshButton
                    onRefresh={onRefresh}
                    canRefresh={dashboard.dashboardVersion >= 1}
                  />
                  <SharePopover
                    isSharedWithTenant={dashboard.isSharedWithTenant}
                    canShare={dashboard.dashboardVersion >= 1}
                    sharePhase={sharePhase}
                    onShare={onShare}
                    onCopyLink={handleCopyLink}
                  />
                </>
              )}
            </DashboardLayout.HeaderRow.Right>
          </DashboardLayout.HeaderRow>
        </DashboardLayout.Header>

        <DashboardLayout.Canvas>
          <ErrorBoundary>
            <DashboardGrid
              layout={layout}
              widgets={widgets}
              gridConfig={gridConfig}
              onTablePageChange={onTablePageChange}
              loadingTablePanels={loadingTablePanels}
              onDrillDown={onDrillDown}
            />
          </ErrorBoundary>
        </DashboardLayout.Canvas>
      </DashboardLayout>
    </DashboardCustomizationProvider>
  );
};

export { AnalyticsView };
