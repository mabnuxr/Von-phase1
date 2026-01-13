import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LayoutItem } from 'react-grid-layout';
import { CheckCircle } from '@phosphor-icons/react';
import { ChatSidebar } from '../../../components/ChatSidebarV2/ChatSidebarV2';
import type { SidebarItem, Folder, ItemType } from '../../../components/ChatSidebarV2/ChatSidebarV2';
import { Pane1 } from '../../../components/Pane1/Pane1';
import type { ChartComponent, SubtableItem, ComponentConfig } from '../../../components/Pane1/Pane1';
import { Pane2 } from '../../../components/layouts/Pane2';
import type { DashboardWidgetData } from '../../../components/layouts/Pane2';
import { ChatPane } from '../../../components/ChatPane/ChatPane';
import type { Message } from '../../../components/Chat/types';
import type { ReferenceContext, ActivePopover } from '../../../components/ChatPane/types';
import { ChatEmptyState } from '../../../components/Chat/ChatEmptyState';
import { AmbientGlow } from '../../../components/DashboardBuilder/InteractivePrototype/AmbientGlow';
import { AgentProgressBar } from '../../../components/DashboardBuilder/InteractivePrototype/AgentProgressBar';
import type { AgentStatus } from '../../../components/DashboardBuilder/InteractivePrototype/AgentProgressBar';
import { reports } from '../data/salesData';

// ============================================================================
// Layout Decorator
// ============================================================================

const FullLayoutDecorator: Decorator = (Story) => (
  <div
    style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: '#f5f5f7',
      overflow: 'hidden',
      padding: '12px',
      gap: '8px',
    }}
  >
    <Story />
  </div>
);

// ============================================================================
// Types
// ============================================================================

type AutoDashboardPhase =
  | 'landing'
  | 'chatting'
  | 'planning'
  | 'building-data'
  | 'building-dashboard'
  | 'complete';

interface WidgetBuildStep {
  widget: DashboardWidgetData;
  layout: LayoutItem;
  configTitle: string;
  configReportId: string;
  component: ChartComponent;
}

interface OrchestratorState {
  phase: AutoDashboardPhase;
  agentStatus: AgentStatus;
  agentMessage: string;
  agentProgress: number;
  pane1Tab: 'data' | 'dashboard';
  // Data phase
  visibleReports: SubtableItem[];
  // Dashboard phase
  visibleWidgetIds: string[];
  currentWidgetIndex: number;
  selectedComponent: ChartComponent | null;
  configTitle: string;
  configReportId: string;
  ambientGlowActive: boolean;
}

// ============================================================================
// Dummy Data (same as ManualDashboard)
// ============================================================================

const dummySidebarItems: SidebarItem[] = [
  { id: 'chat-1', label: 'Pipeline Analysis Q4', type: 'chat' },
  { id: 'chat-2', label: 'Win Rate Optimization', type: 'chat' },
  { id: 'chat-3', label: 'Revenue Forecast Discussion', type: 'chat' },
  { id: 'chat-4', label: 'Customer Churn Analysis', type: 'chat' },
  { id: 'chat-5', label: 'Territory Planning Q1', type: 'chat' },
  { id: 'chat-6', label: 'Competitive Analysis Review', type: 'chat' },
  { id: 'chat-7', label: 'Sales Enablement Strategy', type: 'chat' },
  { id: 'chat-8', label: 'Lead Scoring Model Update', type: 'chat' },
  { id: 'dash-1', label: 'Sales Overview', type: 'dashboard', ownership: 'mine' },
  { id: 'dash-2', label: 'Team Performance', type: 'dashboard', ownership: 'mine' },
  { id: 'dash-3', label: 'Executive Dashboard', type: 'dashboard', ownership: 'shared', ownerName: 'Sarah Chen' },
  { id: 'dash-4', label: 'Regional Metrics', type: 'dashboard', ownership: 'shared_by_me' },
  { id: 'chat-f1-1', label: 'Q4 Pipeline Deep Dive', type: 'chat', folderId: 'folder-1' },
  { id: 'chat-f1-2', label: 'Q4 Revenue Projections', type: 'chat', folderId: 'folder-1' },
  { id: 'dash-f2-1', label: 'Weekly Sales Report', type: 'dashboard', folderId: 'folder-2', ownership: 'mine' },
];

const dummyFolders: Folder[] = [
  { id: 'folder-1', label: 'Q4 Analysis', isExpanded: true },
  { id: 'folder-2', label: 'Weekly Reports', isExpanded: false },
  { id: 'folder-3', label: 'Executive Prep', isExpanded: false },
];

// Reports to be added during the data phase
const reportsToAdd: SubtableItem[] = [
  { id: 'auto-report-1', label: 'Account Health Scores' },
  { id: 'auto-report-2', label: 'Renewal Risk Analysis' },
  { id: 'auto-report-3', label: 'Engagement Metrics' },
  { id: 'auto-report-4', label: 'Churn Indicators' },
  { id: 'auto-report-5', label: 'Support Ticket Trends' },
];

// Chart components mapping
const chartComponents: Record<string, ChartComponent> = {
  bar: { id: 'bar', label: 'Bar Chart', icon: 'bar' },
  line: { id: 'line', label: 'Line Chart', icon: 'line' },
  pie: { id: 'pie', label: 'Pie Chart', icon: 'pie' },
  donut: { id: 'donut', label: 'Donut Chart', icon: 'donut' },
  metric: { id: 'metric', label: 'Metric Card', icon: 'metric' },
  table: { id: 'table', label: 'Data Table', icon: 'table' },
};

// Widgets to be added during the dashboard phase
const widgetsToAdd: WidgetBuildStep[] = [
  {
    widget: { id: 'auto-widget-1', type: 'metric', chartType: 'metric', title: 'Accounts at Risk', reportId: 'auto-report-1' },
    layout: { i: 'auto-widget-1', x: 0, y: 0, w: 2, h: 3 },
    configTitle: 'Accounts at Risk',
    configReportId: 'auto-report-1',
    component: chartComponents.metric,
  },
  {
    widget: { id: 'auto-widget-2', type: 'metric', chartType: 'metric', title: 'Total ARR at Risk', reportId: 'auto-report-2' },
    layout: { i: 'auto-widget-2', x: 2, y: 0, w: 2, h: 3 },
    configTitle: 'Total ARR at Risk',
    configReportId: 'auto-report-2',
    component: chartComponents.metric,
  },
  {
    widget: { id: 'auto-widget-3', type: 'chart', chartType: 'bar', title: 'Risk by Region', reportId: 'auto-report-1' },
    layout: { i: 'auto-widget-3', x: 4, y: 0, w: 3, h: 4 },
    configTitle: 'Risk by Region',
    configReportId: 'auto-report-1',
    component: chartComponents.bar,
  },
  {
    widget: { id: 'auto-widget-4', type: 'chart', chartType: 'line', title: 'Engagement Trend', reportId: 'auto-report-3' },
    layout: { i: 'auto-widget-4', x: 7, y: 0, w: 3, h: 4 },
    configTitle: 'Engagement Trend',
    configReportId: 'auto-report-3',
    component: chartComponents.line,
  },
  {
    widget: { id: 'auto-widget-5', type: 'chart', chartType: 'pie', title: 'Risk Distribution', reportId: 'auto-report-4' },
    layout: { i: 'auto-widget-5', x: 0, y: 4, w: 4, h: 4 },
    configTitle: 'Risk Distribution',
    configReportId: 'auto-report-4',
    component: chartComponents.pie,
  },
  {
    widget: { id: 'auto-widget-6', type: 'table', chartType: 'table', title: 'Accounts Requiring Action', reportId: 'auto-report-1' },
    layout: { i: 'auto-widget-6', x: 4, y: 4, w: 6, h: 4 },
    configTitle: 'Accounts Requiring Action',
    configReportId: 'auto-report-1',
    component: chartComponents.table,
  },
];

// Data sources for the dropdown (combine auto-generated + existing reports)
const allDataSources = [
  ...reportsToAdd.map((r) => ({ id: r.id, label: r.label, columnCount: 8 })),
  ...reports.map((r) => ({ id: r.id, label: r.name, columnCount: r.columns.length })),
];

// ============================================================================
// Orchestrator Hook
// ============================================================================

const initialState: OrchestratorState = {
  phase: 'landing',
  agentStatus: 'idle',
  agentMessage: '',
  agentProgress: 0,
  pane1Tab: 'dashboard',
  visibleReports: [],
  visibleWidgetIds: [],
  currentWidgetIndex: -1,
  selectedComponent: null,
  configTitle: '',
  configReportId: '',
  ambientGlowActive: false,
};

function useAutoDashboardOrchestrator() {
  const [state, setState] = useState<OrchestratorState>(initialState);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay);
    timeoutsRef.current.push(timeout);
    return timeout;
  }, []);

  const updateState = useCallback((updates: Partial<OrchestratorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Start the build sequence after plan approval
  const startBuildSequence = useCallback(() => {
    clearAllTimeouts();

    let time = 0;

    // Phase 1: Switch to Data tab and start adding reports
    updateState({
      phase: 'building-data',
      agentStatus: 'working',
      agentMessage: 'Creating data tables...',
      agentProgress: 5,
      ambientGlowActive: true,
      pane1Tab: 'data',
    });

    // Add reports one by one to Pane1
    reportsToAdd.forEach((report, idx) => {
      addTimeout(
        () => {
          updateState({
            agentMessage: `Creating ${report.label}...`,
            agentProgress: 5 + ((idx + 1) / reportsToAdd.length) * 40,
            visibleReports: reportsToAdd.slice(0, idx + 1),
          });
        },
        (time += 600)
      );
    });

    // Brief pause after data tables
    time += 400;

    // Phase 2: Switch to Dashboard tab and start adding widgets
    addTimeout(
      () => {
        updateState({
          phase: 'building-dashboard',
          agentMessage: 'Building dashboard widgets...',
          agentProgress: 50,
          pane1Tab: 'dashboard',
        });
      },
      time
    );

    time += 300;

    // Add widgets one by one with config animation in Pane1
    widgetsToAdd.forEach((step, idx) => {
      // Step 1: Select component and start typing name
      addTimeout(
        () => {
          updateState({
            agentMessage: `Adding ${step.configTitle}...`,
            agentProgress: 50 + ((idx + 0.2) / widgetsToAdd.length) * 45,
            currentWidgetIndex: idx,
            selectedComponent: step.component,
            configTitle: '',
            configReportId: '',
          });
        },
        (time += 400)
      );

      // Step 2: Type the name
      addTimeout(
        () => {
          updateState({
            configTitle: step.configTitle,
          });
        },
        (time += 350)
      );

      // Step 3: Select report
      addTimeout(
        () => {
          updateState({
            configReportId: step.configReportId,
          });
        },
        (time += 350)
      );

      // Step 4: Save - add widget to canvas and clear form
      addTimeout(
        () => {
          updateState({
            visibleWidgetIds: [...widgetsToAdd.slice(0, idx + 1).map((w) => w.widget.id)],
            selectedComponent: null,
            configTitle: '',
            configReportId: '',
          });
        },
        (time += 300)
      );
    });

    // Complete
    addTimeout(
      () => {
        updateState({
          phase: 'complete',
          agentStatus: 'complete',
          agentMessage: 'Dashboard created',
          agentProgress: 100,
          currentWidgetIndex: -1,
        });
      },
      (time += 400)
    );

    // Fade out glow after a moment
    addTimeout(
      () => {
        updateState({
          ambientGlowActive: false,
        });
      },
      (time += 1500)
    );

    // Hide progress bar
    addTimeout(
      () => {
        updateState({
          agentStatus: 'idle',
        });
      },
      (time += 500)
    );
  }, [clearAllTimeouts, addTimeout, updateState]);

  // Reset to landing page
  const reset = useCallback(() => {
    clearAllTimeouts();
    setState(initialState);
  }, [clearAllTimeouts]);

  // Move to chatting phase
  const startChatting = useCallback(() => {
    updateState({ phase: 'chatting' });
  }, [updateState]);

  // Show the plan for approval
  const showPlan = useCallback(() => {
    updateState({ phase: 'planning' });
  }, [updateState]);

  return {
    state,
    startChatting,
    showPlan,
    startBuildSequence,
    reset,
  };
}

// ============================================================================
// Toast Component (simple inline)
// ============================================================================

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

const SuccessToast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  useLayoutEffect(() => {
    const timeout = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[200]"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle size={14} weight="fill" className="text-emerald-600" />
        </div>
        <span className="text-[13px] font-medium text-gray-900">{message}</span>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Plan Approval Content
// ============================================================================

const planApprovalContent = `## Dashboard Build Plan

I'll create a comprehensive **Accounts at Risk** dashboard with the following:

### Data Tables (5)
1. **Account Health Scores** - Health metrics for all accounts
2. **Renewal Risk Analysis** - Upcoming renewals with risk levels
3. **Engagement Metrics** - Activity and engagement data
4. **Churn Indicators** - Signals predicting churn
5. **Support Ticket Trends** - Support history analysis

### Dashboard Widgets (6)
1. **Accounts at Risk** - Metric card showing count
2. **Total ARR at Risk** - Dollar amount at risk
3. **Risk by Region** - Bar chart breakdown
4. **Engagement Trend** - Line chart over time
5. **Risk Distribution** - Pie chart by category
6. **Accounts Requiring Action** - Detailed table

Ready to build this dashboard?`;

// ============================================================================
// Main Story Component
// ============================================================================

const AutoDashboardDemo = () => {
  const { state, startChatting, showPlan, startBuildSequence, reset } = useAutoDashboardOrchestrator();

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedSidebarItem, setSelectedSidebarItem] = useState<string>('dash-1');
  const [folders, setFolders] = useState<Folder[]>(dummyFolders);

  // Pane2 state
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // ChatPane state
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activePopover, setActivePopover] = useState<ActivePopover | undefined>();

  // Toast state
  const [showToast, setShowToast] = useState(false);

  // Show toast when complete
  useLayoutEffect(() => {
    if (state.phase === 'complete' && state.agentStatus === 'complete') {
      setShowToast(true);
    }
  }, [state.phase, state.agentStatus]);

  const currentDashboardName = 'Accounts at Risk Dashboard';

  // Build subtables list including auto-generated reports
  const subtablesWithAutoReports: SubtableItem[] =
    state.visibleReports.length > 0
      ? [
          {
            id: 'auto-generated',
            label: 'Auto Generated',
            isExpanded: true,
            children: state.visibleReports,
          },
        ]
      : [];

  // Build current layout and widgets from visible widget IDs
  const currentLayout = state.visibleWidgetIds
    .map((id) => widgetsToAdd.find((w) => w.widget.id === id)?.layout)
    .filter(Boolean) as LayoutItem[];

  const currentWidgets = state.visibleWidgetIds.reduce(
    (acc, id) => {
      const step = widgetsToAdd.find((w) => w.widget.id === id);
      if (step) {
        acc[id] = step.widget;
      }
      return acc;
    },
    {} as Record<string, DashboardWidgetData>
  );

  // Get reference context
  const getReferenceContext = (): ReferenceContext | undefined => {
    if (state.phase === 'landing') return undefined;
    return {
      type: 'dashboard',
      name: currentDashboardName,
      id: 'auto-dashboard',
    };
  };

  // Handle sidebar item click
  const handleSidebarItemClick = (id: string, _type: ItemType) => {
    setSelectedSidebarItem(id);
  };

  // Handle sending a message from the landing page
  const handleLandingMessage = (content: string) => {
    startChatting();

    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content,
    };
    setMessages([userMsg]);
    setIsStreaming(true);

    // Simulate AI response with plan
    setTimeout(() => {
      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: "I'll analyze your request and create a comprehensive dashboard. Let me show you my plan...",
        status: 'completed',
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(false);

      // Show the plan popover
      setTimeout(() => {
        showPlan();
        setActivePopover({
          intent: 'edit',
          title: 'Build Dashboard',
          content: planApprovalContent,
          primaryActionLabel: 'Build Dashboard',
          isStreaming: false,
        });
      }, 500);
    }, 1500);
  };

  // Handle chat message in chat phase
  const handleChatMessage = (content: string) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // Simulate response
    setTimeout(() => {
      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: "I understand. Let me show you an updated plan based on your feedback.",
        status: 'completed',
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(false);

      // Show plan again
      setTimeout(() => {
        setActivePopover({
          intent: 'edit',
          title: 'Build Dashboard',
          content: planApprovalContent,
          primaryActionLabel: 'Build Dashboard',
          isStreaming: false,
        });
      }, 500);
    }, 1000);
  };

  // Handle plan approval
  const handlePlanApproval = () => {
    setActivePopover(undefined);

    // Add confirmation message
    const confirmMsg: Message = {
      id: `msg-${Date.now()}`,
      type: 'assistant',
      content: "Building your dashboard now. Watch the magic happen...",
      status: 'completed',
    };
    setMessages((prev) => [...prev, confirmMsg]);

    // Start the build sequence
    setTimeout(() => {
      startBuildSequence();
    }, 300);
  };

  // Handle Pane1 config save (during auto-build this is controlled by orchestrator)
  const handleSaveConfig = (_config: ComponentConfig) => {
    // No-op during auto-build
  };

  // Handle reset
  const handleReset = () => {
    reset();
    setMessages([]);
    setActivePopover(undefined);
    setShowToast(false);
  };

  // Determine which phase we're showing
  const showLandingPage = state.phase === 'landing';
  const isBuilding = ['building-data', 'building-dashboard'].includes(state.phase);
  const showAgentBar = isBuilding || state.agentStatus === 'complete';

  return (
    <div className="flex h-full w-full gap-2 relative">
      {/* Ambient Glow Effect */}
      <AmbientGlow isActive={state.ambientGlowActive} intensity={0.4} animationSpeed={3} />

      {/* Agent Progress Bar */}
      <AgentProgressBar
        isVisible={showAgentBar}
        status={state.agentStatus}
        message={state.agentMessage}
        progress={state.agentProgress}
      />

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <SuccessToast message="Dashboard created" onDismiss={() => setShowToast(false)} />
        )}
      </AnimatePresence>

      {/* ChatSidebar */}
      <div
        style={{
          height: showAgentBar ? 'calc(100% - 48px)' : '100%',
          marginTop: showAgentBar ? '48px' : '0',
          width: isSidebarCollapsed ? '64px' : '260px',
          transition: 'width 0.3s ease, height 0.3s ease, margin-top 0.3s ease',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          border: '1px solid #f3f4f6',
          flexShrink: 0,
        }}
      >
        <ChatSidebar
          items={dummySidebarItems}
          folders={folders}
          selectedItemId={selectedSidebarItem}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onItemClick={handleSidebarItemClick}
          onNewChatClick={handleReset}
          onCreateDashboard={(config) => console.log('Create Dashboard:', config)}
          onFolderToggle={(folderId, isExpanded) => {
            setFolders(folders.map((f) => (f.id === folderId ? { ...f, isExpanded } : f)));
          }}
          userName="John Doe"
          userEmail="john@example.com"
          avatarLabel="JD"
          hasNextPage={false}
        />
      </div>

      {/* Pane1 - Component/Data Selector */}
      {!showLandingPage && (
        <div
          style={{
            height: showAgentBar ? 'calc(100% - 48px)' : '100%',
            marginTop: showAgentBar ? '48px' : '0',
            width: '280px',
            flexShrink: 0,
            transition: 'height 0.3s ease, margin-top 0.3s ease',
          }}
        >
          <Pane1
            defaultTab={state.pane1Tab}
            controlledTab={state.pane1Tab}
            subtables={subtablesWithAutoReports}
            dataSources={allDataSources}
            onDragStart={() => {}}
            onComponentClick={() => {}}
            onSubtableClick={() => {}}
            onSaveConfig={handleSaveConfig}
            onDiscardConfig={() => {}}
            selectedComponent={state.selectedComponent}
            onSelectedComponentChange={() => {}}
            onConfigChange={() => {}}
            onTabChange={() => {}}
            controlledConfigTitle={state.configTitle}
            controlledConfigReportId={state.configReportId}
          />
        </div>
      )}

      {/* Main Content Area - Pane2 */}
      <div
        style={{
          height: showAgentBar ? 'calc(100% - 48px)' : '100%',
          marginTop: showAgentBar ? '48px' : '0',
          flex: 1,
          minWidth: 0,
          transition: 'height 0.3s ease, margin-top 0.3s ease',
        }}
      >
        {/* Landing Page */}
        {showLandingPage && (
          <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <ChatEmptyState
              userName="John"
              onSendMessage={handleLandingMessage}
              placeholder="Ask Von to build a dashboard..."
              showModeToggle={false}
            />
          </div>
        )}

        {/* Three-Pane Layout - Pane2 */}
        {!showLandingPage && (
          <Pane2
            mode={state.pane1Tab === 'data' ? 'data' : 'dashboard'}
            dashboardName={currentDashboardName}
            reportName="Select a report"
            layout={currentLayout}
            widgets={currentWidgets}
            onLayoutChange={() => {}}
            onWidgetSelect={setSelectedWidgetId}
            selectedWidgetId={selectedWidgetId}
            isEmpty={currentLayout.length === 0 && state.pane1Tab === 'dashboard'}
          />
        )}
      </div>

      {/* Pane3 - Chat (always visible except on landing) */}
      {!showLandingPage && (
        <div
          style={{
            height: showAgentBar ? 'calc(100% - 48px)' : '100%',
            marginTop: showAgentBar ? '48px' : '0',
            width: isChatCollapsed ? '48px' : '380px',
            transition: 'width 0.3s ease, height 0.3s ease, margin-top 0.3s ease',
            flexShrink: 0,
          }}
        >
          <ChatPane
            conversationName="Build with Von"
            messages={messages}
            isCollapsed={isChatCollapsed}
            onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
            onNewChat={handleReset}
            onViewHistory={() => console.log('View history')}
            onSendMessage={handleChatMessage}
            onStop={() => setIsStreaming(false)}
            isStreaming={isStreaming}
            referenceContext={getReferenceContext()}
            onRemoveReference={() => setSelectedWidgetId(null)}
            userName="John Doe"
            userEmail="john@example.com"
            showModeSelector={false}
            autoEditMode="off"
            activePopover={activePopover}
            onPopoverClose={() => setActivePopover(undefined)}
            onPopoverPrimaryAction={handlePlanApproval}
            onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Story Configuration
// ============================================================================

const meta = {
  title: '3-Pane/Jan30/Auto Dashboard',
  component: AutoDashboardDemo,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'neutral',
      values: [{ name: 'neutral', value: '#f5f5f7' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AutoDashboardDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * # Auto Dashboard - AI-Powered Dashboard Builder Demo
 *
 * This interactive prototype demonstrates the full AI-driven dashboard building experience
 * using the actual 3-pane layout components.
 *
 * ## How It Works
 *
 * ### Phase 1: Landing Page
 * - Start on the chat empty state with template suggestions
 * - Type a query like: **"Build me a dashboard showing accounts at risk of churning"**
 * - Or click any template to auto-fill the input
 *
 * ### Phase 2: Plan Approval
 * - Von analyzes your request and shows a detailed plan
 * - Review the proposed data tables and widgets
 * - Click **"Build Dashboard"** to approve and start building
 *
 * ### Phase 3: Data Table Creation
 * - Pane1 toggles to **Data** mode
 * - Watch reports being added to the listing one by one
 * - Progress bar shows real-time status
 *
 * ### Phase 4: Widget Creation
 * - Pane1 toggles to **Dashboard** mode
 * - For each widget:
 *   - Config form appears in Pane1 with component selected
 *   - Title is typed in
 *   - Report is selected
 *   - Widget appears on the canvas in Pane2
 *
 * ### Phase 5: Completion
 * - Toast notification shows "Dashboard created"
 * - Ambient glow fades out steadily
 * - Full dashboard is ready to explore
 *
 * ## Try It Out
 *
 * 1. Type: **"Show me accounts at risk of churning with health scores"**
 * 2. Review the plan and click **"Build Dashboard"**
 * 3. Watch the magic happen in Pane1 and Pane2!
 * 4. Explore your auto-generated dashboard
 *
 * ## Key Features
 *
 * - Uses actual Pane1 component (Data/Dashboard toggle, config form)
 * - Reports added progressively to Pane1 Data view
 * - Widget config shown in Pane1 Dashboard view (title typing, report selection)
 * - Widgets appear on Pane2 canvas with Highcharts
 * - Ambient glow and progress bar for premium feel
 * - Toast notification on completion (no popup)
 */
export const Default: Story = {
  decorators: [FullLayoutDecorator],
  render: () => <AutoDashboardDemo />,
};
