import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowsOutSimpleIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  InfoIcon,
  SpinnerGapIcon,
  XIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import vonFilledLogo from "../../../assets/von-filled-logo.svg";
import {
  DashboardLayout,
  DashboardCustomizationProvider,
  DashboardGrid,
  ErrorBoundary,
  Tooltip,
} from "@vonlabs/design-components";
import { chartThemeIds } from "@vonlabs/design-components";
import type { ChartThemeId } from "@vonlabs/design-components";
import { AnalyticsFilters } from "../AnalyticsFilters";
// import { CustomizeButton } from "./CustomizeButton";
import { StatusLine } from "./StatusLine";
import { SaveButton } from "./SaveButton";
import { SharePopover } from "./SharePopover";
import { RefreshButton } from "./RefreshButton";
import { DashboardStatus } from "../../../types/dashboard";
import type {
  Dashboard,
  RefreshInfo,
  ScheduleConfigRequest,
  DashboardScheduleResponse,
} from "../../../types/dashboard";
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
  onSave: (options?: { isFirstSave?: boolean; onSuccess?: () => void }) => void;
  savePhase: MutationPhase;
  onRevert: (options?: { onSuccess?: () => void }) => void;
  revertPhase: MutationPhase;
  onShare: (isSharedWithTenant: boolean) => void;
  sharePhase: MutationPhase;
  /** Show expand icon — navigates to full dashboard page */
  onExpand?: () => void;
  /** Show close (X) icon — closes the dashboard/preview pane */
  onClose?: () => void;
  /** Show Von Chat button */
  onChatClick?: () => void;
  /** Whether the chat pane is currently open */
  isChatOpen?: boolean;
  /** Toggle edit mode via PATCH API (is_editable) */
  onEditModeChange?: (isEditable: boolean) => void;
  /** Server-side table pagination handler */
  onTablePageChange?: (panelId: string, page: number) => void;
  /** Set of panel IDs currently loading a new page */
  loadingTablePanels?: Set<string>;
  /** Widgets with paginated table data merged in (overrides dashboard.widgets) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paginatedWidgets?: Record<string, any>;
  /** Callback when a widget's drilldown icon is clicked (chart-level) */
  onDrillDown?: (panelId: string) => void;
  /** Callback when a chart data point is clicked (point-level drilldown) */
  onPointDrillDown?: (
    panelId: string,
    drillFilters: Record<string, unknown>,
  ) => void;
  /** Server-side table sort handler */
  onTableSortChange?: (
    panelId: string,
    columnId: string,
    order: "asc" | "desc" | null,
  ) => void;
  /** Current sort state per panel */
  tableSortStates?: Record<string, { orderBy: string; orderByAsc: boolean }>;
  /** Initial color theme from backend ui_config */
  defaultColorTheme?: string;
  /** Called when the user changes the color theme */
  onColorThemeChange?: (themeId: string) => void;
  /** Called when the owner renames the dashboard */
  onRename?: (newName: string) => void;
  /** Schedule state and handlers (required when dashboard.isOwner) */
  schedule: DashboardScheduleResponse | null;
  isScheduled: boolean;
  isSchedulePaused: boolean;
  isScheduleMutating: boolean;
  onCreateSchedule: (config: ScheduleConfigRequest) => void;
  onUpdateSchedule: (config: Partial<ScheduleConfigRequest>) => void;
  onPauseSchedule: () => void;
  onResumeSchedule: () => void;
  onDeleteSchedule: () => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  dashboard,
  refreshInfo,
  activeFilters,
  onRefresh,
  onSave,
  savePhase,
  onRevert,
  revertPhase,
  onShare,
  sharePhase,
  onExpand,
  onClose,
  onChatClick,
  isChatOpen,
  onEditModeChange,
  onTablePageChange,
  loadingTablePanels,
  paginatedWidgets,
  onDrillDown,
  onPointDrillDown,
  onTableSortChange,
  tableSortStates,
  defaultColorTheme,
  onColorThemeChange,
  onRename,
  schedule,
  isScheduled,
  isSchedulePaused,
  isScheduleMutating,
  onCreateSchedule,
  onUpdateSchedule,
  onPauseSchedule,
  onResumeSchedule,
  onDeleteSchedule,
}) => {
  const rawGridConfig = dashboard.gridConfig as unknown as GridConfig;
  const gridConfig = {
    ...rawGridConfig,
    rowHeight: Math.min(rawGridConfig.rowHeight ?? 60, 60),
  };
  const layout = dashboard.layout as unknown as LayoutItem[];
  const widgets = (paginatedWidgets ?? dashboard.widgets) as unknown as Record<
    string,
    WidgetConfig
  >;

  const validatedColorTheme =
    defaultColorTheme && (chartThemeIds as string[]).includes(defaultColorTheme)
      ? (defaultColorTheme as ChartThemeId)
      : "default";

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
  }, []);

  // ── Inline rename state ─────────────────────────────────────────
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [editValue, setEditValue] = useState(dashboard.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    if (!isRenamingTitle) setEditValue(dashboard.title);
  }, [dashboard.title, isRenamingTitle]);

  useEffect(() => {
    if (isRenamingTitle) {
      committedRef.current = false;
      inputRef.current?.select();
    }
  }, [isRenamingTitle]);

  const commitRename = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    const trimmed = editValue.trim();
    setIsRenamingTitle(false);
    if (trimmed && trimmed !== dashboard.title) {
      onRename?.(trimmed);
    } else {
      setEditValue(dashboard.title);
    }
  }, [editValue, dashboard.title, onRename]);

  // ── Dashboard edit mode (API-driven via is_editable) ────────────
  const isEditMode = dashboard.isEditable;

  const handleEnterEditMode = useCallback(() => {
    if (dashboard.isOwner) {
      onEditModeChange?.(true);
    }
    onChatClick?.();
  }, [dashboard.isOwner, onEditModeChange, onChatClick]);

  const exitEditMode = useCallback(() => {
    onEditModeChange?.(false);
  }, [onEditModeChange]);

  const handleSaveFromEditMode = useCallback(() => {
    onSave({
      isFirstSave: dashboard.dashboardVersion < 1,
      onSuccess: exitEditMode,
    });
  }, [onSave, dashboard.dashboardVersion, exitEditMode]);

  const handleRevertFromEditMode = useCallback(() => {
    onRevert({ onSuccess: exitEditMode });
  }, [onRevert, exitEditMode]);

  const isSaved = dashboard.status === DashboardStatus.Published;

  // ── Inline save toast (top-center inside canvas) ───────────────
  const [showSaveToast, setShowSaveToast] = useState(false);
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isFirstSaveToastRef = useRef(false);
  useEffect(() => {
    if (savePhase === "success") {
      isFirstSaveToastRef.current = dashboard.dashboardVersion < 1;
      setShowSaveToast(true);
      clearTimeout(saveToastTimerRef.current);
      saveToastTimerRef.current = setTimeout(
        () => setShowSaveToast(false),
        3000,
      );
    }
  }, [savePhase, dashboard.dashboardVersion]);

  return (
    <DashboardCustomizationProvider
      defaultColorTheme={validatedColorTheme}
      onColorThemeChange={onColorThemeChange}
    >
      <DashboardLayout
        className={
          isEditMode
            ? "transition-all duration-200 [&>*:first-child]:border-gray-700 [&>*:first-child]:ring-3 [&>*:first-child]:ring-gray-200"
            : "transition-all duration-200"
        }
      >
        <DashboardLayout.Header>
          {/* Title row: name + description | chat + close */}
          <DashboardLayout.HeaderRow>
            <DashboardLayout.HeaderRow.Left>
              <div className="min-w-0">
                {isRenamingTitle ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") {
                        setEditValue(dashboard.title);
                        setIsRenamingTitle(false);
                      }
                    }}
                    className="text-base font-semibold text-gray-900 bg-transparent border border-gray-300 rounded-lg px-1.5 py-0.5 outline-none focus:border-gray-400 w-full max-w-md"
                  />
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <h1 className="text-base font-semibold text-gray-900 truncate">
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
                    {dashboard.isOwner && onRename && (
                      <Tooltip
                        content={
                          isSaved
                            ? "Rename dashboard"
                            : "Save the dashboard to rename"
                        }
                      >
                        <button
                          onClick={
                            isSaved ? () => setIsRenamingTitle(true) : undefined
                          }
                          disabled={!isSaved}
                          className={`transition-opacity ${
                            isEditMode
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          } ${
                            isSaved
                              ? "text-gray-700 hover:text-gray-900 cursor-pointer"
                              : "text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <PencilSimpleIcon size={16} />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            </DashboardLayout.HeaderRow.Left>

            <DashboardLayout.HeaderRow.Right>
              {/* Created by indicator */}
              <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1.5 leading-none whitespace-nowrap">
                <span className="text-gray-800">Created by</span>
                <span className="text-gray-800 font-medium">
                  {dashboard.isOwner
                    ? "me"
                    : dashboard.createdByName || "someone"}
                </span>
              </span>
              {onExpand && (
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

              {/* "Ask Von" button — only shown when chat panel is closed */}
              {onChatClick && !isChatOpen && (
                <motion.button
                  key="ask-von"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleEnterEditMode}
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

              {/* Standalone close for panes that pass onClose but no chat (e.g. DashboardPreviewPane) */}
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
            </DashboardLayout.HeaderRow.Right>
          </DashboardLayout.HeaderRow>

          {/* Toolbar row: filters | edit/save, revert, customize, refresh, share */}
          <DashboardLayout.HeaderRow bordered>
            <DashboardLayout.HeaderRow.Left>
              <AnalyticsFilters
                filters={dashboard.filters?.definitions ?? []}
                activeFilters={activeFilters}
              />
            </DashboardLayout.HeaderRow.Left>

            <DashboardLayout.HeaderRow.Right>
              <StatusLine
                state={dashboard.status}
                lastSavedAt={dashboard.updatedAt}
                lastRefreshedAt={refreshInfo?.lastRefreshedAt}
              />
              {dashboard.isOwner && (
                <>
                  {/* Revert — only in edit mode when there's a previous version */}
                  {isEditMode && dashboard.dashboardVersion >= 1 && (
                    <Tooltip content="Reverts to previous saved version">
                      <button
                        onClick={
                          revertPhase === "idle"
                            ? handleRevertFromEditMode
                            : undefined
                        }
                        disabled={revertPhase !== "idle"}
                        className={`inline-flex items-center justify-center w-[34px] h-[34px] border rounded-xl transition-colors ${
                          revertPhase === "pending"
                            ? "text-gray-500 bg-gray-100 border-gray-200/70 cursor-not-allowed"
                            : revertPhase === "success"
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200 cursor-default"
                              : "text-gray-800 bg-white border-gray-200/70 hover:bg-gray-50 cursor-pointer"
                        }`}
                      >
                        {revertPhase === "pending" ? (
                          <SpinnerGapIcon size={14} className="animate-spin" />
                        ) : (
                          <ClockCounterClockwiseIcon size={14} />
                        )}
                      </button>
                    </Tooltip>
                  )}

                  <RefreshButton
                    onRefresh={onRefresh}
                    canRefresh={isSaved}
                    schedule={schedule}
                    isScheduled={isScheduled}
                    isPaused={isSchedulePaused}
                    isMutating={isScheduleMutating}
                    onCreateSchedule={onCreateSchedule}
                    onUpdateSchedule={onUpdateSchedule}
                    onPauseSchedule={onPauseSchedule}
                    onResumeSchedule={onResumeSchedule}
                    onDeleteSchedule={onDeleteSchedule}
                  />
                  {/* <CustomizeButton /> */}
                  <SharePopover
                    isSharedWithTenant={dashboard.isSharedWithTenant}
                    canShare={isSaved}
                    sharePhase={sharePhase}
                    onShare={onShare}
                    onCopyLink={handleCopyLink}
                  />

                  {/* Edit / Save toggle */}
                  {isEditMode || dashboard.dashboardVersion < 1 ? (
                    <SaveButton
                      savePhase={savePhase}
                      onSave={handleSaveFromEditMode}
                      isSaved={false}
                    />
                  ) : (
                    <Tooltip content="Edit dashboard">
                      <button
                        onClick={handleEnterEditMode}
                        className="flex items-center gap-1.5 h-[34px] px-2.5 text-sm font-medium rounded-xl border border-gray-900 bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <PencilSimpleIcon size={13} />
                        Edit
                      </button>
                    </Tooltip>
                  )}
                </>
              )}
            </DashboardLayout.HeaderRow.Right>
          </DashboardLayout.HeaderRow>
        </DashboardLayout.Header>

        <DashboardLayout.Canvas
          className={`relative ${
            isEditMode
              ? "bg-gray-50 transition-colors duration-200"
              : "transition-colors duration-200"
          }`}
        >
          {/* Save toast — absolute top-center, no layout impact */}
          <AnimatePresence>
            {showSaveToast && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none"
              >
                <div className="inline-flex items-center gap-2 px-5 py-3 bg-green-50 border border-green-300 text-green-900 text-sm font-medium rounded-xl shadow-sm pointer-events-auto">
                  <CheckCircleIcon size={16} weight="fill" />
                  {isFirstSaveToastRef.current
                    ? "Dashboard is created. You can access the dashboard from the side panel."
                    : "Dashboard is updated. You can access the dashboard from the side panel."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ErrorBoundary>
            <DashboardGrid
              layout={layout}
              widgets={widgets}
              gridConfig={gridConfig}
              onTablePageChange={onTablePageChange}
              loadingTablePanels={loadingTablePanels}
              onDrillDown={onDrillDown}
              onPointDrillDown={onPointDrillDown}
              onTableSortChange={onTableSortChange}
              tableSortStates={tableSortStates}
              isEditMode={isEditMode}
            />
          </ErrorBoundary>

          {/* Edit mode banner — full-width sticky bottom */}
          <AnimatePresence>
            {isEditMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="sticky bottom-0 z-10 -mx-4"
              >
                <div className="bg-gray-900 text-white text-sm px-6 pt-3 pb-4 items-center text-center rounded-t-2xl">
                  You're in edit mode. Use the chat to make changes, then click{" "}
                  <span className="font-semibold">Save</span> in the toolbar to
                  save them.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DashboardLayout.Canvas>
      </DashboardLayout>
    </DashboardCustomizationProvider>
  );
};

export { AnalyticsView };
