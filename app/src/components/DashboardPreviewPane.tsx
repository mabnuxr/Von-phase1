/**
 * DashboardPreviewPane - Shows AnalyticsView in a resizable right pane
 *
 * Opened when user clicks "View Dashboard" in the chat conversation.
 * Has a header with title, close button, and expand button.
 * Expand navigates to the full dashboard page with conversationId.
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useAnalyticsTools } from "../hooks/useAnalyticsTools";
import { AnalyticsView, AnalyticsSkeleton, AnalyticsError } from "./Analytics";

interface DashboardPreviewPaneProps {
  dashboardId: string;
  conversationId: string;
  onClose: () => void;
}

export function DashboardPreviewPane({
  dashboardId,
  conversationId,
  onClose,
}: DashboardPreviewPaneProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useDashboardQuery(dashboardId);
  const {
    handleSave,
    savePhase,
    handleRevert,
    handleShare,
    sharePhase,
    handleRefresh,
  } = useAnalyticsTools(dashboardId);

  const dashboard = data?.dashboard ?? null;
  const refreshInfo = data?.refreshInfo ?? null;
  const activeFilters = data?.activeFilters ?? {};

  const handleExpand = useCallback(() => {
    navigate(`/dashboard/${dashboardId}?conversationId=${conversationId}`);
  }, [navigate, dashboardId, conversationId]);

  return (
    <div
      style={{
        position: "relative",
      }}
      className="h-full flex-1 min-w-0"
    >
      <div className="h-full w-full flex flex-col bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <AnalyticsSkeleton />
          ) : error || !dashboard ? (
            <AnalyticsError error={error?.message ?? null} />
          ) : (
            <AnalyticsView
              dashboard={dashboard}
              refreshInfo={refreshInfo}
              activeFilters={activeFilters}
              onRefresh={handleRefresh}
              onSave={handleSave}
              savePhase={savePhase}
              onRevert={handleRevert}
              onShare={handleShare}
              sharePhase={sharePhase}
              onExpand={handleExpand}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
