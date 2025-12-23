import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatTextIcon, GearSix, House, ChartBar, Database } from '@phosphor-icons/react';
import type { BuildMode, DataViewTab, ChatMessage, DataTable, Dashboard, DashboardWidget } from './types';
import { DataExplorer } from './DataExplorer';
import { DashboardCanvas } from './DashboardCanvas';
import { TableViewer } from './TableViewer';
import { BuildChat } from './BuildChat';
import { ProgressTimeline } from './ProgressTimeline';
import { mockDataTables, mockDashboard, mockChatMessages, mockProgressSteps } from './mockData';

// Von logo for collapsed sidebar
const VonLogoMini: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
      fill="url(#paint0_radial_mini)"
    />
    <path
      d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
      stroke="white"
      strokeWidth="1.33"
    />
    <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
    <defs>
      <radialGradient
        id="paint0_radial_mini"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
      >
        <stop stopColor="#FFF3EB" />
        <stop offset="0.26" stopColor="#FF9042" />
        <stop offset="1" stopColor="#854FFF" />
      </radialGradient>
    </defs>
  </svg>
);

export interface BuildModeLayoutProps {
  /**
   * Initial view mode
   */
  initialViewMode?: DataViewTab;

  /**
   * Initial messages
   */
  initialMessages?: ChatMessage[];

  /**
   * Initial data tables
   */
  initialTables?: DataTable[];

  /**
   * Callback when mode changes to ask
   */
  onExitBuildMode?: () => void;

  /**
   * Whether to show the progress timeline (for demo)
   */
  showProgress?: boolean;

  /**
   * Whether the build is complete
   */
  buildComplete?: boolean;
}

/**
 * BuildModeLayout - Full 4-column layout for build mode
 *
 * Layout:
 * 1. Collapsed navigation (left)
 * 2. Data Explorer panel
 * 3. Dashboard Canvas (center)
 * 4. Chat panel (right)
 */
export const BuildModeLayout: React.FC<BuildModeLayoutProps> = ({
  initialViewMode = 'dashboard',
  initialMessages = mockChatMessages,
  initialTables = mockDataTables,
  onExitBuildMode,
  showProgress = false,
  buildComplete = true,
}) => {
  const [viewMode, setViewMode] = useState<DataViewTab>(initialViewMode);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [mode, setMode] = useState<BuildMode>('build');
  const [isLoading, setIsLoading] = useState(false);
  const [chatWidth, setChatWidth] = useState(320);
  const [dashboard, setDashboard] = useState<Dashboard>(mockDashboard);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(320);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = chatWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, 280), 600);
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [chatWidth]);

  const selectedTable = initialTables.find((t) => t.id === selectedTableId);

  const handleModeChange = useCallback(
    (newMode: BuildMode) => {
      setMode(newMode);
      if (newMode === 'ask') {
        onExitBuildMode?.();
      }
    },
    [onExitBuildMode]
  );

  const handleSendMessage = useCallback((message: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I understand you want to "${message}". I'm updating the dashboard based on your request. You can see the changes reflected in the visualization.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  }, []);

  const handleToggleThinking = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isThinkingCollapsed: !msg.isThinkingCollapsed } : msg
      )
    );
  }, []);

  const handleTableSelect = useCallback((tableId: string) => {
    setSelectedTableId(tableId);
    setViewMode('data');
  }, []);

  const handleWidgetAdd = useCallback((newWidget: DashboardWidget) => {
    setDashboard((prev) => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      updatedAt: new Date(),
    }));
  }, []);

  const handleWidgetDelete = useCallback((widgetId: string) => {
    setDashboard((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== widgetId),
      updatedAt: new Date(),
    }));
  }, []);

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sf">
      {/* 1. Collapsed Navigation */}
      <div className="w-14 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col items-center py-3">
        {/* Logo */}
        <div className="mb-6">
          <VonLogoMini />
        </div>

        {/* Nav Items */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Home"
          >
            <House size={20} weight="duotone" />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-900 transition-colors cursor-pointer"
            title="Dashboards"
          >
            <ChartBar size={20} weight="duotone" />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Data Sources"
          >
            <Database size={20} weight="duotone" />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Past Chats"
          >
            <ChatTextIcon size={20} weight="duotone" />
          </button>
        </div>

        {/* Bottom Items */}
        <div className="flex flex-col items-center gap-1">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Settings"
          >
            <GearSix size={20} weight="duotone" />
          </button>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
            JD
          </div>
        </div>
      </div>

      {/* 2. Data Explorer Panel */}
      <div className="w-64 flex-shrink-0">
        <DataExplorer
          tables={initialTables}
          selectedTableId={selectedTableId || undefined}
          onTableSelect={handleTableSelect}
          viewMode={viewMode}
        />
      </div>

      {/* 3. Center Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Progress Timeline (shown during build) */}
        <AnimatePresence>
          {showProgress && !buildComplete && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 bg-white px-6 py-4"
            >
              <ProgressTimeline steps={mockProgressSteps} orientation="horizontal" size="sm" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 min-h-0">
          {viewMode === 'data' && selectedTable ? (
            <TableViewer
              table={selectedTable}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          ) : (
            <DashboardCanvas
              dashboard={dashboard}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onWidgetClick={(widgetId) => console.log('Widget clicked:', widgetId)}
              onWidgetEdit={(widgetId) => console.log('Widget edit:', widgetId)}
              onShare={() => console.log('Share clicked')}
              onFilter={() => console.log('Filter clicked')}
              onExport={() => console.log('Export clicked')}
              onWidgetAdd={handleWidgetAdd}
              onWidgetDelete={handleWidgetDelete}
              dataTables={initialTables}
            />
          )}
        </div>
      </div>

      {/* 4. Chat Panel with Resize Handle */}
      <div className="relative flex-shrink-0" style={{ width: chatWidth }}>
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-gray-300 transition-colors z-10"
        />
        <BuildChat
          messages={messages}
          onSendMessage={handleSendMessage}
          mode={mode}
          onModeChange={handleModeChange}
          isLoading={isLoading}
          onToggleThinking={handleToggleThinking}
        />
      </div>
    </div>
  );
};

export default BuildModeLayout;
