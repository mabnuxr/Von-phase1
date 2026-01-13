import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LayoutItem } from 'react-grid-layout';
import { CheckCircle } from '@phosphor-icons/react';
import { ChatSidebarV3 } from '../../../components/ChatSidebarV3/ChatSidebarV3';
import type {
  SidebarItem,
  Folder,
  ItemType,
} from '../../../components/ChatSidebarV3/ChatSidebarV3';
import { Pane1 } from '../../../components/Pane1/Pane1';
import type {
  ChartComponent,
  SubtableItem,
  ComponentConfig,
} from '../../../components/Pane1/Pane1';
import { Pane2 } from '../../../components/layouts/Pane2';
import type { DashboardWidgetData } from '../../../components/layouts/Pane2';
import { ChatPane } from '../../../components/ChatPane/ChatPane';
import type { Message } from '../../../components/Chat/types';
import type { ReferenceContext, ActivePopover } from '../../../components/ChatPane/types';
import { ChatEmptyState } from '../../../components/Chat/ChatEmptyState';
import { AmbientGlow } from '../../../components/DashboardBuilder/InteractivePrototype/AmbientGlow';
import { AgentProgressBar } from '../../../components/DashboardBuilder/InteractivePrototype/AgentProgressBar';
import type { AgentStatus } from '../../../components/DashboardBuilder/InteractivePrototype/AgentProgressBar';
import { ReportTable } from '../../../components/ReportTable/ReportTable';
import type { ReportColumn } from '../../../components/ReportTable/ReportTable';
import { opportunities, reports } from '../data/salesData';

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

interface DataTableConfig {
  id: string;
  label: string;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
}

interface OrchestratorState {
  phase: AutoDashboardPhase;
  agentStatus: AgentStatus;
  agentMessage: string;
  agentProgress: number;
  pane1Tab: 'data' | 'dashboard';
  // Data phase
  visibleReports: SubtableItem[];
  currentDataTableIndex: number;
  // Dashboard phase
  visibleWidgetIds: string[];
  currentWidgetIndex: number;
  selectedComponent: ChartComponent | null;
  configTitle: string;
  configReportId: string;
  ambientGlowActive: boolean;
}

// ============================================================================
// Sidebar Data
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
  {
    id: 'dash-3',
    label: 'Executive Dashboard',
    type: 'dashboard',
    ownership: 'shared',
    ownerName: 'Sarah Chen',
  },
  { id: 'dash-4', label: 'Regional Metrics', type: 'dashboard', ownership: 'shared_by_me' },
  { id: 'chat-f1-1', label: 'Q4 Pipeline Deep Dive', type: 'chat', folderId: 'folder-1' },
  { id: 'chat-f1-2', label: 'Q4 Revenue Projections', type: 'chat', folderId: 'folder-1' },
  {
    id: 'dash-f2-1',
    label: 'Weekly Sales Report',
    type: 'dashboard',
    folderId: 'folder-2',
    ownership: 'mine',
  },
];

const dummyFolders: Folder[] = [
  { id: 'folder-1', label: 'Q4 Analysis', isExpanded: true },
  { id: 'folder-2', label: 'Weekly Reports', isExpanded: false },
  { id: 'folder-3', label: 'Executive Prep', isExpanded: false },
];

// ============================================================================
// Realistic Data for "Deals at Risk" Dashboard
// ============================================================================

// Filter opportunities that are at risk (Medium or High risk, not closed)
const dealsAtRisk = opportunities.filter(
  (opp) =>
    (opp.dealRisk === 'High' || opp.dealRisk === 'Medium') &&
    opp.stage !== 'Closed Won' &&
    opp.stage !== 'Closed Lost'
);

// Filter deals closing this month (January 2026)
const dealsAtRiskThisMonth = dealsAtRisk.filter((opp) => {
  const closeDate = new Date(opp.closeDate);
  return closeDate.getMonth() === 0 && closeDate.getFullYear() === 2026;
});

// Calculate totals
const totalValueAtRisk = dealsAtRisk.reduce((sum, opp) => sum + opp.amount, 0);
const numberOfDealsAtRisk = dealsAtRisk.length;
const dealsAtRiskThisMonthCount = dealsAtRiskThisMonth.length;

// Data tables that will be created during the data phase
const dataTablesConfig: DataTableConfig[] = [
  {
    id: 'deals-at-risk-all',
    label: 'All Deals at Risk',
    columns: [
      { id: 'name', label: 'Deal Name', type: 'string' },
      { id: 'accountName', label: 'Account', type: 'string' },
      { id: 'owner', label: 'Owner', type: 'string' },
      { id: 'amount', label: 'Amount', type: 'currency' },
      { id: 'closeDate', label: 'Close Date', type: 'date' },
      { id: 'dealRisk', label: 'Risk Level', type: 'string' },
      { id: 'stage', label: 'Stage', type: 'string' },
    ],
    data: dealsAtRisk.map((opp) => ({
      id: opp.id,
      name: opp.name,
      accountName: opp.accountName,
      owner: opp.owner,
      amount: opp.amount,
      closeDate: opp.closeDate,
      dealRisk: opp.dealRisk,
      stage: opp.stage,
    })),
  },
  {
    id: 'deals-at-risk-monthly',
    label: 'Deals at Risk - This Month',
    columns: [
      { id: 'name', label: 'Deal Name', type: 'string' },
      { id: 'accountName', label: 'Account', type: 'string' },
      { id: 'owner', label: 'Owner', type: 'string' },
      { id: 'amount', label: 'Amount', type: 'currency' },
      { id: 'closeDate', label: 'Close Date', type: 'date' },
      { id: 'probability', label: 'Probability', type: 'number' },
    ],
    data: dealsAtRiskThisMonth.map((opp) => ({
      id: opp.id,
      name: opp.name,
      accountName: opp.accountName,
      owner: opp.owner,
      amount: opp.amount,
      closeDate: opp.closeDate,
      probability: opp.probability,
    })),
  },
  {
    id: 'risk-by-owner',
    label: 'Risk by Owner',
    columns: [
      { id: 'owner', label: 'Sales Rep', type: 'string' },
      { id: 'dealCount', label: 'Deals at Risk', type: 'number' },
      { id: 'totalValue', label: 'Total Value', type: 'currency' },
      { id: 'avgProbability', label: 'Avg Probability', type: 'number' },
    ],
    data: (() => {
      const byOwner: Record<string, { count: number; value: number; probSum: number }> = {};
      dealsAtRisk.forEach((opp) => {
        if (!byOwner[opp.owner]) {
          byOwner[opp.owner] = { count: 0, value: 0, probSum: 0 };
        }
        byOwner[opp.owner].count++;
        byOwner[opp.owner].value += opp.amount;
        byOwner[opp.owner].probSum += opp.probability;
      });
      return Object.entries(byOwner).map(([owner, stats]) => ({
        owner,
        dealCount: stats.count,
        totalValue: stats.value,
        avgProbability: Math.round(stats.probSum / stats.count),
      }));
    })(),
  },
];

// Reports to be added during the data phase (shown in Pane1 sidebar)
const reportsToAdd: SubtableItem[] = dataTablesConfig.map((table) => ({
  id: table.id,
  label: table.label,
}));

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
// Layout: 3 KPI cards on top, line chart below, table at bottom
const widgetsToAdd: WidgetBuildStep[] = [
  // Row 1: 3 KPI Cards
  {
    widget: {
      id: 'widget-total-value',
      type: 'metric',
      chartType: 'metric',
      title: 'Total Value at Risk',
      reportId: 'deals-at-risk-all',
      config: { metricValue: `$${(totalValueAtRisk / 1000000).toFixed(1)}M` },
    },
    layout: { i: 'widget-total-value', x: 0, y: 0, w: 3, h: 3 },
    configTitle: 'Total Value at Risk',
    configReportId: 'deals-at-risk-all',
    component: chartComponents.metric,
  },
  {
    widget: {
      id: 'widget-deal-count',
      type: 'metric',
      chartType: 'metric',
      title: 'Number of Deals at Risk',
      reportId: 'deals-at-risk-all',
      config: { metricValue: String(numberOfDealsAtRisk) },
    },
    layout: { i: 'widget-deal-count', x: 3, y: 0, w: 3, h: 3 },
    configTitle: 'Number of Deals at Risk',
    configReportId: 'deals-at-risk-all',
    component: chartComponents.metric,
  },
  {
    widget: {
      id: 'widget-this-month',
      type: 'metric',
      chartType: 'metric',
      title: 'At Risk This Month',
      reportId: 'deals-at-risk-monthly',
      config: { metricValue: String(dealsAtRiskThisMonthCount) },
    },
    layout: { i: 'widget-this-month', x: 6, y: 0, w: 3, h: 3 },
    configTitle: 'At Risk This Month',
    configReportId: 'deals-at-risk-monthly',
    component: chartComponents.metric,
  },
  // Row 2: Line Chart
  {
    widget: {
      id: 'widget-trend',
      type: 'chart',
      chartType: 'line',
      title: 'Deals at Risk Trend',
      reportId: 'deals-at-risk-all',
    },
    layout: { i: 'widget-trend', x: 0, y: 3, w: 9, h: 4 },
    configTitle: 'Deals at Risk Trend',
    configReportId: 'deals-at-risk-all',
    component: chartComponents.line,
  },
  // Row 3: Table
  {
    widget: {
      id: 'widget-table',
      type: 'table',
      chartType: 'table',
      title: 'All Deals at Risk',
      reportId: 'deals-at-risk-all',
    },
    layout: { i: 'widget-table', x: 0, y: 7, w: 9, h: 5 },
    configTitle: 'All Deals at Risk',
    configReportId: 'deals-at-risk-all',
    component: chartComponents.table,
  },
];

// Data sources for the dropdown (combine auto-generated + existing reports)
const allDataSources = [
  ...dataTablesConfig.map((t) => ({ id: t.id, label: t.label, columnCount: t.columns.length })),
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
  currentDataTableIndex: -1,
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
      agentMessage: 'Analyzing your Salesforce data...',
      agentProgress: 5,
      ambientGlowActive: true,
      pane1Tab: 'data',
    });

    // Add reports one by one to Pane1 and show table in Pane2
    dataTablesConfig.forEach((table, idx) => {
      addTimeout(
        () => {
          updateState({
            agentMessage: `Creating ${table.label}...`,
            agentProgress: 5 + ((idx + 1) / dataTablesConfig.length) * 40,
            visibleReports: reportsToAdd.slice(0, idx + 1),
            currentDataTableIndex: idx,
          });
        },
        (time += 1200)
      );
    });

    // Brief pause after data tables
    time += 600;

    // Phase 2: Switch to Dashboard tab and start adding widgets
    addTimeout(() => {
      updateState({
        phase: 'building-dashboard',
        agentMessage: 'Building dashboard widgets...',
        agentProgress: 50,
        pane1Tab: 'dashboard',
        currentDataTableIndex: -1,
      });
    }, time);

    time += 400;

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
        (time += 500)
      );

      // Step 2: Type the name
      addTimeout(
        () => {
          updateState({
            configTitle: step.configTitle,
          });
        },
        (time += 400)
      );

      // Step 3: Select report
      addTimeout(
        () => {
          updateState({
            configReportId: step.configReportId,
          });
        },
        (time += 400)
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
        (time += 350)
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
      (time += 500)
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
// Toast Component
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

I'll create a **Deals at Risk** dashboard to help you track and manage at-risk opportunities.

### Data Tables (3)
1. **All Deals at Risk** - ${numberOfDealsAtRisk} deals with Medium/High risk
2. **Deals at Risk - This Month** - ${dealsAtRiskThisMonthCount} deals closing in January
3. **Risk by Owner** - Aggregated view by sales rep

### Dashboard Widgets (5)
1. **Total Value at Risk** - $${(totalValueAtRisk / 1000000).toFixed(1)}M at risk
2. **Number of Deals at Risk** - ${numberOfDealsAtRisk} total deals
3. **At Risk This Month** - ${dealsAtRiskThisMonthCount} deals closing soon
4. **Deals at Risk Trend** - Line chart showing risk over time
5. **All Deals at Risk** - Detailed table with all fields

### Data Sources
- Salesforce Opportunities
- Risk scoring from engagement data
- Close date analysis

Ready to build this dashboard?`;

// ============================================================================
// Main Story Component
// ============================================================================

const AutoDashboardDemo = () => {
  const { state, startChatting, showPlan, startBuildSequence, reset } =
    useAutoDashboardOrchestrator();

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

  const currentDashboardName = 'Deals at Risk Dashboard';

  // Build subtables list including auto-generated reports
  const subtablesWithAutoReports: SubtableItem[] =
    state.visibleReports.length > 0
      ? [
          {
            id: 'auto-generated',
            label: 'Generated Reports',
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

  // Get the current data table being shown (during data phase)
  const currentDataTable =
    state.currentDataTableIndex >= 0 ? dataTablesConfig[state.currentDataTableIndex] : null;

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        content:
          "I'll analyze your Salesforce data to identify deals at risk. I found several opportunities that need attention. Let me show you my plan...",
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
        content: 'I understand. Let me show you an updated plan based on your feedback.',
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
      content: 'Building your dashboard now. Watch as I create each component...',
      status: 'completed',
    };
    setMessages((prev) => [...prev, confirmMsg]);

    // Start the build sequence
    setTimeout(() => {
      startBuildSequence();
    }, 300);
  };

  // Handle Pane1 config save (during auto-build this is controlled by orchestrator)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Render the data table for Pane2 during data phase
  const renderReportTable = () => {
    if (state.pane1Tab !== 'data' || !currentDataTable) return undefined;

    return (
      <ReportTable
        columns={currentDataTable.columns}
        data={currentDataTable.data}
        onRowSelect={(row, selected) => console.log('Row selected:', row, selected)}
        onRowOpen={(row) => console.log('Row opened:', row)}
        pageSize={10}
      />
    );
  };

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
        <ChatSidebarV3
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
              defaultValue="Build me a dashboard of my deals at risk"
            />
          </div>
        )}

        {/* Three-Pane Layout - Pane2 */}
        {!showLandingPage && (
          <Pane2
            mode={state.pane1Tab === 'data' ? 'data' : 'dashboard'}
            dashboardName={currentDashboardName}
            reportName={currentDataTable?.label || 'Select a report'}
            layout={currentLayout}
            widgets={currentWidgets}
            onLayoutChange={() => {}}
            onWidgetSelect={setSelectedWidgetId}
            selectedWidgetId={selectedWidgetId}
            isEmpty={currentLayout.length === 0 && state.pane1Tab === 'dashboard'}
            reportTableContent={renderReportTable()}
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
 * # Auto Dashboard - Deals at Risk Demo
 *
 * A realistic end-to-end demo of AI-powered dashboard creation for tracking deals at risk.
 *
 * ## The Scenario
 *
 * The user asks: **"Build me a dashboard of my deals at risk"**
 *
 * Von analyzes the Salesforce data and finds:
 * - **${numberOfDealsAtRisk} deals** at Medium/High risk
 * - **$${(totalValueAtRisk / 1000000).toFixed(1)}M** total value at risk
 * - **${dealsAtRiskThisMonthCount} deals** closing this month
 *
 * ## What Gets Built
 *
 * ### Data Phase (Pane2 shows tables)
 * 1. **All Deals at Risk** - Full list with risk levels, amounts, close dates
 * 2. **Deals at Risk - This Month** - Urgent deals closing in January
 * 3. **Risk by Owner** - Aggregated view by sales rep
 *
 * ### Dashboard Phase (Widgets appear on canvas)
 * 1. **Total Value at Risk** - KPI card showing $${(totalValueAtRisk / 1000000).toFixed(1)}M
 * 2. **Number of Deals at Risk** - KPI card showing ${numberOfDealsAtRisk}
 * 3. **At Risk This Month** - KPI card showing ${dealsAtRiskThisMonthCount}
 * 4. **Deals at Risk Trend** - Line chart
 * 5. **All Deals at Risk** - Detailed table widget
 *
 * ## How to Use
 *
 * 1. The landing page pre-fills: **"Build me a dashboard of my deals at risk"**
 * 2. Press Enter or click Send
 * 3. Review the plan showing real data counts
 * 4. Click **"Build Dashboard"** to approve
 * 5. Watch:
 *    - Data tab: Tables appear in Pane2 with real opportunity data
 *    - Reports added to Pane1 sidebar
 *    - Dashboard tab: Widgets configured and added one by one
 * 6. Explore your completed dashboard!
 */
export const Default: Story = {
  decorators: [FullLayoutDecorator],
  render: () => <AutoDashboardDemo />,
};
