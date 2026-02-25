import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ChatPaneV2 } from "@vonlabs/design-components";
import { useDashboard } from "../hooks/useDashboard";
import { useResizablePane } from "../hooks/useResizablePane";
import { useAppShell } from "../hooks/useAppShell";
import {
  AnalyticsView,
  AnalyticsSkeleton,
  AnalyticsError,
} from "../components/Analytics";

const Analytics = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const { dashboard, refreshInfo, loading, error, activeFilters, refresh } =
    useDashboard(dashboardId);
  const { collapseSidebar } = useAppShell();
  const {
    width: chatPaneWidth,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useResizablePane();

  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Collapse left sidebar on mount
  useEffect(() => {
    collapseSidebar();
  }, [collapseSidebar]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !dashboard) {
    return <AnalyticsError error={error} />;
  }

  return (
    <div className="flex h-full w-full gap-2">
      {/* Dashboard content */}
      <div className="flex-1 min-w-0">
        <AnalyticsView
          dashboard={dashboard}
          refreshInfo={refreshInfo}
          activeFilters={activeFilters}
          onRefresh={refresh}
        />
      </div>

      {/* Chat pane */}
      <div
        style={{
          width: isChatCollapsed ? "48px" : `${chatPaneWidth}px`,
          transition: isResizing ? "none" : "width 0.3s ease",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Resize handle */}
        {!isChatCollapsed && (
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-indigo-500/30 transition-colors z-10 group touch-none"
            style={{ marginLeft: "-3px" }}
          >
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-transparent group-hover:bg-indigo-400 transition-colors" />
          </div>
        )}

        <ChatPaneV2
          conversationName={dashboard.title}
          messages={[]}
          isCollapsed={isChatCollapsed}
          onToggleCollapse={() => setIsChatCollapsed((prev) => !prev)}
          placeholder="Make changes to this dashboard..."
        />
      </div>
    </div>
  );
};

export default Analytics;
