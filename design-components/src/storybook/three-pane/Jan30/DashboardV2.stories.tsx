import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, CaretLeftIcon, CaretRightIcon, StarIcon } from '@phosphor-icons/react';
import { ChatSidebarV4 } from '../../../components/Jan17Demo/ChatSidebarV4';
import type { SidebarItem, Folder, ItemType } from '../../../components/Jan17Demo/ChatSidebarV4';
import { StandardChatInput } from '../../../components/Chat/StandardChatInput';
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type Template,
  type TemplateCategory,
} from '../../../components/Templates';
import { FullScreenThinkingPlan } from '../../../components/Jan17Demo/FullScreenThinkingPlan';
import type { ThinkingStep, DashboardPlan } from '../../../components/Jan17Demo/FullScreenThinkingPlan';
import { ChatPaneV2 } from '../../../components/Jan17Demo/ChatPaneV2';
import type { ChatMessage, ReferenceContext } from '../../../components/Jan17Demo/ChatPaneV2';
import { DashboardV2 } from '../../../components/Jan17Demo/DashboardV2';
import type { KPICardData, ChartData, TableData } from '../../../components/Jan17Demo/DashboardV2';
import { InlineDrilldownPanel } from '../../../components/Jan17Demo/InlineDrilldownPanel';
import type { DrilldownFilter, DrilldownColumn } from '../../../components/Jan17Demo/InlineDrilldownPanel';
import { WidgetConfigModal } from '../../../components/Jan17Demo/WidgetConfigModal';
import type { WidgetConfigData, ChartType } from '../../../components/Jan17Demo/WidgetConfigModal';
import { AmbientGlow } from '../../../components/DashboardBuilder/InteractivePrototype/AmbientGlow';
import { AgentProgressBar } from '../../../components/DashboardBuilder/InteractivePrototype/AgentProgressBar';
import type { AgentStatus } from '../../../components/DashboardBuilder/InteractivePrototype/AgentProgressBar';
import {
  DashboardFilterModal,
  type DashboardFilterConfig,
  DashboardSharePopover,
  type ShareConfig,
} from '../../../components/popups';
import { opportunities } from '../data/salesData';

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

type DashboardPhase =
  | 'landing'
  | 'thinking'
  | 'planning'
  | 'building'
  | 'complete';

// ============================================================================
// Sidebar Data
// ============================================================================

const dummySidebarItems: SidebarItem[] = [
  { id: 'chat-1', label: 'Pipeline Analysis Q4', type: 'chat' },
  { id: 'chat-2', label: 'Win Rate Optimization', type: 'chat' },
  { id: 'chat-3', label: 'Revenue Forecast Discussion', type: 'chat' },
  { id: 'dash-1', label: 'Sales Overview', type: 'dashboard', ownership: 'mine' },
  { id: 'dash-2', label: 'Team Performance', type: 'dashboard', ownership: 'shared', ownerName: 'Sarah Chen' },
];

const dummyFolders: Folder[] = [
  { id: 'folder-1', label: 'Q4 Analysis', isExpanded: false },
];

// ============================================================================
// Dashboard Data
// ============================================================================

// Filter deals closing this quarter (Q1 2026)
const dealsThisQuarter = opportunities.filter((opp) => {
  const closeDate = new Date(opp.closeDate);
  return closeDate.getMonth() >= 0 && closeDate.getMonth() <= 2 && closeDate.getFullYear() === 2026;
});

// Calculate KPIs
const totalValue = dealsThisQuarter.reduce((sum, opp) => sum + opp.amount, 0);
const avgDealSize = totalValue / dealsThisQuarter.length || 0;

const kpiCards: KPICardData[] = [
  {
    id: 'kpi-total-value',
    title: 'Total Pipeline Value',
    value: `$${(totalValue / 1000000).toFixed(2)}M`,
    change: '+12.5%',
    changeDirection: 'up',
    subtitle: 'vs last quarter',
  },
  {
    id: 'kpi-deal-count',
    title: 'Deals Closing This Quarter',
    value: String(dealsThisQuarter.length),
    change: '+8',
    changeDirection: 'up',
    subtitle: 'new deals',
  },
  {
    id: 'kpi-avg-size',
    title: 'Average Deal Size',
    value: `$${(avgDealSize / 1000).toFixed(0)}K`,
    change: '-2.3%',
    changeDirection: 'down',
    subtitle: 'vs last quarter',
  },
];

// Bar chart: Deals by Stage
const stageData = dealsThisQuarter.reduce(
  (acc, opp) => {
    acc[opp.stage] = (acc[opp.stage] || 0) + opp.amount;
    return acc;
  },
  {} as Record<string, number>
);

const barChart: ChartData = {
  id: 'chart-by-stage',
  title: 'Pipeline by Stage',
  type: 'bar',
  data: {
    categories: Object.keys(stageData),
    series: [
      {
        name: 'Value',
        data: Object.values(stageData).map((v) => Math.round(v / 1000)),
      },
    ],
  },
};

// Pie chart: Deals by Risk
const riskData = dealsThisQuarter.reduce(
  (acc, opp) => {
    acc[opp.dealRisk] = (acc[opp.dealRisk] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

const pieChart: ChartData = {
  id: 'chart-by-risk',
  title: 'Deals by Risk Level',
  type: 'pie',
  data: [
    { name: 'Low Risk', y: riskData['Low'] || 0, color: '#10b981' },
    { name: 'Medium Risk', y: riskData['Medium'] || 0, color: '#f59e0b' },
    { name: 'High Risk', y: riskData['High'] || 0, color: '#ef4444' },
  ],
};

// Table data
const tableData: TableData = {
  id: 'table-deals',
  title: 'Deals Closing This Quarter',
  columns: [
    { id: 'name', label: 'Deal Name', type: 'string' },
    { id: 'accountName', label: 'Account', type: 'string' },
    { id: 'owner', label: 'Owner', type: 'string' },
    { id: 'amount', label: 'Amount', type: 'currency' },
    { id: 'closeDate', label: 'Close Date', type: 'date' },
    { id: 'probability', label: 'Probability', type: 'number' },
    { id: 'stage', label: 'Stage', type: 'string' },
  ],
  rows: dealsThisQuarter.map((opp) => ({
    name: opp.name,
    accountName: opp.accountName,
    owner: opp.owner,
    amount: opp.amount,
    closeDate: opp.closeDate,
    probability: opp.probability,
    stage: opp.stage,
  })),
};

// Dashboard plan
const dashboardPlan: DashboardPlan = {
  title: 'Deals Closing This Quarter Dashboard',
  description: `I'll create a dashboard showing ${dealsThisQuarter.length} deals totaling $${(totalValue / 1000000).toFixed(2)}M in pipeline value.`,
  kpis: ['Total Pipeline Value', 'Deal Count', 'Average Deal Size'],
  charts: ['Pipeline by Stage (Bar)', 'Deals by Risk (Pie)'],
  table: 'Full Deal Details Table',
};

// Thinking steps with details
const thinkingStepsConfig: ThinkingStep[] = [
  {
    id: 'step-1',
    text: 'Connecting to Salesforce',
    status: 'pending',
    icon: 'salesforce',
    detail: 'Authenticated via OAuth 2.0',
  },
  {
    id: 'step-2',
    text: 'Querying opportunity data',
    status: 'pending',
    icon: 'database',
    detail: 'SELECT Id, Name, Amount, CloseDate, Stage FROM Opportunity',
  },
  {
    id: 'step-3',
    text: 'Filtering deals closing Q1 2026',
    status: 'pending',
    icon: 'table',
    detail: `Found ${dealsThisQuarter.length} matching opportunities`,
  },
  {
    id: 'step-4',
    text: 'Calculating pipeline metrics',
    status: 'pending',
    icon: 'chart',
    detail: `Total value: $${(totalValue / 1000000).toFixed(2)}M, Avg deal: $${(avgDealSize / 1000).toFixed(0)}K`,
  },
  {
    id: 'step-5',
    text: 'Generating dashboard plan',
    status: 'pending',
    icon: 'chart',
    detail: '3 KPIs, 2 charts, 1 data table',
  },
];

// Drilldown data
const drilldownFilters: DrilldownFilter[] = [
  { id: 'filter-1', field: 'Close Date', operator: 'between', value: 'Q1 2026' },
  { id: 'filter-2', field: 'Stage', operator: 'not equals', value: 'Closed Lost' },
];

const drilldownFormula = 'SUM(Amount) WHERE CloseDate >= "2026-01-01" AND CloseDate <= "2026-03-31"';

// ============================================================================
// Toast Component
// ============================================================================

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

const SuccessToast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[200]"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />
        </div>
        <span className="text-[13px] font-medium text-gray-900">{message}</span>
        <button
          onClick={onDismiss}
          className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Landing Page Component with Templates
// ============================================================================

interface LandingPageProps {
  onSendMessage: (message: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState('Build me a dashboard showing deals closing this quarter');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('Popular');

  // Template state
  const templates = useMemo(() => {
    if (activeCategory === 'Popular') {
      return DEFAULT_TEMPLATES.filter((tpl) => tpl.isPopular === true);
    }
    return DEFAULT_TEMPLATES.filter((tpl) => tpl.category === activeCategory);
  }, [activeCategory]);

  // Scroll state for chevrons
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftChevron, setShowLeftChevron] = useState(false);
  const [showRightChevron, setShowRightChevron] = useState(true);

  const updateChevronVisibility = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftChevron(scrollLeft > 0);
    setShowRightChevron(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useLayoutEffect(() => {
    updateChevronVisibility();
  }, [templates, updateChevronVisibility]);

  const handleScroll = useCallback(() => {
    updateChevronVisibility();
  }, [updateChevronVisibility]);

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 804;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const handleCategoryChange = useCallback((category: TemplateCategory) => {
    setActiveCategory(category);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
    setShowLeftChevron(false);
    setShowRightChevron(true);
  }, []);

  const handleTemplateClick = useCallback((template: Template) => {
    setInputValue(template.prompt);
  }, []);

  const handleSend = useCallback((message: string) => {
    onSendMessage(message);
  }, [onSendMessage]);

  return (
    <motion.div
      className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col items-center justify-start pt-6 px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Spacer */}
      <div className="pt-24" />

      {/* Von Logo */}
      <motion.div
        className="mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
            fill="url(#paint0_radial_landing)"
          />
          <path
            d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
            stroke="white"
            strokeWidth="1.33"
          />
          <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
          <defs>
            <radialGradient
              id="paint0_radial_landing"
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
      </motion.div>

      {/* Greeting */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h2 className="text-3xl text-gray-900">Good afternoon, John</h2>
        <p className="text-3xl text-gray-600">How can I help you today?</p>
      </motion.div>

      {/* Chat Input */}
      <motion.div
        className="w-full max-w-3xl mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <StandardChatInput
          placeholder="Ask Von to build a dashboard..."
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
        />
      </motion.div>

      {/* Templates Section */}
      <motion.div
        className="w-full max-w-3xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {TEMPLATE_CATEGORIES.map((category) => {
            const isActive = category === activeCategory;
            const isPopular = category === 'Popular';
            return (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`
                  px-3 py-1 text-xs font-medium rounded-full
                  transition-all duration-200 inline-flex items-center gap-1 cursor-pointer
                  ${
                    isActive
                      ? 'bg-gray-100 border border-gray-100 shadow-sm text-gray-900'
                      : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200'
                  }
                `}
              >
                {isPopular && <StarIcon size={12} weight="fill" className="text-amber-500" />}
                {category}
              </button>
            );
          })}
        </div>

        {/* Templates Carousel */}
        <div className="relative">
          {/* Left Chevron */}
          {showLeftChevron && (
            <button
              onClick={() => scrollBy('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Scroll left"
            >
              <CaretLeftIcon size={16} weight="bold" className="text-gray-600" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto px-1 py-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="flex-shrink-0 w-48 px-4 py-2.5 shadow-xs rounded-xl bg-white border border-gray-200 text-left transition-all flex flex-col justify-start hover:border-gray-300 hover:shadow-sm cursor-pointer"
              >
                <div className="text-sm font-medium text-gray-700 line-clamp-3">
                  {template.shortPrompt}
                </div>
              </button>
            ))}
          </div>

          {/* Right Chevron */}
          {showRightChevron && templates.length > 3 && (
            <button
              onClick={() => scrollBy('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Scroll right"
            >
              <CaretRightIcon size={16} weight="bold" className="text-gray-600" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Disclaimer */}
      <motion.div
        className="w-full text-center pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <p className="text-xs text-gray-500">
          Von AI may make mistakes. Please recheck all important information.
        </p>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// Main Story Component
// ============================================================================

const DashboardV2Demo = () => {
  // Phase state
  const [phase, setPhase] = useState<DashboardPhase>('landing');

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedSidebarItem, setSelectedSidebarItem] = useState<string>('');
  const [folders, setFolders] = useState<Folder[]>(dummyFolders);

  // Thinking state
  const [userMessage, setUserMessage] = useState('');
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showPlan, setShowPlan] = useState(false);

  // Chat pane state
  const [isChatPaneCollapsed, setIsChatPaneCollapsed] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Dashboard build state
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [agentMessage, setAgentMessage] = useState('');
  const [agentProgress, setAgentProgress] = useState(0);
  const [ambientGlowActive, setAmbientGlowActive] = useState(false);

  // Drilldown state
  const [drilldownWidget, setDrilldownWidget] = useState<string | null>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);

  // Dashboard action popovers state
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterPopoverPosition, setFilterPopoverPosition] = useState<{ top: number; right: number }>({
    top: 60,
    right: 20,
  });
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [sharePopoverPosition, setSharePopoverPosition] = useState<{ top: number; right: number }>({
    top: 60,
    right: 20,
  });
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilterConfig>({
    dateRange: 'last-30-days',
    region: 'all',
    riskLevel: 'all',
  });

  // Widget config modal state
  const [showWidgetConfigModal, setShowWidgetConfigModal] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editingWidgetConfig, setEditingWidgetConfig] = useState<Partial<WidgetConfigData> | undefined>(undefined);

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay);
    timeoutsRef.current.push(timeout);
    return timeout;
  }, []);

  // Handle landing page message
  const handleLandingMessage = (content: string) => {
    setUserMessage(content);
    setPhase('thinking');
    setShowPlan(false);

    // Start timer
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Initialize thinking steps
    setThinkingSteps(thinkingStepsConfig.map((s) => ({ ...s, status: 'pending' as const })));

    // Simulate thinking steps
    let time = 0;
    thinkingStepsConfig.forEach((step, idx) => {
      // Start step
      addTimeout(() => {
        setThinkingSteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i === idx ? 'in-progress' : i < idx ? 'complete' : 'pending',
          }))
        );
      }, (time += 800));

      // Complete step
      addTimeout(() => {
        setThinkingSteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i <= idx ? 'complete' : 'pending',
          }))
        );
      }, (time += 600));
    });

    // Show plan after thinking
    addTimeout(() => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setPhase('planning');
      setShowPlan(true);
    }, time + 500);
  };

  // Handle build dashboard click
  const handleBuildDashboard = useCallback(() => {
    clearAllTimeouts();
    setPhase('building');
    setAmbientGlowActive(true);
    setAgentStatus('working');
    setAgentMessage('Building your dashboard...');
    setAgentProgress(0);
    setVisibleWidgets([]);
    setIsChatPaneCollapsed(true); // Ensure chat pane is collapsed

    // Add the conversation to chat messages (including the plan from thinking phase)
    setChatMessages([
      {
        id: 'msg-1',
        type: 'user',
        content: userMessage,
      },
      {
        id: 'msg-2',
        type: 'assistant',
        content: dashboardPlan.description,
        plan: dashboardPlan,
      },
    ]);

    let time = 0;
    const allWidgetIds = [
      ...kpiCards.map((k) => k.id),
      barChart.id,
      pieChart.id,
      tableData.id,
    ];

    // Build widgets one by one
    allWidgetIds.forEach((widgetId, idx) => {
      addTimeout(() => {
        setAgentMessage(`Adding widget ${idx + 1} of ${allWidgetIds.length}...`);
        setAgentProgress(((idx + 1) / allWidgetIds.length) * 100);
        setVisibleWidgets((prev) => [...prev, widgetId]);
      }, (time += 600));
    });

    // Complete
    addTimeout(() => {
      setPhase('complete');
      setAgentStatus('complete');
      setAgentMessage('Dashboard created');
      setAgentProgress(100);
      setShowToast(true);
      setIsChatPaneCollapsed(false); // Open chat pane by default when complete
    }, time + 400);

    // Fade out glow
    addTimeout(() => {
      setAmbientGlowActive(false);
    }, time + 1500);

    // Hide progress bar
    addTimeout(() => {
      setAgentStatus('idle');
    }, time + 2500);
  }, [clearAllTimeouts, addTimeout]);

  // Reset to landing
  const handleReset = useCallback(() => {
    clearAllTimeouts();
    setPhase('landing');
    setUserMessage('');
    setThinkingSteps([]);
    setElapsedTime(0);
    setShowPlan(false);
    setVisibleWidgets([]);
    setAgentStatus('idle');
    setAgentMessage('');
    setAgentProgress(0);
    setAmbientGlowActive(false);
    setShowToast(false);
    setIsChatPaneCollapsed(true);
    setChatMessages([]);
  }, [clearAllTimeouts]);

  // Handle sidebar item click
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSidebarItemClick = (id: string, _type: ItemType) => {
    setSelectedSidebarItem(id);
  };

  // Handle dashboard filter
  const handleFilterApply = (filters: DashboardFilterConfig) => {
    setDashboardFilters(filters);
    console.log('Dashboard filters applied:', filters);
  };

  // Handle dashboard export
  const handleExport = () => {
    console.log('Exporting dashboard as PDF...');
    alert('Dashboard export started! PDF will be downloaded shortly.');
  };

  // Handle dashboard refresh
  const handleRefresh = () => {
    console.log('Refreshing dashboard data...');
    alert('Dashboard refreshed! Data updated.');
  };

  // Handle dashboard share
  const handleShare = (config: ShareConfig) => {
    console.log('Sharing dashboard with config:', config);
    alert(`Dashboard shared with ${config.recipients.length} recipient(s)!`);
  };

  // Handle widget edit
  const handleWidgetEdit = (widgetId: string) => {
    // Determine widget type based on ID
    let chartType: ChartType = 'bar';
    let widgetName = '';

    if (widgetId.startsWith('kpi-')) {
      chartType = 'metric';
      widgetName = kpiCards.find((k) => k.id === widgetId)?.title || '';
    } else if (widgetId === barChart.id) {
      chartType = 'bar';
      widgetName = barChart.title;
    } else if (widgetId === pieChart.id) {
      chartType = 'pie';
      widgetName = pieChart.title;
    } else if (widgetId === tableData.id) {
      chartType = 'table';
      widgetName = tableData.title;
    }

    setEditingWidgetId(widgetId);
    setEditingWidgetConfig({
      name: widgetName,
      chartType,
      dataSourceId: 'ds-1', // Default data source
    });
    setShowWidgetConfigModal(true);
  };

  // Handle widget config save
  const handleWidgetConfigSave = (config: WidgetConfigData) => {
    console.log('Widget config saved:', config);
    setShowWidgetConfigModal(false);
    setEditingWidgetId(null);
    setEditingWidgetConfig(undefined);
  };

  // Determine what to show
  const showLandingPage = phase === 'landing';
  const showThinkingPlan = phase === 'thinking' || phase === 'planning';
  const showDashboard = phase === 'building' || phase === 'complete';
  const showAgentBar = phase === 'building' || agentStatus === 'complete';
  const isThinking = phase === 'thinking';

  // Get drilldown data for selected widget
  const getDrilldownData = () => {
    if (!drilldownWidget) return null;

    const columns: DrilldownColumn[] = tableData.columns;
    const rows = tableData.rows;

    return { columns, rows };
  };

  const drilldownData = getDrilldownData();

  return (
    <div className="flex h-full w-full gap-2 relative">
      {/* Ambient Glow */}
      <AmbientGlow isActive={ambientGlowActive} intensity={0.4} animationSpeed={3} />

      {/* Agent Progress Bar */}
      <AgentProgressBar
        isVisible={showAgentBar}
        status={agentStatus}
        message={agentMessage}
        progress={agentProgress}
      />

      {/* Toast */}
      <AnimatePresence>
        {showToast && <SuccessToast message="Dashboard created" onDismiss={() => setShowToast(false)} />}
      </AnimatePresence>

      {/* ChatSidebarV4 - Always collapsed */}
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
        <ChatSidebarV4
          items={dummySidebarItems}
          folders={folders}
          selectedItemId={selectedSidebarItem}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onItemClick={handleSidebarItemClick}
          onNewChatClick={handleReset}
          onFolderToggle={(folderId, isExpanded) => {
            setFolders(folders.map((f) => (f.id === folderId ? { ...f, isExpanded } : f)));
          }}
          userName="John Doe"
          userEmail="john@example.com"
          avatarLabel="JD"
          hasNextPage={false}
        />
      </div>

      {/* Main Content */}
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
        {showLandingPage && <LandingPage onSendMessage={handleLandingMessage} />}

        {/* Full Screen Thinking & Plan */}
        {showThinkingPlan && (
          <FullScreenThinkingPlan
            userMessage={userMessage}
            thinkingSteps={thinkingSteps}
            isThinking={isThinking}
            elapsedTime={elapsedTime}
            plan={dashboardPlan}
            showPlan={showPlan}
            onBuildDashboard={handleBuildDashboard}
            onDiscardPlan={handleReset}
            userName="John Doe"
            userEmail="john@example.com"
          />
        )}

        {/* Dashboard with Inline Drilldown Panel */}
        {showDashboard && (
          <div className="relative h-full w-full">
            <DashboardV2
              name="Deals Closing This Quarter"
              kpiCards={kpiCards}
              barChart={barChart}
              pieChart={pieChart}
              table={tableData}
              isBuilding={phase === 'building'}
              visibleWidgets={visibleWidgets}
              onWidgetDrillDown={(widgetId) => setDrilldownWidget(widgetId)}
              onWidgetEdit={handleWidgetEdit}
              onWidgetDelete={(widgetId) => console.log('Delete widget:', widgetId)}
              onFilterClick={(rect) => {
                setFilterPopoverPosition({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                });
                setShowFilterPopover(true);
              }}
              onExportClick={handleExport}
              onRefreshClick={handleRefresh}
              onShareClick={(rect) => {
                setSharePopoverPosition({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                });
                setShowSharePopover(true);
              }}
              onEditClick={() => console.log('Edit dashboard mode')}
            />

            {/* Inline Drilldown Panel inside Pane2 */}
            <AnimatePresence>
              {drilldownWidget && drilldownData && (
                <InlineDrilldownPanel
                  isOpen={!!drilldownWidget}
                  onClose={() => setDrilldownWidget(null)}
                  widgetName={
                    kpiCards.find((k) => k.id === drilldownWidget)?.title ||
                    (barChart.id === drilldownWidget
                      ? barChart.title
                      : pieChart.id === drilldownWidget
                        ? pieChart.title
                        : tableData.id === drilldownWidget
                          ? tableData.title
                          : 'Widget')
                  }
                  columns={drilldownData.columns}
                  rows={drilldownData.rows}
                  filters={drilldownFilters}
                  formula={drilldownFormula}
                  onFiltersChange={(filters) => console.log('Filters changed:', filters)}
                  onFormulaChange={(formula) => console.log('Formula changed:', formula)}
                  availableFields={tableData.columns.map((c) => c.label)}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ChatPaneV2 - Collapsed during dashboard view */}
      {showDashboard && (
        <div
          style={{
            height: showAgentBar ? 'calc(100% - 48px)' : '100%',
            marginTop: showAgentBar ? '48px' : '0',
            width: isChatPaneCollapsed ? '48px' : '380px',
            transition: 'width 0.3s ease, height 0.3s ease, margin-top 0.3s ease',
            flexShrink: 0,
          }}
        >
          <ChatPaneV2
            conversationName="Build with Von"
            messages={chatMessages}
            isCollapsed={isChatPaneCollapsed}
            onToggleCollapse={() => setIsChatPaneCollapsed(!isChatPaneCollapsed)}
            placeholder="Make changes to this dashboard..."
            referenceContext={{
              type: 'dashboard',
              name: 'Deals Closing This Quarter',
              id: 'dashboard-deals-q1',
            } as ReferenceContext}
          />
        </div>
      )}

      {/* Dashboard Filter Popover */}
      <DashboardFilterModal
        isOpen={showFilterPopover}
        position={filterPopoverPosition}
        currentFilters={dashboardFilters}
        onApply={handleFilterApply}
        onClose={() => setShowFilterPopover(false)}
      />

      {/* Dashboard Share Popover */}
      <DashboardSharePopover
        isOpen={showSharePopover}
        position={sharePopoverPosition}
        currentConfig={{
          recipients: [],
          accessLevel: 'restricted',
        }}
        onShare={handleShare}
        onClose={() => setShowSharePopover(false)}
      />

      {/* Widget Config Modal */}
      <WidgetConfigModal
        isOpen={showWidgetConfigModal}
        onClose={() => {
          setShowWidgetConfigModal(false);
          setEditingWidgetId(null);
          setEditingWidgetConfig(undefined);
        }}
        onSave={handleWidgetConfigSave}
        existingConfig={editingWidgetConfig}
        widgetId={editingWidgetId || undefined}
        mode="edit"
      />
    </div>
  );
};

// ============================================================================
// Story Configuration
// ============================================================================

const meta = {
  title: '3-Pane/Jan30/Dashboard v2',
  component: DashboardV2Demo,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'neutral',
      values: [{ name: 'neutral', value: '#f5f5f7' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DashboardV2Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * # Dashboard v2 - Deals Closing This Quarter
 *
 * An interactive prototype showing the complete flow from chat to dashboard.
 *
 * ## Flow
 *
 * 1. **Landing Page** - User sees chat empty state with pre-filled prompt
 * 2. **Full Screen Thinking** - Shows timeline thinking process in main area
 * 3. **Full Screen Plan** - Displays plan with Build Dashboard button in main area
 * 4. **Building** - Animated dashboard construction with progress bar
 * 5. **Complete** - Final dashboard with drilldown functionality
 *
 * ## Features
 *
 * - **Full Screen Thinking & Plan** - No chat pane during thinking/planning phases
 * - **Timeline Thinking Process** - Shows real-time thinking steps
 * - **Plan Card with Build Button** - Clear action to start building
 * - **Animated Dashboard Build** - Widgets appear one by one
 * - **Widget Drilldowns** - Click table icon to see full data
 * - **Filters & Formula Popovers** - View applied filters and calculations
 *
 * ## Dashboard Components
 *
 * - 3 KPI Cards (Total Value, Deal Count, Avg Size)
 * - 1 Bar Chart (Pipeline by Stage)
 * - 1 Pie Chart (Deals by Risk)
 * - 1 Data Table (All Deals)
 */
export const Default: Story = {
  decorators: [FullLayoutDecorator],
  render: () => <DashboardV2Demo />,
};
