// Mock data for the dashboard builder prototype
// Scenario: Accounts at risk of churning

import type {
  DataTable,
  Dashboard,
  ChatMessage,
  ThinkingStep,
  ProgressStep,
  DashboardFilter,
} from './types';

// Sample accounts at risk of churning
export const accountsAtRiskData = [
  {
    id: 'acc-001',
    accountName: 'Acme Corporation',
    industry: 'Technology',
    arr: 450000,
    healthScore: 32,
    lastEngagement: '2024-11-15',
    openTickets: 12,
    npsScore: 4,
    usageDropPercent: 45,
    contractEndDate: '2025-03-15',
    csm: 'Sarah Johnson',
    region: 'North America',
    riskLevel: 'Critical',
    churnProbability: 0.78,
    daysSinceLastLogin: 45,
    featuresAdopted: 3,
    totalFeatures: 12,
  },
  {
    id: 'acc-002',
    accountName: 'GlobalTech Industries',
    industry: 'Manufacturing',
    arr: 890000,
    healthScore: 41,
    lastEngagement: '2024-11-28',
    openTickets: 8,
    npsScore: 5,
    usageDropPercent: 38,
    contractEndDate: '2025-02-28',
    csm: 'Michael Chen',
    region: 'APAC',
    riskLevel: 'High',
    churnProbability: 0.65,
    daysSinceLastLogin: 28,
    featuresAdopted: 5,
    totalFeatures: 12,
  },
  {
    id: 'acc-003',
    accountName: 'Stellar Healthcare',
    industry: 'Healthcare',
    arr: 320000,
    healthScore: 38,
    lastEngagement: '2024-12-01',
    openTickets: 15,
    npsScore: 3,
    usageDropPercent: 52,
    contractEndDate: '2025-04-10',
    csm: 'Emily Rodriguez',
    region: 'North America',
    riskLevel: 'Critical',
    churnProbability: 0.82,
    daysSinceLastLogin: 38,
    featuresAdopted: 2,
    totalFeatures: 12,
  },
  {
    id: 'acc-004',
    accountName: 'Nordic Financial',
    industry: 'Financial Services',
    arr: 1250000,
    healthScore: 45,
    lastEngagement: '2024-12-05',
    openTickets: 5,
    npsScore: 6,
    usageDropPercent: 28,
    contractEndDate: '2025-06-30',
    csm: 'James Wilson',
    region: 'EMEA',
    riskLevel: 'Medium',
    churnProbability: 0.48,
    daysSinceLastLogin: 15,
    featuresAdopted: 7,
    totalFeatures: 12,
  },
  {
    id: 'acc-005',
    accountName: 'Pacific Retail Group',
    industry: 'Retail',
    arr: 560000,
    healthScore: 35,
    lastEngagement: '2024-11-20',
    openTickets: 9,
    npsScore: 4,
    usageDropPercent: 42,
    contractEndDate: '2025-05-15',
    csm: 'Sarah Johnson',
    region: 'APAC',
    riskLevel: 'High',
    churnProbability: 0.71,
    daysSinceLastLogin: 35,
    featuresAdopted: 4,
    totalFeatures: 12,
  },
  {
    id: 'acc-006',
    accountName: 'Metro Logistics',
    industry: 'Logistics',
    arr: 275000,
    healthScore: 29,
    lastEngagement: '2024-11-10',
    openTickets: 18,
    npsScore: 2,
    usageDropPercent: 58,
    contractEndDate: '2025-01-31',
    csm: 'Michael Chen',
    region: 'North America',
    riskLevel: 'Critical',
    churnProbability: 0.89,
    daysSinceLastLogin: 52,
    featuresAdopted: 2,
    totalFeatures: 12,
  },
  {
    id: 'acc-007',
    accountName: 'Summit Energy',
    industry: 'Energy',
    arr: 780000,
    healthScore: 44,
    lastEngagement: '2024-12-08',
    openTickets: 4,
    npsScore: 6,
    usageDropPercent: 22,
    contractEndDate: '2025-08-20',
    csm: 'Emily Rodriguez',
    region: 'EMEA',
    riskLevel: 'Medium',
    churnProbability: 0.42,
    daysSinceLastLogin: 12,
    featuresAdopted: 8,
    totalFeatures: 12,
  },
  {
    id: 'acc-008',
    accountName: 'Quantum Software',
    industry: 'Technology',
    arr: 420000,
    healthScore: 36,
    lastEngagement: '2024-11-25',
    openTickets: 11,
    npsScore: 4,
    usageDropPercent: 48,
    contractEndDate: '2025-04-30',
    csm: 'James Wilson',
    region: 'North America',
    riskLevel: 'High',
    churnProbability: 0.68,
    daysSinceLastLogin: 32,
    featuresAdopted: 3,
    totalFeatures: 12,
  },
];

// Engagement timeline data
export const engagementTimelineData = [
  { month: 'Jul', loginCount: 245, supportTickets: 12, featureUsage: 78 },
  { month: 'Aug', loginCount: 232, supportTickets: 15, featureUsage: 75 },
  { month: 'Sep', loginCount: 198, supportTickets: 22, featureUsage: 68 },
  { month: 'Oct', loginCount: 165, supportTickets: 28, featureUsage: 55 },
  { month: 'Nov', loginCount: 142, supportTickets: 35, featureUsage: 42 },
  { month: 'Dec', loginCount: 118, supportTickets: 41, featureUsage: 35 },
];

// Risk by region data
export const riskByRegionData = [
  { region: 'North America', critical: 3, high: 2, medium: 1 },
  { region: 'EMEA', critical: 0, high: 1, medium: 2 },
  { region: 'APAC', critical: 1, high: 2, medium: 0 },
];

// Churn probability distribution
export const churnProbabilityData = [
  { range: '0-20%', count: 45 },
  { range: '20-40%', count: 28 },
  { range: '40-60%', count: 15 },
  { range: '60-80%', count: 8 },
  { range: '80-100%', count: 4 },
];

// ARR at risk by industry
export const arrAtRiskByIndustry = [
  { industry: 'Technology', arrAtRisk: 870000, accountCount: 2 },
  { industry: 'Financial Services', arrAtRisk: 1250000, accountCount: 1 },
  { industry: 'Healthcare', arrAtRisk: 320000, accountCount: 1 },
  { industry: 'Manufacturing', arrAtRisk: 890000, accountCount: 1 },
  { industry: 'Retail', arrAtRisk: 560000, accountCount: 1 },
  { industry: 'Logistics', arrAtRisk: 275000, accountCount: 1 },
  { industry: 'Energy', arrAtRisk: 780000, accountCount: 1 },
];

// Support ticket trends
export const supportTicketTrends = [
  { week: 'W1', newTickets: 8, resolvedTickets: 5, avgResolutionTime: 4.2 },
  { week: 'W2', newTickets: 12, resolvedTickets: 7, avgResolutionTime: 5.1 },
  { week: 'W3', newTickets: 15, resolvedTickets: 9, avgResolutionTime: 6.3 },
  { week: 'W4', newTickets: 18, resolvedTickets: 11, avgResolutionTime: 7.8 },
];

// Data Tables for the data explorer
export const mockDataTables: DataTable[] = [
  {
    id: 'tbl-accounts-at-risk',
    name: 'Accounts at Risk',
    description:
      'Accounts identified as at risk of churning based on health scores and usage patterns',
    source: 'von-ai',
    rowCount: accountsAtRiskData.length,
    columns: [
      { key: 'accountName', label: 'Account Name', type: 'string', source: 'salesforce' },
      { key: 'industry', label: 'Industry', type: 'string', source: 'salesforce' },
      { key: 'arr', label: 'ARR', type: 'currency', source: 'salesforce' },
      {
        key: 'healthScore',
        label: 'Health Score',
        type: 'number',
        isAIGenerated: true,
        source: 'von-ai',
      },
      {
        key: 'churnProbability',
        label: 'Churn Probability',
        type: 'percentage',
        isAIGenerated: true,
        source: 'von-ai',
      },
      {
        key: 'riskLevel',
        label: 'Risk Level',
        type: 'string',
        isAIGenerated: true,
        source: 'von-ai',
      },
      { key: 'lastEngagement', label: 'Last Engagement', type: 'date', source: 'salesforce' },
      { key: 'openTickets', label: 'Open Tickets', type: 'number', source: 'salesforce' },
      { key: 'npsScore', label: 'NPS Score', type: 'number', source: 'salesforce' },
      {
        key: 'usageDropPercent',
        label: 'Usage Drop %',
        type: 'percentage',
        isAIGenerated: true,
        source: 'von-ai',
      },
      { key: 'csm', label: 'CSM', type: 'string', source: 'salesforce' },
      { key: 'region', label: 'Region', type: 'string', source: 'salesforce' },
      { key: 'contractEndDate', label: 'Contract End', type: 'date', source: 'salesforce' },
      {
        key: 'daysSinceLastLogin',
        label: 'Days Since Login',
        type: 'number',
        isAIGenerated: true,
        source: 'von-ai',
      },
      { key: 'featuresAdopted', label: 'Features Adopted', type: 'number', source: 'von-ai' },
    ],
    data: accountsAtRiskData,
  },
  {
    id: 'tbl-engagement-timeline',
    name: 'Engagement Timeline',
    description: 'Monthly engagement metrics across all at-risk accounts',
    source: 'von-ai',
    rowCount: engagementTimelineData.length,
    columns: [
      { key: 'month', label: 'Month', type: 'string' },
      { key: 'loginCount', label: 'Login Count', type: 'number' },
      { key: 'supportTickets', label: 'Support Tickets', type: 'number' },
      { key: 'featureUsage', label: 'Feature Usage %', type: 'percentage' },
    ],
    data: engagementTimelineData,
  },
  {
    id: 'tbl-risk-by-region',
    name: 'Risk by Region',
    description: 'Distribution of risk levels across geographic regions',
    source: 'von-ai',
    rowCount: riskByRegionData.length,
    columns: [
      { key: 'region', label: 'Region', type: 'string' },
      { key: 'critical', label: 'Critical', type: 'number', isAIGenerated: true, source: 'von-ai' },
      { key: 'high', label: 'High', type: 'number', isAIGenerated: true, source: 'von-ai' },
      { key: 'medium', label: 'Medium', type: 'number', isAIGenerated: true, source: 'von-ai' },
    ],
    data: riskByRegionData,
  },
  {
    id: 'tbl-arr-by-industry',
    name: 'ARR at Risk by Industry',
    description: 'Annual recurring revenue at risk grouped by industry',
    source: 'von-ai',
    rowCount: arrAtRiskByIndustry.length,
    columns: [
      { key: 'industry', label: 'Industry', type: 'string', source: 'salesforce' },
      {
        key: 'arrAtRisk',
        label: 'ARR at Risk',
        type: 'currency',
        isAIGenerated: true,
        source: 'von-ai',
      },
      { key: 'accountCount', label: 'Account Count', type: 'number' },
    ],
    data: arrAtRiskByIndustry,
  },
  {
    id: 'tbl-churn-distribution',
    name: 'Churn Probability Distribution',
    description: 'Distribution of accounts by churn probability ranges',
    source: 'von-ai',
    rowCount: churnProbabilityData.length,
    columns: [
      { key: 'range', label: 'Probability Range', type: 'string' },
      { key: 'count', label: 'Account Count', type: 'number' },
    ],
    data: churnProbabilityData,
  },
  {
    id: 'tbl-support-trends',
    name: 'Support Ticket Trends',
    description: 'Weekly support ticket metrics for at-risk accounts',
    source: 'salesforce',
    rowCount: supportTicketTrends.length,
    columns: [
      { key: 'week', label: 'Week', type: 'string' },
      { key: 'newTickets', label: 'New Tickets', type: 'number' },
      { key: 'resolvedTickets', label: 'Resolved', type: 'number' },
      { key: 'avgResolutionTime', label: 'Avg Resolution (days)', type: 'number' },
    ],
    data: supportTicketTrends,
  },
];

// Thinking steps for the AI process
export const mockThinkingSteps: ThinkingStep[] = [
  {
    id: 'ts-1',
    text: 'Analyzing your request to identify accounts at risk of churning...',
    status: 'complete',
  },
  {
    id: 'ts-2',
    text: 'Connecting to Salesforce to pull account and opportunity data...',
    status: 'complete',
  },
  {
    id: 'ts-3',
    text: 'Retrieving customer health metrics and engagement patterns...',
    status: 'complete',
  },
  { id: 'ts-4', text: 'Analyzing support ticket trends and NPS scores...', status: 'complete' },
  { id: 'ts-5', text: 'Running churn prediction model on account data...', status: 'complete' },
  {
    id: 'ts-6',
    text: 'Calculating risk scores and identifying key indicators...',
    status: 'complete',
  },
];

// Progress steps for dashboard building
export const mockProgressSteps: ProgressStep[] = [
  {
    id: 'ps-1',
    label: 'Gathering Data',
    description: 'Collected 8 accounts with risk indicators',
    status: 'complete',
  },
  {
    id: 'ps-2',
    label: 'Creating Tables',
    description: 'Generated 6 data tables for analysis',
    status: 'complete',
  },
  {
    id: 'ps-3',
    label: 'Analyzing Patterns',
    description: 'Identified key churn risk factors',
    status: 'complete',
  },
  {
    id: 'ps-4',
    label: 'Building Visualizations',
    description: 'Creating charts and metrics',
    status: 'complete',
  },
  {
    id: 'ps-5',
    label: 'Finalizing Dashboard',
    description: 'Applying filters and formatting',
    status: 'complete',
  },
];

// Dashboard filters
export const mockDashboardFilters: DashboardFilter[] = [
  {
    id: 'filter-region',
    label: 'Region',
    type: 'multi-select',
    field: 'region',
    options: [
      { value: 'north-america', label: 'North America' },
      { value: 'emea', label: 'EMEA' },
      { value: 'apac', label: 'APAC' },
    ],
  },
  {
    id: 'filter-risk-level',
    label: 'Risk Level',
    type: 'multi-select',
    field: 'riskLevel',
    options: [
      { value: 'critical', label: 'Critical' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
    ],
  },
  {
    id: 'filter-csm',
    label: 'CSM',
    type: 'select',
    field: 'csm',
    options: [
      { value: 'sarah-johnson', label: 'Sarah Johnson' },
      { value: 'michael-chen', label: 'Michael Chen' },
      { value: 'emily-rodriguez', label: 'Emily Rodriguez' },
      { value: 'james-wilson', label: 'James Wilson' },
    ],
  },
  {
    id: 'filter-date-range',
    label: 'Contract End Date',
    type: 'date-range',
    field: 'contractEndDate',
  },
];

// Mock dashboard configuration
export const mockDashboard: Dashboard = {
  id: 'dash-churn-risk',
  title: 'Accounts at Risk of Churning',
  description:
    'Analysis of accounts showing signs of potential churn based on health scores, engagement, and usage patterns',
  filters: mockDashboardFilters,
  createdAt: new Date(),
  updatedAt: new Date(),
  widgets: [
    {
      id: 'widget-total-arr',
      type: 'metric',
      title: 'Total ARR at Risk',
      position: { x: 0, y: 0 },
      size: { width: 3, height: 1 },
      config: {
        id: 'metric-arr',
        label: 'Total ARR at Risk',
        value: '$4.95M',
        change: 12,
        changeType: 'negative',
        format: 'currency',
      },
    },
    {
      id: 'widget-critical-accounts',
      type: 'metric',
      title: 'Critical Accounts',
      position: { x: 3, y: 0 },
      size: { width: 3, height: 1 },
      config: {
        id: 'metric-critical',
        label: 'Critical Accounts',
        value: 3,
        change: 2,
        changeType: 'negative',
        format: 'number',
      },
    },
    {
      id: 'widget-avg-health',
      type: 'metric',
      title: 'Avg Health Score',
      position: { x: 6, y: 0 },
      size: { width: 3, height: 1 },
      config: {
        id: 'metric-health',
        label: 'Avg Health Score',
        value: 37,
        change: -8,
        changeType: 'negative',
        format: 'number',
      },
    },
    {
      id: 'widget-avg-churn-prob',
      type: 'metric',
      title: 'Avg Churn Probability',
      position: { x: 9, y: 0 },
      size: { width: 3, height: 1 },
      config: {
        id: 'metric-churn',
        label: 'Avg Churn Probability',
        value: '68%',
        change: 15,
        changeType: 'negative',
        format: 'percentage',
      },
    },
    {
      id: 'widget-risk-by-region',
      type: 'chart',
      title: 'Risk Distribution by Region',
      position: { x: 0, y: 1 },
      size: { width: 6, height: 2 },
      config: {
        id: 'chart-region',
        type: 'bar',
        title: 'Risk Distribution by Region',
        dataTableId: 'tbl-risk-by-region',
        xAxis: 'region',
        series: ['critical', 'high', 'medium'],
      },
    },
    {
      id: 'widget-engagement-trend',
      type: 'chart',
      title: 'Engagement Trend',
      position: { x: 6, y: 1 },
      size: { width: 6, height: 2 },
      config: {
        id: 'chart-engagement',
        type: 'line',
        title: 'Engagement Trend (6 Months)',
        dataTableId: 'tbl-engagement-timeline',
        xAxis: 'month',
        series: ['loginCount', 'featureUsage'],
      },
    },
    {
      id: 'widget-arr-by-industry',
      type: 'chart',
      title: 'ARR at Risk by Industry',
      position: { x: 0, y: 3 },
      size: { width: 6, height: 2 },
      config: {
        id: 'chart-arr',
        type: 'column',
        title: 'ARR at Risk by Industry',
        dataTableId: 'tbl-arr-by-industry',
        xAxis: 'industry',
        yAxis: 'arrAtRisk',
      },
    },
    {
      id: 'widget-churn-distribution',
      type: 'chart',
      title: 'Churn Probability Distribution',
      position: { x: 6, y: 3 },
      size: { width: 6, height: 2 },
      config: {
        id: 'chart-churn',
        type: 'pie',
        title: 'Accounts by Churn Probability',
        dataTableId: 'tbl-churn-distribution',
        xAxis: 'range',
        yAxis: 'count',
      },
    },
    {
      id: 'widget-accounts-table',
      type: 'table',
      title: 'At-Risk Accounts',
      position: { x: 0, y: 5 },
      size: { width: 12, height: 3 },
      config: {
        id: 'table-accounts',
        dataTableId: 'tbl-accounts-at-risk',
        visibleColumns: [
          'accountName',
          'industry',
          'arr',
          'healthScore',
          'churnProbability',
          'riskLevel',
          'csm',
          'contractEndDate',
        ],
        sortBy: 'churnProbability',
        sortOrder: 'desc',
      },
    },
  ],
};

// Initial chat messages
export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Give me a rundown of which accounts are at the risk of churning',
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: `I've analyzed your customer data and identified **8 accounts** that are showing signs of potential churn. Here's what I found:

**Key Insights:**
- **Total ARR at Risk:** $4.95M across all flagged accounts
- **Critical Accounts:** 3 accounts require immediate attention
- **Average Health Score:** 37 (down 8 points from last quarter)

The main risk factors I identified are:
1. **Declining engagement** - Login frequency dropped 40% over 6 months
2. **Rising support tickets** - 3.4x increase in open tickets
3. **Low feature adoption** - Only 35% of available features being used

I've created a dashboard with detailed breakdowns by region, industry, and individual account metrics. You can drill down into any visualization for more details.`,
    timestamp: new Date(),
    thinkingSteps: mockThinkingSteps,
    isThinkingCollapsed: true,
  },
];

// Visualization palette for drag-and-drop
export const visualizationPalette = [
  { id: 'viz-bar', type: 'bar', label: 'Bar Chart', icon: 'ChartBar' },
  { id: 'viz-line', type: 'line', label: 'Line Chart', icon: 'ChartLine' },
  { id: 'viz-pie', type: 'pie', label: 'Pie Chart', icon: 'ChartPie' },
  { id: 'viz-column', type: 'column', label: 'Column Chart', icon: 'ChartBar' },
  { id: 'viz-area', type: 'area', label: 'Area Chart', icon: 'ChartLine' },
  { id: 'viz-donut', type: 'donut', label: 'Donut Chart', icon: 'ChartDonut' },
  { id: 'viz-funnel', type: 'funnel', label: 'Funnel Chart', icon: 'Funnel' },
  { id: 'viz-metric', type: 'metric', label: 'Metric Card', icon: 'NumberCircleOne' },
  { id: 'viz-table', type: 'table', label: 'Data Table', icon: 'Table' },
];

// Table operations
export const tableOperations = [
  { type: 'filter', label: 'Filter Data', icon: 'Funnel' },
  { type: 'sort', label: 'Sort Column', icon: 'SortAscending' },
  { type: 'split-column', label: 'Split Column', icon: 'ArrowsOutLineHorizontal' },
  { type: 'merge-tables', label: 'Merge Tables', icon: 'GitMerge' },
  { type: 'rename-column', label: 'Rename Column', icon: 'PencilSimple' },
  { type: 'add-column', label: 'Add Calculated Column', icon: 'Plus' },
];
