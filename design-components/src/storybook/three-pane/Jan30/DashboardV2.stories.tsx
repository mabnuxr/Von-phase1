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
import type {
  ThinkingStep,
  DashboardPlan,
} from '../../../components/Jan17Demo/FullScreenThinkingPlan';
import { Chat } from '../../../components/Chat';
import type { Message } from '../../../components/Chat/types';
import type { ReferenceContext } from '../../../components/Chat/StandardChatInput/types';
import { DashboardV2 } from '../../../components/Jan17Demo/DashboardV2';
import type {
  KPICardData,
  ChartData,
  TableData,
  TimelineFilter,
  DashboardFilter,
  OwnerOption,
  TextWidgetData,
} from '../../../components/Jan17Demo/DashboardV2';
import { InlineDrilldownPanel } from '../../../components/Jan17Demo/InlineDrilldownPanel';
import type {
  DrilldownFilter,
  DrilldownColumn,
} from '../../../components/Jan17Demo/InlineDrilldownPanel';
import { TransparencyDrawer } from '../../../components/Jan17Demo/TransparencyDrawer';
import type { QueryResult, CallTranscript } from '../../../components/Jan17Demo/TransparencyDrawer';
import { WidgetConfigModal } from '../../../components/Jan17Demo/WidgetConfigModal';
import type { WidgetConfigData, ChartType } from '../../../components/Jan17Demo/WidgetConfigModal';
import { WidgetEditSheet } from '../../../components/Jan17Demo/WidgetEditSheet';
import type { WidgetConfigData as WidgetEditConfigData } from '../../../components/Jan17Demo/WidgetEditSheet';
import { AmbientGlow } from '../../../components/Jan17Demo/AmbientGlow';
import { AgentProgressBar } from '../../../components/Jan17Demo/AgentProgressBar';
import type { AgentStatus } from '../../../components/Jan17Demo/AgentProgressBar';
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

type DashboardPhase = 'landing' | 'thinking' | 'planning' | 'building' | 'complete';

// ============================================================================
// Sidebar Data
// ============================================================================

const dummySidebarItems: SidebarItem[] = [
  { id: 'chat-1', label: 'Pipeline Analysis Q4', type: 'chat' },
  { id: 'chat-2', label: 'Win Rate Optimization', type: 'chat' },
  { id: 'chat-3', label: 'Revenue Forecast Discussion', type: 'chat' },
  { id: 'dash-1', label: 'Sales Overview', type: 'dashboard', ownership: 'mine' },
  {
    id: 'dash-2',
    label: 'Team Performance',
    type: 'dashboard',
    ownership: 'shared',
    ownerName: 'Sarah Chen',
  },
];

const dummyFolders: Folder[] = [{ id: 'folder-1', label: 'Q4 Analysis', isExpanded: false }];

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
    kpi: {
      value: totalValue,
      format: ',.0f',
      prefix: '$',
      suffix: null,
      comparison: {
        value: 12.5,
        format: '.1f',
        suffix: '%',
        label: 'vs last quarter',
        positive_is_good: true,
      },
      target: {
        value: 15000000,
        format: ',.0f',
        label: 'Target',
      },
    },
  },
  {
    id: 'kpi-deal-count',
    title: 'Deals Closing This Quarter',
    kpi: {
      value: dealsThisQuarter.length,
      format: ',.0f',
      prefix: null,
      suffix: null,
      comparison: {
        value: 8,
        format: ',.0f',
        suffix: null,
        label: 'new deals',
        positive_is_good: true,
      },
      target: {
        value: 50,
        format: ',.0f',
        label: 'Target',
      },
    },
  },
  {
    id: 'kpi-avg-size',
    title: 'Average Deal Size',
    kpi: {
      value: avgDealSize,
      format: ',.0f',
      prefix: '$',
      suffix: null,
      comparison: {
        value: -2.3,
        format: '.1f',
        suffix: '%',
        label: 'vs last quarter',
        positive_is_good: true,
      },
      target: {
        value: 400000,
        format: ',.0f',
        label: 'Target',
      },
    },
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

// Waterfall chart: Revenue Bridge
const waterfallChart: ChartData = {
  id: 'chart-waterfall',
  title: 'Q1 Revenue Bridge',
  type: 'waterfall',
  data: [
    { name: 'Starting ARR', y: 12500000, color: '#4f46e5' },
    { name: 'New Business', y: 2100000 },
    { name: 'Expansion', y: 850000 },
    { name: 'Subtotal', isIntermediateSum: true, color: '#6366f1' },
    { name: 'Churn', y: -420000 },
    { name: 'Contraction', y: -180000 },
    { name: 'Ending ARR', isSum: true, color: '#4f46e5' },
  ],
};

// Combination chart: Forecast vs Actuals (similar to the screenshot)
const combinationChart: ChartData = {
  id: 'chart-combination',
  title: 'AI Projection & Forecast',
  type: 'combination',
  data: {
    categories: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    series: [
      // Stacked column series for pipeline breakdown
      {
        type: 'column',
        name: 'Closed Won',
        data: [
          45000000, 42000000, 48000000, 38000000, 35000000, 32000000, 30000000, 28000000, 26000000,
          24000000, 22000000, 20000000,
        ],
        color: '#10b981',
        stack: 'pipeline',
      },
      {
        type: 'column',
        name: 'Commit',
        data: [
          25000000, 28000000, 22000000, 20000000, 22000000, 24000000, 22000000, 20000000, 18000000,
          16000000, 14000000, 12000000,
        ],
        color: '#6ee7b7',
        stack: 'pipeline',
      },
      {
        type: 'column',
        name: 'Best Case',
        data: [
          35000000, 32000000, 30000000, 25000000, 22000000, 20000000, 18000000, 16000000, 14000000,
          12000000, 10000000, 8000000,
        ],
        color: '#a7f3d0',
        stack: 'pipeline',
      },
      {
        type: 'column',
        name: 'Pipeline',
        data: [
          30000000, 31000000, 29000000, 19000000, 21000000, 22000000, 20000000, 20000000, 26000000,
          30000000, 20000000, 18000000,
        ],
        color: '#d1fae5',
        stack: 'pipeline',
      },
      // Line series for forecasts
      {
        type: 'spline',
        name: 'Team Call',
        data: [
          75000000, 75000000, 75000000, 75000000, 75000000, 75000000, 75000000, 75000000, 75000000,
          75000000, 75000000, 75000000,
        ],
        color: '#3b82f6',
        dashStyle: 'Solid',
        marker: { enabled: true, symbol: 'circle', radius: 4 },
      },
      {
        type: 'spline',
        name: 'AI Projection',
        data: [
          69120000, 68500000, 68000000, 67500000, 67000000, 66500000, 66000000, 65500000, 65000000,
          64500000, 64000000, 63500000,
        ],
        color: '#06b6d4',
        dashStyle: 'Dash',
        marker: { enabled: true, symbol: 'circle', radius: 4 },
      },
      {
        type: 'spline',
        name: 'Hard Commit',
        data: [
          68330000, 67800000, 67200000, 66500000, 65800000, 65000000, 64200000, 63500000, 62800000,
          62000000, 61200000, 60500000,
        ],
        color: '#f59e0b',
        dashStyle: 'Dot',
        marker: { enabled: true, symbol: 'circle', radius: 4 },
      },
    ],
  },
};

// AI column value generators
const aiDealHealthScores = ['Strong', 'At Risk', 'Healthy', 'Needs Attention', 'On Track'];
const aiNextActions = [
  'Schedule executive alignment call',
  'Send updated proposal',
  'Follow up on legal review',
  'Demo additional features',
  'Negotiate final terms',
  'Address pricing concerns',
  'Connect with champion',
  'Share customer references',
];
const aiCallSentiments = ['Positive', 'Neutral', 'Concerned', 'Excited', 'Hesitant'];

// Table data with AI columns
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
    // AI-generated columns
    { id: 'dealHealth', label: 'Deal Health', type: 'string', isAI: true, aiSource: 'Von IQ' },
    { id: 'nextAction', label: 'Next Best Action', type: 'string', isAI: true, aiSource: 'Von IQ' },
    {
      id: 'callSentiment',
      label: 'Last Call Sentiment',
      type: 'string',
      isAI: true,
      aiSource: 'Gong',
    },
  ],
  rows: dealsThisQuarter.map((opp, idx) => ({
    name: opp.name,
    accountName: opp.accountName,
    owner: opp.owner,
    amount: opp.amount,
    closeDate: opp.closeDate,
    probability: opp.probability,
    stage: opp.stage,
    // AI-generated values
    dealHealth: aiDealHealthScores[idx % aiDealHealthScores.length],
    nextAction: aiNextActions[idx % aiNextActions.length],
    callSentiment: aiCallSentiments[idx % aiCallSentiments.length],
  })),
};

// Text widget data
const textWidgetData: TextWidgetData = {
  id: 'text-insights',
  title: 'AI Insights',
  content: `Key observations for Q1 2026:

• Pipeline value is 12.5% higher than last quarter, driven primarily by enterprise deals in the Negotiation stage.

• High-risk deals represent 23% of total pipeline — recommend scheduling review meetings for these accounts.

• Top performers this quarter: Sarah Chen (5 deals, $2.1M) and Mike Johnson (4 deals, $1.8M).

• Average deal cycle has increased by 8 days compared to Q4 2025.`,
  maxCharacters: 1000,
  isAIGenerated: true,
};

// Dashboard plan
const dashboardPlan: DashboardPlan = {
  title: 'Deals Closing This Quarter Dashboard',
  description: `I'll create a dashboard showing ${dealsThisQuarter.length} deals totaling $${(totalValue / 1000000).toFixed(2)}M in pipeline value.`,
  kpis: ['Total Pipeline Value', 'Deal Count', 'Average Deal Size'],
  charts: [
    'Pipeline by Stage (Bar)',
    'Deals by Risk (Pie)',
    'Q1 Revenue Bridge (Waterfall)',
    'AI Projection & Forecast (Combination)',
  ],
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

const drilldownFormula =
  'SUM(Amount) WHERE CloseDate >= "2026-01-01" AND CloseDate <= "2026-03-31"';

// Owner options for filter
const ownerOptions: OwnerOption[] = [
  { id: 'owner-1', name: 'Sarah Chen' },
  { id: 'owner-2', name: 'Mike Johnson' },
  { id: 'owner-3', name: 'Emily Davis' },
  { id: 'owner-4', name: 'John Doe' },
];

// Available fields for filtering
const availableFilterFields = [
  'Deal Name',
  'Account',
  'Owner',
  'Amount',
  'Close Date',
  'Stage',
  'Probability',
  'Deal Risk',
];

// ============================================================================
// Transparency Drawer Mock Data
// ============================================================================

const mockQueries: QueryResult[] = [
  {
    id: 'query-1',
    name: 'Pipeline Deals',
    description: 'All deals closing this quarter',
    query: `SELECT Id, Name, Amount, CloseDate, StageName, Probability, Owner.Name
FROM Opportunity
WHERE CloseDate >= 2026-01-01 AND CloseDate <= 2026-03-31
  AND IsClosed = false
ORDER BY Amount DESC`,
    duration: 245,
    columns: [
      { key: 'name', label: 'Deal Name', type: 'string' },
      { key: 'accountName', label: 'Account', type: 'string' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'closeDate', label: 'Close Date', type: 'date' },
      { key: 'stage', label: 'Stage', type: 'string' },
      { key: 'probability', label: 'Probability', type: 'percentage' },
    ],
    rows: dealsThisQuarter.slice(0, 15).map((opp) => ({
      name: opp.name,
      accountName: opp.accountName,
      amount: opp.amount,
      closeDate: opp.closeDate,
      stage: opp.stage,
      probability: opp.probability,
    })),
  },
  {
    id: 'query-2',
    name: 'Stage Summary',
    description: 'Pipeline grouped by stage',
    query: `SELECT StageName, COUNT(Id) as DealCount, SUM(Amount) as TotalValue
FROM Opportunity
WHERE CloseDate >= 2026-01-01 AND CloseDate <= 2026-03-31
GROUP BY StageName
ORDER BY TotalValue DESC`,
    duration: 128,
    columns: [
      { key: 'stage', label: 'Stage', type: 'string' },
      { key: 'count', label: 'Deal Count', type: 'number' },
      { key: 'value', label: 'Total Value', type: 'currency' },
    ],
    rows: Object.entries(stageData).map(([stage, value]) => ({
      stage,
      count: dealsThisQuarter.filter((d) => d.stage === stage).length,
      value,
    })),
  },
  {
    id: 'query-3',
    name: 'Risk Analysis',
    description: 'Deals grouped by risk level',
    query: `SELECT Deal_Risk__c, COUNT(Id) as DealCount, SUM(Amount) as TotalValue
FROM Opportunity
WHERE CloseDate >= 2026-01-01 AND CloseDate <= 2026-03-31
GROUP BY Deal_Risk__c`,
    duration: 98,
    columns: [
      { key: 'risk', label: 'Risk Level', type: 'string' },
      { key: 'count', label: 'Deal Count', type: 'number' },
      { key: 'value', label: 'Total Value', type: 'currency' },
    ],
    rows: Object.entries(riskData).map(([risk, count]) => ({
      risk,
      count,
      value: dealsThisQuarter
        .filter((d) => d.dealRisk === risk)
        .reduce((sum, d) => sum + d.amount, 0),
    })),
  },
];

const mockCalls: CallTranscript[] = [
  {
    id: 'call-1',
    title: 'Q1 Pipeline Review - Enterprise Accounts',
    date: '2026-01-14',
    duration: '45 min',
    timeRange: '10:00 AM - 10:45 AM',
    participants: ['Sarah Chen', 'Mike Johnson', 'VP Sales'],
    accountName: 'Acme Corp',
    opportunityName: 'Acme Enterprise Deal',
    sentiment: 'positive',
    summary:
      'Discussed the $2.1M enterprise deal with Acme. Customer is very engaged and moving towards final approval. Legal review expected to complete by end of week. Strong likelihood of close by Jan 31.',
    sourceUrl: 'https://example.com/calls/1',
  },
  {
    id: 'call-2',
    title: 'TechStart Renewal Discussion',
    date: '2026-01-12',
    duration: '30 min',
    timeRange: '2:00 PM - 2:30 PM',
    participants: ['Emily Davis', 'Customer Success'],
    accountName: 'TechStart Inc',
    opportunityName: 'TechStart Annual Renewal',
    sentiment: 'neutral',
    summary:
      'Customer expressed some concerns about pricing for the renewal. They mentioned competitor offerings. Recommended scheduling a product roadmap session to demonstrate upcoming value.',
    sourceUrl: 'https://example.com/calls/2',
  },
  {
    id: 'call-3',
    title: 'GlobalTech Expansion Opportunity',
    date: '2026-01-10',
    duration: '1 hr',
    timeRange: '11:00 AM - 12:00 PM',
    participants: ['John Doe', 'Solutions Engineer', 'GlobalTech CTO'],
    accountName: 'GlobalTech Solutions',
    opportunityName: 'GlobalTech APAC Expansion',
    sentiment: 'positive',
    summary:
      'Technical deep dive for APAC expansion. Customer is very impressed with our scalability features. They want to move fast - aiming for contract signature by end of January.',
    sourceUrl: 'https://example.com/calls/3',
  },
  {
    id: 'call-4',
    title: 'StartupXYZ Demo Follow-up',
    date: '2026-01-08',
    duration: '20 min',
    timeRange: '3:30 PM - 3:50 PM',
    participants: ['Mike Johnson'],
    accountName: 'StartupXYZ',
    opportunityName: 'StartupXYZ Initial Contract',
    sentiment: 'negative',
    summary:
      'Customer is pushing back on timeline. They mentioned budget constraints and may need to delay the decision to Q2. Recommended offering flexible payment terms.',
    sourceUrl: 'https://example.com/calls/4',
  },
  {
    id: 'call-5',
    title: 'MegaCorp Strategic Partnership',
    date: '2025-12-20',
    duration: '1.5 hrs',
    timeRange: '9:00 AM - 10:30 AM',
    participants: ['Sarah Chen', 'CEO', 'MegaCorp VP Engineering'],
    accountName: 'MegaCorp Industries',
    opportunityName: 'MegaCorp Multi-Year Deal',
    sentiment: 'positive',
    summary:
      'Executive alignment meeting for the $5M multi-year partnership. Both leadership teams are aligned on vision. Legal teams to begin contract review in January.',
    sourceUrl: 'https://example.com/calls/5',
  },
];

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
        <span className="text-sm font-medium text-gray-900">{message}</span>
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
  const [inputValue, setInputValue] = useState(
    'Build me a dashboard showing deals closing this quarter'
  );
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

  const handleSend = useCallback(
    (message: string) => {
      onSendMessage(message);
    },
    [onSendMessage]
  );

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
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatPaneWidth, setChatPaneWidth] = useState(380);
  const chatPaneResizeRef = useRef<HTMLDivElement>(null);
  const isResizingChatPane = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Dashboard build state
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [agentMessage, setAgentMessage] = useState('');
  const [agentProgress, setAgentProgress] = useState(0);
  const [ambientGlowActive, setAmbientGlowActive] = useState(false);
  const [dashboardName, setDashboardName] = useState('Deals Closing This Quarter');

  // Drilldown state
  const [drilldownWidget, setDrilldownWidget] = useState<string | null>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);

  // Dashboard action popovers state
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterPopoverPosition = { top: 60, right: 20 };
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
  const [editingWidgetConfig, setEditingWidgetConfig] = useState<
    Partial<WidgetConfigData> | undefined
  >(undefined);

  // New filter state for dashboard
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('this-quarter');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [advancedFilters, setAdvancedFilters] = useState<DashboardFilter[]>([]);

  // Widget Edit Sheet state (new side sheet)
  const [showWidgetEditSheet, setShowWidgetEditSheet] = useState(false);

  // Transparency Drawer state
  const [showTransparencyDrawer, setShowTransparencyDrawer] = useState(false);

  // Drilldown with chart segment click state
  const [drilldownSegmentFilter, setDrilldownSegmentFilter] = useState<{
    name: string;
    value: number;
  } | null>(null);

  // Reference context state for Pane3
  const [, setReferenceContext] = useState<ReferenceContext>({
    type: 'dashboard',
    name: 'Deals Closing This Quarter',
    id: 'dashboard-deals-q1',
  });

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
      addTimeout(
        () => {
          setThinkingSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i === idx ? 'in-progress' : i < idx ? 'complete' : 'pending',
            }))
          );
        },
        (time += 800)
      );

      // Complete step
      addTimeout(
        () => {
          setThinkingSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i <= idx ? 'complete' : 'pending',
            }))
          );
        },
        (time += 600)
      );
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

    // Add the conversation to chat messages (including thinking steps and plan from thinking phase)
    const completedThinkingSteps = thinkingStepsConfig.map((s) => ({
      ...s,
      status: 'complete' as const,
    }));

    setChatMessages([
      {
        id: 'msg-1',
        type: 'user',
        content: userMessage,
      },
      {
        id: 'msg-2',
        type: 'assistant',
        content: `I'll create a dashboard showing ${dealsThisQuarter.length} deals totaling $${(totalValue / 1000000).toFixed(2)}M in pipeline value.`,
        thinkingSteps: completedThinkingSteps,
        plan: dashboardPlan,
        showBuildButton: false, // Don't show build button since we're already building
      },
    ]);

    let time = 0;
    const allWidgetIds = [
      ...kpiCards.map((k) => k.id),
      barChart.id,
      pieChart.id,
      waterfallChart.id,
      combinationChart.id,
      tableData.id,
      textWidgetData.id,
    ];

    // Build widgets one by one
    allWidgetIds.forEach((widgetId, idx) => {
      addTimeout(
        () => {
          setAgentMessage(`Adding widget ${idx + 1} of ${allWidgetIds.length}...`);
          setAgentProgress(((idx + 1) / allWidgetIds.length) * 100);
          setVisibleWidgets((prev) => [...prev, widgetId]);
        },
        (time += 600)
      );
    });

    // Complete
    addTimeout(() => {
      setPhase('complete');
      setAgentStatus('complete');
      setAgentMessage('Dashboard created');
      setAgentProgress(100);
      setShowToast(true);
      setIsChatPaneCollapsed(false); // Open chat pane by default when complete

      // Add completion message with artifact
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'msg-3',
          type: 'assistant',
          content: `I've created your dashboard! Here's what I built:`,
          artifact: {
            type: 'dashboard',
            title: 'Deals Closing This Quarter',
            description: `Dashboard with ${kpiCards.length} KPI cards, 4 charts (bar, pie, waterfall, combination), and a data table showing ${dealsThisQuarter.length} deals worth $${(totalValue / 1000000).toFixed(2)}M`,
            items: [
              { label: 'Total Pipeline Value', value: `$${(totalValue / 1000000).toFixed(2)}M` },
              { label: 'Deal Count', value: String(dealsThisQuarter.length) },
              { label: 'Avg Deal Size', value: `$${(avgDealSize / 1000).toFixed(0)}K` },
            ],
          },
        },
      ]);
    }, time + 400);

    // Fade out glow
    addTimeout(() => {
      setAmbientGlowActive(false);
    }, time + 1500);

    // Hide progress bar
    addTimeout(() => {
      setAgentStatus('idle');
    }, time + 2500);
  }, [clearAllTimeouts, addTimeout, userMessage]);

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

  // Handle chat pane resize
  const handleChatPaneResizeStart = useCallback(
    (e: React.MouseEvent) => {
      isResizingChatPane.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = chatPaneWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    },
    [chatPaneWidth]
  );

  const handleChatPaneResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingChatPane.current) return;
    const deltaX = startXRef.current - e.clientX;
    const newWidth = Math.min(600, Math.max(280, startWidthRef.current + deltaX));
    setChatPaneWidth(newWidth);
  }, []);

  const handleChatPaneResizeEnd = useCallback(() => {
    isResizingChatPane.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Attach global listeners for chat pane resize
  useLayoutEffect(() => {
    document.addEventListener('mousemove', handleChatPaneResizeMove);
    document.addEventListener('mouseup', handleChatPaneResizeEnd);
    return () => {
      document.removeEventListener('mousemove', handleChatPaneResizeMove);
      document.removeEventListener('mouseup', handleChatPaneResizeEnd);
    };
  }, [handleChatPaneResizeMove, handleChatPaneResizeEnd]);

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
    // Use the new WidgetEditSheet instead of modal
    setShowWidgetEditSheet(true);
  };

  // Handle widget config save
  const handleWidgetConfigSave = (config: WidgetConfigData) => {
    console.log('Widget config saved:', config);
    setShowWidgetConfigModal(false);
    setEditingWidgetId(null);
    setEditingWidgetConfig(undefined);
  };

  // Handle widget edit sheet save
  const handleWidgetEditSheetSave = (config: WidgetEditConfigData) => {
    console.log('Widget edit sheet saved:', config);
    setShowWidgetEditSheet(false);
    setEditingWidgetId(null);
    setEditingWidgetConfig(undefined);
  };

  // Handle chart segment click (opens drilldown with additional filter)
  const handleChartSegmentClick = (
    widgetId: string,
    segmentData: { name: string; value: number }
  ) => {
    console.log('Chart segment clicked:', widgetId, segmentData);
    setDrilldownSegmentFilter(segmentData);
    setDrilldownWidget(widgetId);

    // Update reference context for segment drilldown
    const widgetTitle =
      widgetId === barChart.id
        ? barChart.title
        : widgetId === pieChart.id
          ? pieChart.title
          : kpiCards.find((k) => k.id === widgetId)?.title || 'Widget';
    setReferenceContext({
      type: 'widget',
      name: `${widgetTitle} — ${segmentData.name}`,
      id: `${widgetId}-${segmentData.name}`,
    });
  };

  // Handle regular widget drilldown (updates reference context)
  const handleWidgetDrillDown = (widgetId: string) => {
    setDrilldownSegmentFilter(null);
    setDrilldownWidget(widgetId);

    // Update reference context based on widget type
    let widgetType: 'widget' | 'kpi' | 'table' | 'source' = 'widget';
    let widgetName = '';

    if (widgetId.startsWith('kpi-')) {
      widgetType = 'kpi';
      widgetName = kpiCards.find((k) => k.id === widgetId)?.title || 'KPI';
    } else if (widgetId === barChart.id) {
      widgetType = 'widget';
      widgetName = barChart.title;
    } else if (widgetId === pieChart.id) {
      widgetType = 'widget';
      widgetName = pieChart.title;
    } else if (widgetId === tableData.id) {
      widgetType = 'table';
      widgetName = tableData.title;
    }

    setReferenceContext({
      type: widgetType,
      name: widgetName,
      id: widgetId,
    });
  };

  // Handle closing drilldown (reset reference context to dashboard)
  const handleCloseDrilldown = () => {
    setDrilldownWidget(null);
    setDrilldownSegmentFilter(null);
    setReferenceContext({
      type: 'dashboard',
      name: 'Deals Closing This Quarter',
      id: 'dashboard-deals-q1',
    });
  };

  // Handle widget edit sheet open (updates reference context to source)
  const handleOpenWidgetEditSheet = (widgetId: string) => {
    handleWidgetEdit(widgetId);
    setReferenceContext({
      type: 'source',
      name: 'Deals Closing This Quarter',
      id: 'source-deals-q1',
    });
  };

  // Handle cancel/close dashboard (go back to thinking/plan view)
  const handleCancelDashboard = () => {
    setPhase('planning');
    setShowPlan(true);
    setIsChatPaneCollapsed(true);
    setVisibleWidgets([]);
    setAgentStatus('idle');
  };

  // Handle widget click (updates reference context without opening drilldown)
  const handleWidgetClick = (widgetId: string) => {
    // Update reference context based on widget type
    let widgetType: 'widget' | 'kpi' | 'table' | 'source' = 'widget';
    let widgetName = '';

    if (widgetId.startsWith('kpi-')) {
      widgetType = 'kpi';
      widgetName = kpiCards.find((k) => k.id === widgetId)?.title || 'KPI';
    } else if (widgetId === barChart.id) {
      widgetType = 'widget';
      widgetName = barChart.title;
    } else if (widgetId === pieChart.id) {
      widgetType = 'widget';
      widgetName = pieChart.title;
    } else if (widgetId === tableData.id) {
      widgetType = 'table';
      widgetName = tableData.title;
    } else if (widgetId === textWidgetData.id) {
      widgetType = 'widget';
      widgetName = textWidgetData.title;
    }

    setReferenceContext({
      type: widgetType,
      name: widgetName,
      id: widgetId,
    });
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

  // Get combined filters for drilldown (includes segment filter if clicked on chart)
  const getCombinedDrilldownFilters = (): DrilldownFilter[] => {
    const baseFilters = [...drilldownFilters];
    if (drilldownSegmentFilter) {
      baseFilters.push({
        id: 'segment-filter',
        field: drilldownWidget === barChart.id ? 'Stage' : 'Deal Risk',
        operator: 'equals',
        value: drilldownSegmentFilter.name,
      });
    }
    return baseFilters;
  };

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
        {showToast && (
          <SuccessToast message="Dashboard created" onDismiss={() => setShowToast(false)} />
        )}
      </AnimatePresence>

      {/* ChatSidebarV4 - Always collapsed */}
      <div
        style={{
          height: showAgentBar ? 'calc(100% - 48px)' : '100%',
          marginTop: showAgentBar ? '48px' : '0',
          width: isSidebarCollapsed ? '50px' : '240px',
          transition: 'width 0.3s ease, height 0.3s ease, margin-top 0.3s ease',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
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
          <div className="relative h-full w-full overflow-hidden rounded-xl">
            <DashboardV2
              name={dashboardName}
              onNameChange={setDashboardName}
              kpiCards={kpiCards}
              barChart={barChart}
              pieChart={pieChart}
              waterfallChart={waterfallChart}
              combinationChart={combinationChart}
              table={tableData}
              textWidget={textWidgetData}
              onTextWidgetChange={(content) => console.log('Text widget updated:', content)}
              isBuilding={phase === 'building'}
              visibleWidgets={visibleWidgets}
              onWidgetDrillDown={handleWidgetDrillDown}
              onWidgetEdit={handleOpenWidgetEditSheet}
              onWidgetDelete={(widgetId) => console.log('Delete widget:', widgetId)}
              onExportClick={handleExport}
              onRefreshClick={handleRefresh}
              onShareClick={(rect) => {
                setSharePopoverPosition({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                });
                setShowSharePopover(true);
              }}
              // New props
              timestamp="Jan 15, 2026 at 2:45 PM"
              createdBy="John Doe"
              onCancelClick={handleCancelDashboard}
              // Filter props
              timelineFilter={timelineFilter}
              onTimelineFilterChange={setTimelineFilter}
              ownerFilter={ownerFilter}
              onOwnerFilterChange={setOwnerFilter}
              ownerOptions={ownerOptions}
              advancedFilters={advancedFilters}
              onAdvancedFiltersChange={setAdvancedFilters}
              availableFilterFields={availableFilterFields}
              onChartSegmentClick={handleChartSegmentClick}
              onWidgetClick={handleWidgetClick}
            />

            {/* Inline Drilldown Panel inside Pane2 */}
            <AnimatePresence>
              {drilldownWidget && drilldownData && (
                <InlineDrilldownPanel
                  isOpen={!!drilldownWidget}
                  onClose={handleCloseDrilldown}
                  widgetName={
                    drilldownSegmentFilter
                      ? `${
                          kpiCards.find((k) => k.id === drilldownWidget)?.title ||
                          (barChart.id === drilldownWidget
                            ? barChart.title
                            : pieChart.id === drilldownWidget
                              ? pieChart.title
                              : 'Widget')
                        } — ${drilldownSegmentFilter.name}`
                      : kpiCards.find((k) => k.id === drilldownWidget)?.title ||
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
                  filters={getCombinedDrilldownFilters()}
                  formula={drilldownFormula}
                  onFiltersChange={(filters) => console.log('Filters changed:', filters)}
                  onFormulaChange={(formula) => console.log('Formula changed:', formula)}
                  availableFields={tableData.columns.map((c) => c.label)}
                />
              )}
            </AnimatePresence>

            {/* Widget Edit Sheet (new side sheet) */}
            <WidgetEditSheet
              isOpen={showWidgetEditSheet}
              onClose={() => {
                setShowWidgetEditSheet(false);
                setEditingWidgetId(null);
                setEditingWidgetConfig(undefined);
                // Reset reference context back to dashboard
                setReferenceContext({
                  type: 'dashboard',
                  name: 'Deals Closing This Quarter',
                  id: 'dashboard-deals-q1',
                });
              }}
              onSave={handleWidgetEditSheetSave}
              existingConfig={editingWidgetConfig}
              widgetId={editingWidgetId || undefined}
              mode="edit"
              availableFilterFields={availableFilterFields}
            />

            {/* Transparency Drawer - Shows data sources and calls */}
            <TransparencyDrawer
              isOpen={showTransparencyDrawer}
              onClose={() => setShowTransparencyDrawer(false)}
              queries={mockQueries}
              calls={mockCalls}
              title="Sources"
            />
          </div>
        )}
      </div>

      {/* ChatPaneV2 - Resizable and collapsible */}
      {showDashboard && (
        <div
          style={{
            height: showAgentBar ? 'calc(100% - 48px)' : '100%',
            marginTop: showAgentBar ? '48px' : '0',
            width: isChatPaneCollapsed ? '48px' : `${chatPaneWidth}px`,
            transition: isResizingChatPane.current
              ? 'none'
              : 'width 0.3s ease, height 0.3s ease, margin-top 0.3s ease',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* Resize Handle */}
          {!isChatPaneCollapsed && (
            <div
              ref={chatPaneResizeRef}
              onMouseDown={handleChatPaneResizeStart}
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-indigo-500/30 transition-colors z-10 group"
              style={{ marginLeft: '-3px' }}
            >
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-transparent group-hover:bg-indigo-400 transition-colors" />
            </div>
          )}
          <Chat
            title="Build with Von"
            messages={chatMessages}
            placeholder="Make changes to this dashboard..."
            height="100%"
            width="100%"
            thinkingProcessVersion="v2"
            useStandardInput
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
  title: 'Prototypes/Dashboard v2',
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
