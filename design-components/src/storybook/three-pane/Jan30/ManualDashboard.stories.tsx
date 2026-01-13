import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState } from 'react';
import type { LayoutItem } from 'react-grid-layout';
import { ChatSidebarV3 } from '../../../components/ChatSidebarV3/ChatSidebarV3';
import type { SidebarItem, Folder, ItemType } from '../../../components/ChatSidebarV3/ChatSidebarV3';
import { Pane1 } from '../../../components/Pane1/Pane1';
import type { ChartComponent, ComponentConfig, SubtableItem } from '../../../components/Pane1/Pane1';
import { Pane2 } from '../../../components/layouts/Pane2';
import type { DashboardWidgetData, Pane2Mode, FilterConfig, ColumnConfig } from '../../../components/layouts/Pane2';
import { ChatPane } from '../../../components/ChatPane/ChatPane';
import type { Message } from '../../../components/Chat/types';
import type { ReferenceContext, ActivePopover } from '../../../components/ChatPane/types';
import { ReportTable } from '../../../components/ReportTable/ReportTable';
import type { ReportColumn } from '../../../components/ReportTable/ReportTable';
import { Toast } from '../../../components/Toast/Toast';
import {
  SaveReportModal,
  type SaveReportConfig,
  type DataSourceOption,
  type DrillDownFilter,
  type SourceDataColumn,
  type SourceDataRow,
  DashboardFilterModal,
  type DashboardFilterConfig,
  DashboardSharePopover,
  type ShareConfig,
} from '../../../components/popups';
import {
  reports,
  getPipelineData,
  getDealsAtRiskData,
  getAccountHealthData,
  getRenewalsAtRiskData,
  getRepPerformanceData,
} from '../data/salesData';

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
// Dummy Data
// ============================================================================

const dummySidebarItems: SidebarItem[] = [
  // Root chats (lots of them to test scroll)
  { id: 'chat-1', label: 'Pipeline Analysis Q4', type: 'chat' },
  { id: 'chat-2', label: 'Win Rate Optimization', type: 'chat' },
  { id: 'chat-3', label: 'Revenue Forecast Discussion', type: 'chat' },
  { id: 'chat-4', label: 'Customer Churn Analysis', type: 'chat' },
  { id: 'chat-5', label: 'Territory Planning Q1', type: 'chat' },
  { id: 'chat-6', label: 'Competitive Analysis Review', type: 'chat' },
  { id: 'chat-7', label: 'Sales Enablement Strategy', type: 'chat' },
  { id: 'chat-8', label: 'Lead Scoring Model Update', type: 'chat' },
  { id: 'chat-9', label: 'Partner Channel Discussion', type: 'chat' },
  { id: 'chat-10', label: 'Pricing Strategy Review', type: 'chat' },
  { id: 'chat-11', label: 'Marketing Attribution Analysis', type: 'chat' },
  { id: 'chat-12', label: 'Product Roadmap Feedback', type: 'chat' },
  { id: 'chat-13', label: 'Customer Success Metrics', type: 'chat' },
  { id: 'chat-14', label: 'Upsell Opportunities Q4', type: 'chat' },
  { id: 'chat-15', label: 'Deal Velocity Analysis', type: 'chat' },
  { id: 'chat-16', label: 'Sales Compensation Review', type: 'chat' },
  { id: 'chat-17', label: 'Account Segmentation', type: 'chat' },
  { id: 'chat-18', label: 'Forecasting Accuracy Check', type: 'chat' },
  { id: 'chat-19', label: 'Pipeline Coverage Analysis', type: 'chat' },
  { id: 'chat-20', label: 'Quota Attainment Review', type: 'chat' },
  // Root dashboards
  { id: 'dash-1', label: 'Sales Overview', type: 'dashboard', ownership: 'mine' },
  { id: 'dash-2', label: 'Team Performance', type: 'dashboard', ownership: 'mine' },
  { id: 'dash-3', label: 'Executive Dashboard', type: 'dashboard', ownership: 'shared', ownerName: 'Sarah Chen' },
  { id: 'dash-4', label: 'Regional Metrics', type: 'dashboard', ownership: 'shared_by_me' },
  { id: 'dash-5', label: 'Pipeline Health', type: 'dashboard', ownership: 'mine' },
  { id: 'dash-6', label: 'Revenue Trends', type: 'dashboard', ownership: 'mine' },
  { id: 'dash-7', label: 'Win/Loss Analysis', type: 'dashboard', ownership: 'shared', ownerName: 'Mike Johnson' },
  { id: 'dash-8', label: 'Activity Dashboard', type: 'dashboard', ownership: 'mine' },
  // Chats in folders
  { id: 'chat-f1-1', label: 'Q4 Pipeline Deep Dive', type: 'chat', folderId: 'folder-1' },
  { id: 'chat-f1-2', label: 'Q4 Revenue Projections', type: 'chat', folderId: 'folder-1' },
  { id: 'chat-f1-3', label: 'Q4 Team Performance', type: 'chat', folderId: 'folder-1' },
  { id: 'dash-f2-1', label: 'Weekly Sales Report', type: 'dashboard', folderId: 'folder-2', ownership: 'mine' },
  { id: 'dash-f2-2', label: 'Weekly Pipeline Status', type: 'dashboard', folderId: 'folder-2', ownership: 'mine' },
];

const dummyFolders: Folder[] = [
  { id: 'folder-1', label: 'Q4 Analysis', isExpanded: true },
  { id: 'folder-2', label: 'Weekly Reports', isExpanded: false },
  { id: 'folder-3', label: 'Executive Prep', isExpanded: false },
  { id: 'folder-4', label: 'Customer Research', isExpanded: false },
];

// Convert reports from salesData to SubtableItem format for Pane1
const salesReportsAsSubtables: SubtableItem[] = [
  {
    id: 'report-pipeline-overview',
    label: 'Pipeline Overview',
    isExpanded: true,
    children: [
      { id: 'report-deals-at-risk', label: 'Deals at Risk' },
    ],
  },
  {
    id: 'report-account-health',
    label: 'Account Health Scorecard',
    isExpanded: false,
    children: [
      { id: 'report-renewals-at-risk', label: 'Renewals at Risk' },
    ],
  },
  {
    id: 'report-rep-performance',
    label: 'Rep Performance Dashboard',
    isExpanded: false,
  },
];

// Get report data based on selected report ID
const getReportData = (reportId: string): Record<string, unknown>[] => {
  switch (reportId) {
    case 'report-pipeline-overview':
      return getPipelineData();
    case 'report-deals-at-risk':
      return getDealsAtRiskData();
    case 'report-account-health':
      return getAccountHealthData();
    case 'report-renewals-at-risk':
      return getRenewalsAtRiskData();
    case 'report-rep-performance':
      return getRepPerformanceData();
    default:
      return getPipelineData();
  }
};

// Get columns for a report
const getReportColumns = (reportId: string): ReportColumn[] => {
  const report = reports.find((r) => r.id === reportId);
  return report?.columns || reports[0].columns;
};

// Get report name
const getReportName = (reportId: string): string => {
  const report = reports.find((r) => r.id === reportId);
  return report?.name || 'Pipeline Overview';
};

// Get parent reports for save modal
const getParentReports = () => {
  return reports
    .filter((r) => !r.parentId) // Only root reports can be parents
    .map((r) => ({ id: r.id, name: r.name }));
};

// Get filter fields from report columns
const getFilterFields = (reportId: string): string[] => {
  const columns = getReportColumns(reportId);
  return columns.map((c) => c.label);
};

// Data sources for widget configuration (dynamically generated from reports)
const widgetDataSources: DataSourceOption[] = reports.map((report) => ({
  id: report.id,
  name: report.name,
  type: report.parentId ? 'subreport' : 'report',
  parentId: report.parentId,
  columnCount: report.columns.length,
}));

// Drill-down filters for widget detail view
const widgetDrillDownFilters: DrillDownFilter[] = [
  {
    id: 'region',
    label: 'Region',
    options: [
      { value: 'west', label: 'West' },
      { value: 'east', label: 'East' },
      { value: 'central', label: 'Central' },
      { value: 'south', label: 'South' },
    ],
  },
  {
    id: 'owner',
    label: 'Owner',
    options: [
      { value: 'sarah', label: 'Sarah Chen' },
      { value: 'mike', label: 'Mike Johnson' },
      { value: 'alex', label: 'Alex Kim' },
      { value: 'jordan', label: 'Jordan Lee' },
    ],
  },
  {
    id: 'stage',
    label: 'Stage',
    options: [
      { value: 'discovery', label: 'Discovery' },
      { value: 'qualification', label: 'Qualification' },
      { value: 'proposal', label: 'Proposal' },
      { value: 'negotiation', label: 'Negotiation' },
      { value: 'closed', label: 'Closed Won' },
    ],
  },
];

// Get source data columns for a widget based on its connected report
const getWidgetSourceColumns = (widgetReportId: string | undefined): SourceDataColumn[] => {
  if (!widgetReportId) return [];
  const reportColumns = getReportColumns(widgetReportId);
  return reportColumns.map((col) => ({
    id: col.id,
    label: col.label,
    type: col.type === 'currency' ? 'currency' : col.type === 'number' ? 'number' : col.type === 'percentage' ? 'percentage' : 'text',
    isAI: col.isAI,
  }));
};

// Get source data rows for a widget based on its connected report
const getWidgetSourceData = (widgetReportId: string | undefined): SourceDataRow[] => {
  if (!widgetReportId) return [];
  const data = getReportData(widgetReportId);
  return data.slice(0, 5).map((row, idx) => ({
    id: `row-${idx}`,
    ...row,
  })) as SourceDataRow[];
};

// Convert report columns to ColumnConfig format
const getInitialColumns = (reportId: string): ColumnConfig[] => {
  const columns = getReportColumns(reportId);
  return columns.map((c) => ({
    id: c.id,
    label: c.label,
    isVisible: true,
    isAI: c.isAI,
  }));
};

// ============================================================================
// Widget Intent Parser
// ============================================================================

interface WidgetIntent {
  action: 'create' | 'edit' | 'none';
  chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';
  reportId?: string;
  reportName?: string;
  widgetId?: string;
  title?: string;
}

const parseWidgetIntent = (message: string): WidgetIntent => {
  const lowerMsg = message.toLowerCase();
  
  // Check for edit intent
  if ((lowerMsg.includes('edit') || lowerMsg.includes('change') || lowerMsg.includes('modify') || lowerMsg.includes('update')) && 
      (lowerMsg.includes('widget') || lowerMsg.includes('chart'))) {
    return { action: 'edit' };
  }
  
  // Check for create intent
  const isCreateIntent = 
    (lowerMsg.includes('add') || lowerMsg.includes('create') || lowerMsg.includes('build') || lowerMsg.includes('make')) &&
    (lowerMsg.includes('widget') || lowerMsg.includes('chart') || lowerMsg.includes('visualization'));
  
  if (!isCreateIntent) {
    return { action: 'none' };
  }
  
  // Extract chart type
  let chartType: WidgetIntent['chartType'];
  if (lowerMsg.includes('bar chart') || lowerMsg.includes('bar graph')) chartType = 'bar';
  else if (lowerMsg.includes('line chart') || lowerMsg.includes('line graph')) chartType = 'line';
  else if (lowerMsg.includes('pie chart')) chartType = 'pie';
  else if (lowerMsg.includes('donut chart')) chartType = 'donut';
  else if (lowerMsg.includes('metric') || lowerMsg.includes('kpi')) chartType = 'metric';
  else if (lowerMsg.includes('table') || lowerMsg.includes('data table')) chartType = 'table';
  
  // Extract report reference
  let reportId: string | undefined;
  let reportName: string | undefined;
  
  // Check for specific report mentions
  if (lowerMsg.includes('pipeline overview')) {
    reportId = 'report-pipeline-overview';
    reportName = 'Pipeline Overview';
  } else if (lowerMsg.includes('deals at risk')) {
    reportId = 'report-deals-at-risk';
    reportName = 'Deals at Risk';
  } else if (lowerMsg.includes('account health')) {
    reportId = 'report-account-health';
    reportName = 'Account Health Scorecard';
  } else if (lowerMsg.includes('renewals at risk')) {
    reportId = 'report-renewals-at-risk';
    reportName = 'Renewals at Risk';
  } else if (lowerMsg.includes('rep performance')) {
    reportId = 'report-rep-performance';
    reportName = 'Rep Performance Dashboard';
  }
  
  return {
    action: 'create',
    chartType,
    reportId,
    reportName,
  };
};

// Generate approval content for widget creation
const getWidgetCreationApprovalContent = (intent: WidgetIntent): string => {
  const chartTypeLabel = intent.chartType ? 
    intent.chartType.charAt(0).toUpperCase() + intent.chartType.slice(1) + ' Chart' : 
    'Widget';
  const reportInfo = intent.reportName ? `**${intent.reportName}**` : 'the selected report';
  
  return `## Create ${chartTypeLabel}

I'll create a **${chartTypeLabel}** widget with the following configuration:

### Widget Details
- **Type**: ${chartTypeLabel}
- **Data Source**: ${reportInfo}
- **Position**: Next available space on dashboard
- **Size**: Default (medium)

### What You'll Get
${intent.chartType === 'bar' ? '- Bar chart visualization showing data distribution\n- Interactive tooltips and legends\n- Responsive resizing' : ''}
${intent.chartType === 'line' ? '- Line chart showing trends over time\n- Interactive data points\n- Smooth animations' : ''}
${intent.chartType === 'pie' ? '- Pie chart showing proportional data\n- Percentage labels\n- Color-coded segments' : ''}
${intent.chartType === 'donut' ? '- Donut chart with center metric\n- Percentage breakdown\n- Modern design' : ''}
${intent.chartType === 'metric' ? '- Large metric display\n- Trend indicator\n- Comparison data' : ''}
${intent.chartType === 'table' ? '- Full data table view\n- Sortable columns\n- Row selection' : ''}

After approval, you can further customize the widget by:
- Adjusting the title
- Selecting specific data columns
- Adding filters
- Resizing and repositioning

Ready to add this widget to your dashboard?`;
};

// Chat responses for different scenarios
const getDummyResponse = (context: string, question: string): string => {
  if (question.toLowerCase().includes('add') || question.toLowerCase().includes('widget')) {
    return `I can help you add a widget to your dashboard. Based on the current context, I recommend adding a **Bar Chart** showing revenue breakdown.

Would you like me to:
1. Add a Revenue by Region bar chart
2. Add a Pipeline by Stage chart
3. Create a custom visualization

Let me know and I'll prepare the widget configuration for your approval.`;
  }

  if (question.toLowerCase().includes('edit') || question.toLowerCase().includes('change')) {
    return `I can modify the selected widget. Here are the changes I can make:

- **Update title**: Change the display name
- **Change chart type**: Switch between bar, line, pie, etc.
- **Modify data source**: Connect to a different report
- **Add filters**: Narrow down the data displayed

What would you like to change?`;
  }

  if (context.includes('Dashboard')) {
    return `Looking at **${context}**, I can see:

## Dashboard Summary
- **4 widgets** currently on this dashboard
- Data refreshed **2 hours ago**
- Primary data source: **Pipeline Reports**

### Key Insights
1. Revenue is trending **+12%** compared to last quarter
2. Win rate has improved to **34%**
3. Average deal size: **$125,000**

Would you like me to add more widgets or analyze specific metrics?`;
  }

  if (context.includes('Report') || context.includes('report')) {
    return `Analyzing **${context}**:

## Report Overview
- **8 records** in this report
- Last updated: **Just now**

### Key Findings
- Total pipeline value: **$1.26M**
- Highest probability deal: **Enterprise Plus** (80%)
- **3 accounts** flagged as high churn risk

Would you like me to create a visualization from this data?`;
  }

  return `I'm Von, your AI assistant for building dashboards and analyzing data.

Based on your current view, I can help you:
- **Build dashboards**: Drag widgets from the left panel
- **Analyze reports**: Ask questions about your data
- **Get insights**: I'll surface key metrics and trends

What would you like to explore?`;
};


// ============================================================================
// Main Story Component
// ============================================================================

const ManualDashboardDemo = () => {
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedSidebarItem, setSelectedSidebarItem] = useState<string>('dash-1');
  const [folders, setFolders] = useState<Folder[]>(dummyFolders);

  // Pane1 state
  const [pane1Tab, setPane1Tab] = useState<'data' | 'dashboard'>('dashboard');
  const [selectedComponent, setSelectedComponent] = useState<ChartComponent | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string>('report-pipeline-overview');

  // Toast and Save Report Modal state
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showSaveReportModal, setShowSaveReportModal] = useState(false);
  
  // Dashboard action popovers state
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterPopoverPosition, setFilterPopoverPosition] = useState<{ top: number; right: number }>({ top: 60, right: 20 });
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [sharePopoverPosition, setSharePopoverPosition] = useState<{ top: number; right: number }>({ top: 60, right: 20 });
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilterConfig>({
    dateRange: 'last-30-days',
    region: 'all',
    riskLevel: 'all',
  });

  // Data toolbar state
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterConfig[]>([]);
  const [dataColumns, setDataColumns] = useState<ColumnConfig[]>([]);

  // Pane2 state
  const [pane2Mode, setPane2Mode] = useState<Pane2Mode>('dashboard');
  const [dashboardLayout, setDashboardLayout] = useState<LayoutItem[]>([]);
  const [dashboardWidgets, setDashboardWidgets] = useState<Record<string, DashboardWidgetData>>({});
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pendingComponent, setPendingComponent] = useState<ChartComponent | null>(null);
  const [draggingComponent, setDraggingComponent] = useState<ChartComponent | null>(null);

  // Widget currently being edited (for live preview)
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

  // ChatPane state
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activePopover, setActivePopover] = useState<ActivePopover | undefined>();


  // Current dashboard/report name
  const currentDashboardName = dummySidebarItems.find(
    (item) => item.id === selectedSidebarItem && item.type === 'dashboard'
  )?.label || 'Sales Overview';

  const currentReportName = getReportName(selectedReportId);

  // Calculate reference context based on current state
  const getReferenceContext = (): ReferenceContext | undefined => {
    if (selectedWidgetId && dashboardWidgets[selectedWidgetId]) {
      return {
        type: 'dashboard',
        name: dashboardWidgets[selectedWidgetId].title,
        id: selectedWidgetId,
      };
    }

    if (pane2Mode === 'dashboard' || pane1Tab === 'dashboard') {
      return {
        type: 'dashboard',
        name: currentDashboardName,
        id: selectedSidebarItem,
      };
    }

    return {
      type: 'report',
      name: currentReportName,
      id: selectedReportId,
    };
  };

  // Handle sidebar item click
  const handleSidebarItemClick = (id: string, type: ItemType) => {
    setSelectedSidebarItem(id);
    if (type === 'dashboard') {
      setPane1Tab('dashboard');
      setPane2Mode('dashboard');
    } else {
      // For chats, stay on current view
    }
  };

  // Handle drag start from Pane1
  const handleDragStart = (component: ChartComponent) => {
    setIsDraggingOver(true);
    setDraggingComponent(component);
  };

  // Handle drop on Pane2 - create widget immediately and show config form in Pane1
  const handleDrop = (_component: ChartComponent, position: { x: number; y: number }) => {
    setIsDraggingOver(false);

    if (draggingComponent) {
      // Create widget immediately on canvas with "Editing" state
      const widgetId = `widget-${Date.now()}`;
      const isTable = draggingComponent.icon === 'table';
      const defaultWidth = isTable ? 10 : 3; // Table: full width (10 cols), Others: 3 cols (~240px)
      const defaultHeight = 4; // 4 rows = 320px

      const newWidget: DashboardWidgetData = {
        id: widgetId,
        type: draggingComponent.icon === 'metric' ? 'metric' : isTable ? 'table' : 'chart',
        chartType: draggingComponent.icon,
        title: draggingComponent.label, // Default title, will be updated live
      };

      const newLayoutItem: LayoutItem = {
        i: widgetId,
        x: position.x,
        y: position.y,
        w: defaultWidth,
        h: defaultHeight,
      };

      // Add widget to canvas
      setDashboardLayout([...dashboardLayout, newLayoutItem]);
      setDashboardWidgets({ ...dashboardWidgets, [widgetId]: newWidget });

      // Set as editing widget and show config form
      setEditingWidgetId(widgetId);
      setSelectedComponent(draggingComponent);
    }
    setDraggingComponent(null);
  };

  // Handle widget approval (from chat)
  const handleWidgetApproval = () => {
    if (!pendingComponent) return;

    const widgetId = `widget-${Date.now()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reportId = (pendingComponent as any).reportId || 'report-pipeline-overview';
    const newWidget: DashboardWidgetData = {
      id: widgetId,
      type: pendingComponent.icon === 'metric' ? 'metric' : pendingComponent.icon === 'table' ? 'table' : 'chart',
      chartType: pendingComponent.icon,
      title: pendingComponent.label,
      reportId: reportId,
    };

    // Find next available position (10-col grid, minW=2)
    let newX = 0;
    let newY = 0;

    // Simple grid placement logic for 10-col grid
    if (dashboardLayout.length > 0) {
      const lastItem = dashboardLayout[dashboardLayout.length - 1];
      newX = (lastItem.x + lastItem.w) % 10;
      if (newX + 2 > 10) {
        newX = 0;
        newY = Math.max(...dashboardLayout.map((l) => l.y + l.h));
      } else {
        newY = lastItem.y;
      }
    }

    const newLayoutItem: LayoutItem = {
      i: widgetId,
      x: newX,
      y: newY,
      w: 3, // 3 columns = ~240px
      h: 4, // 4 rows = 320px
    };

    setDashboardLayout([...dashboardLayout, newLayoutItem]);
    setDashboardWidgets({ ...dashboardWidgets, [widgetId]: newWidget });
    setSelectedWidgetId(widgetId);
    setActivePopover(undefined);
    setPendingComponent(null);
    setSelectedComponent(null);

    // Add confirmation message
    const confirmMsg: Message = {
      id: `msg-${Date.now()}`,
      type: 'assistant',
      content: `**${pendingComponent.label}** widget has been added to your dashboard!\n\nYou can:\n- Drag to reposition\n- Resize by dragging corners\n- Click to select and edit\n\nWould you like me to configure this widget further?`,
      status: 'completed',
    };
    setMessages([...messages, confirmMsg]);
  };

  // Handle component config save from Pane1 - update the existing editing widget
  const handleSaveConfig = (config: ComponentConfig) => {
    if (!selectedComponent || !editingWidgetId) return;

    // Update the existing widget with final config
    const updatedWidget: DashboardWidgetData = {
      ...dashboardWidgets[editingWidgetId],
      title: config.title || config.componentType.label,
      reportId: config.reportId,
      config: { filters: config.filters },
    };

    setDashboardWidgets({ ...dashboardWidgets, [editingWidgetId]: updatedWidget });
    setSelectedWidgetId(editingWidgetId);
    setEditingWidgetId(null); // Clear editing state
    setSelectedComponent(null);
  };

  // Handle live config changes from Pane1 (for real-time preview)
  const handleConfigChange = (config: Partial<ComponentConfig>) => {
    if (!editingWidgetId) return;

    // Update widget title in real-time
    if (config.title !== undefined) {
      setDashboardWidgets((prev) => ({
        ...prev,
        [editingWidgetId]: {
          ...prev[editingWidgetId],
          title: config.title || prev[editingWidgetId].title,
        },
      }));
    }
  };

  // Handle discard config - remove the widget that was being edited
  const handleDiscardConfig = () => {
    if (editingWidgetId) {
      // Remove the widget from the canvas
      setDashboardLayout(dashboardLayout.filter((l) => l.i !== editingWidgetId));
      const newWidgets = { ...dashboardWidgets };
      delete newWidgets[editingWidgetId];
      setDashboardWidgets(newWidgets);
    }
    setEditingWidgetId(null);
    setSelectedComponent(null);
  };

  // Handle chat message with widget intent parsing
  const handleSendMessage = (content: string) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content,
    };
    setMessages([...messages, userMsg]);
    setIsStreaming(true);

    // Parse widget intent from message
    const context = getReferenceContext();
    const intent = parseWidgetIntent(content);

    // Handle widget creation intent
    if (intent.action === 'create') {
      setTimeout(() => {
        // Determine chart type (default to bar if not specified)
        const chartType = intent.chartType || 'bar';
        const chartLabels: Record<string, string> = {
          bar: 'Bar Chart',
          line: 'Line Chart',
          pie: 'Pie Chart',
          donut: 'Donut Chart',
          metric: 'Metric Card',
          table: 'Data Table',
        };
        
        const component: ChartComponent = {
          id: chartType,
          label: chartLabels[chartType],
          icon: chartType,
        };

        // Store report info for later use
        if (intent.reportId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (component as any).reportId = intent.reportId;
        }
        
        setActivePopover({
          intent: 'edit',
          title: `Add Widget: ${chartLabels[chartType]}`,
          content: getWidgetCreationApprovalContent(intent),
          primaryActionLabel: 'Add Widget',
          isStreaming: false,
        });
        setPendingComponent(component);
        
        setIsStreaming(false);
      }, 1000);
      return;
    }
    
    // Handle widget edit intent
    if (intent.action === 'edit') {
      setTimeout(() => {
        if (selectedWidgetId && dashboardWidgets[selectedWidgetId]) {
          const widget = dashboardWidgets[selectedWidgetId];
          const assistantMsg: Message = {
            id: `msg-${Date.now() + 1}`,
            type: 'assistant',
            content: `I'll help you edit **${widget.title}**. Opening the configuration panel now...\n\nYou can:\n- Change the widget title\n- Switch the chart type\n- Update the data source\n- Modify filters\n\nThe configuration form is now visible in the left panel (Pane1). Make your changes and click **Save** when ready.`,
            status: 'completed',
          };
          setMessages((prev) => [...prev, assistantMsg]);
          
          // Trigger edit mode by setting the widget as editing
          setEditingWidgetId(selectedWidgetId);
          setSelectedComponent({
            id: widget.chartType || 'bar',
            label: widget.title,
            icon: widget.chartType || 'bar',
          });
          setPane1Tab('dashboard');
        } else {
          const assistantMsg: Message = {
            id: `msg-${Date.now() + 1}`,
            type: 'assistant',
            content: `To edit a widget, please first select it by clicking on it in the dashboard. Then ask me to edit it, and I'll open the configuration panel for you.`,
            status: 'completed',
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
        setIsStreaming(false);
      }, 800);
      return;
    }

    // Default response for non-widget intents
    setTimeout(() => {
      const contextName = context?.name || 'your workspace';
      const response = getDummyResponse(contextName, content);

      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: response,
        status: 'completed',
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(false);
    }, 1500);
  };

  // Handle widget delete
  const handleWidgetDelete = (widgetId: string) => {
    setDashboardLayout(dashboardLayout.filter((l) => l.i !== widgetId));
    // Remove the widget from the widgets map
    const newWidgets = { ...dashboardWidgets };
    delete newWidgets[widgetId];
    setDashboardWidgets(newWidgets);
    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId(null);
    }
  };

  // Handle report selection
  const handleReportClick = (reportId: string) => {
    setSelectedReportId(reportId);
    // Reset toolbar state when switching reports
    setSearchValue('');
    setActiveFilters([]);
    setDataColumns(getInitialColumns(reportId));
  };

  // Handle filter changes - show toast when filters are applied
  const handleFiltersChange = (newFilters: FilterConfig[]) => {
    const hadFilters = activeFilters.length > 0;
    const hasFilters = newFilters.length > 0;
    setActiveFilters(newFilters);

    // Show toast when filters are first applied (not when removing)
    if (!hadFilters && hasFilters) {
      setShowSaveToast(true);
    } else if (hasFilters && newFilters.length > activeFilters.length) {
      // Also show when adding more filters
      setShowSaveToast(true);
    }
  };

  // Handle adding AI column
  const handleAddAIColumn = () => {
    const newColumn: ColumnConfig = {
      id: `ai-${Date.now()}`,
      label: 'AI Insight',
      isVisible: true,
      isAI: true,
    };
    setDataColumns([...dataColumns, newColumn]);
  };
  
  // Handle dashboard filter
  const handleFilterApply = (filters: DashboardFilterConfig) => {
    setDashboardFilters(filters);
    console.log('Dashboard filters applied:', filters);
  };
  
  // Handle dashboard export
  const handleExport = () => {
    console.log('Exporting dashboard as PDF...');
    // In a real implementation, this would trigger PDF generation
    alert('Dashboard export started! PDF will be downloaded shortly.');
  };
  
  // Handle dashboard refresh
  const handleRefresh = () => {
    console.log('Refreshing dashboard data...');
    // In a real implementation, this would refresh all widget data
    alert('Dashboard refreshed! Data updated.');
  };
  
  // Handle dashboard share
  const handleShare = (config: ShareConfig) => {
    console.log('Sharing dashboard with config:', config);
    // In a real implementation, this would share the dashboard
    alert(`Dashboard shared with ${config.recipients.length} recipient(s)!`);
  };

  // Handle global drag events for highlighting
  const handleGlobalDragOver = () => {
    if (pane1Tab === 'dashboard') {
      setIsDraggingOver(true);
    }
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    // Only set to false if leaving the entire container
    if (!e.relatedTarget || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleGlobalDragEnd = () => {
    setIsDraggingOver(false);
    setDraggingComponent(null);
  };

  return (
    <div
      className="flex h-full w-full gap-2"
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDragEnd={handleGlobalDragEnd}
    >
      {/* ChatSidebar */}
      <div
        style={{
          height: '100%',
          width: isSidebarCollapsed ? '64px' : '260px',
          transition: 'width 0.3s ease',
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
          onNewChatClick={() => console.log('New Chat clicked')}
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
      <div
        style={{
          height: '100%',
          width: '280px',
          flexShrink: 0,
        }}
      >
        <Pane1
          defaultTab={pane1Tab}
          subtables={salesReportsAsSubtables}
          onDragStart={handleDragStart}
          onComponentClick={(component) => setSelectedComponent(component)}
          onSubtableClick={handleReportClick}
          onSaveConfig={handleSaveConfig}
          onDiscardConfig={handleDiscardConfig}
          selectedComponent={selectedComponent}
          onSelectedComponentChange={setSelectedComponent}
          onConfigChange={handleConfigChange}
          onTabChange={(tab) => {
            setPane1Tab(tab);
            setPane2Mode(tab === 'data' ? 'data' : 'dashboard');
            setSelectedWidgetId(null);
            setSelectedComponent(null);
            // Auto-select first report when switching to data view
            if (tab === 'data') {
              setSelectedReportId('report-pipeline-overview');
            }
          }}
        />
      </div>

      {/* Pane2 - Dashboard/Report View */}
      <div
        style={{
          height: '100%',
          flex: 1,
          minWidth: 0,
        }}
      >
        <Pane2
          mode={pane2Mode}
          dashboardName={currentDashboardName}
          reportName={currentReportName}
          layout={dashboardLayout}
          widgets={dashboardWidgets}
          onLayoutChange={(layout) => setDashboardLayout(layout as LayoutItem[])}
          onWidgetSelect={setSelectedWidgetId}
          selectedWidgetId={selectedWidgetId}
          onDrop={handleDrop}
          draggingComponent={draggingComponent}
          onDropZone={(position) => {
            if (draggingComponent) {
              handleDrop(draggingComponent, position);
            }
          }}
          onWidgetEdit={(widgetId) => {
            const widget = dashboardWidgets[widgetId];
            if (!widget) return;
            
            // Set the widget as editing
            setEditingWidgetId(widgetId);
            
            // Set the component type based on widget's chart type
            setSelectedComponent({
              id: widget.chartType || 'bar',
              label: widget.title,
              icon: widget.chartType || 'bar',
            });
            
            // Switch to dashboard mode in Pane1 to show config form
            setPane1Tab('dashboard');
          }}
          onWidgetDelete={handleWidgetDelete}
          isEmpty={dashboardLayout.length === 0}
          isDraggingOver={isDraggingOver && pane2Mode === 'dashboard'}
          editingWidgetId={editingWidgetId}
          // Data toolbar props
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={activeFilters}
          onFiltersChange={handleFiltersChange}
          columns={dataColumns.length > 0 ? dataColumns : getInitialColumns(selectedReportId)}
          onColumnsChange={setDataColumns}
          onAddAIColumn={handleAddAIColumn}
          filterFields={getFilterFields(selectedReportId)}
          // Widget configuration props (config is now handled in Pane1 after drop)
          dataSources={widgetDataSources}
          // Widget detail sheet props
          drillDownFilters={widgetDrillDownFilters}
          getWidgetSourceColumns={(widgetId) => getWidgetSourceColumns(dashboardWidgets[widgetId]?.reportId)}
          getWidgetSourceData={(widgetId) => getWidgetSourceData(dashboardWidgets[widgetId]?.reportId)}
          onWidgetDrillDownChange={(widgetId, filterId, value) =>
            console.log('Drill-down change:', widgetId, filterId, value)
          }
          // Dashboard action callbacks
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
          reportTableContent={
            pane2Mode === 'data' ? (
              <ReportTable
                columns={getReportColumns(selectedReportId)}
                data={getReportData(selectedReportId)}
                onRowSelect={(row, selected) => console.log('Row selected:', row, selected)}
                onRowOpen={(row) => console.log('Row opened:', row)}
                pageSize={14}
              />
            ) : undefined
          }
        />
      </div>

      {/* Pane3 - Chat */}
      <div
        style={{
          height: '100%',
          width: isChatCollapsed ? '48px' : '380px',
          transition: 'width 0.3s ease',
          flexShrink: 0,
        }}
      >
        <ChatPane
          conversationName="Build with Von"
          messages={messages}
          isCollapsed={isChatCollapsed}
          onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
          onNewChat={() => setMessages([])}
          onViewHistory={() => console.log('View history')}
          onSendMessage={handleSendMessage}
          onStop={() => setIsStreaming(false)}
          isStreaming={isStreaming}
          referenceContext={getReferenceContext()}
          onRemoveReference={() => setSelectedWidgetId(null)}
          userName="John Doe"
          userEmail="john@example.com"
          showModeSelector={true}
          autoEditMode="off"
          activePopover={activePopover}
          onPopoverClose={() => {
            setActivePopover(undefined);
            setPendingComponent(null);
          }}
          onPopoverPrimaryAction={handleWidgetApproval}
          onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
        />
      </div>

      {/* Toast for filter save prompt */}
      {showSaveToast && (
        <div className="fixed top-4 right-4 z-[9999]">
          <Toast
            message={`${activeFilters.length} filter${activeFilters.length > 1 ? 's' : ''} applied. Save as a report?`}
            variant="info"
            onDismiss={() => setShowSaveToast(false)}
            autoDismissMs={8000}
            action={{
              label: 'Save',
              onClick: () => {
                setShowSaveToast(false);
                setShowSaveReportModal(true);
              },
            }}
          />
        </div>
      )}

      {/* Save Report Modal */}
      <SaveReportModal
        isOpen={showSaveReportModal}
        parentReports={getParentReports()}
        defaultName={`${currentReportName} - Filtered`}
        filterCount={activeFilters.length}
        onConfirm={(config: SaveReportConfig) => {
          console.log('Save report:', config);
          setShowSaveReportModal(false);
          setActiveFilters([]);
        }}
        onCancel={() => setShowSaveReportModal(false)}
      />
      
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

    </div>
  );
};

// ============================================================================
// Story Configuration
// ============================================================================

const meta = {
  title: '3-Pane/Jan30/Manual Dashboard',
  component: ManualDashboardDemo,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'neutral',
      values: [{ name: 'neutral', value: '#f5f5f7' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ManualDashboardDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * # Manual Dashboard - Full Interactive Demo with Chat-Driven Widget Control
 *
 * This is an end-to-end working demo of the three-pane dashboard builder with **natural language widget management**.
 *
 * ## Features:
 *
 * ### Left Sidebar (ChatSidebar)
 * - View chats and dashboards
 * - Click items to select
 * - Collapsible
 *
 * ### Pane1 (Component Selector)
 * - Toggle between **Dashboard** and **Data** views
 * - **Dashboard mode**: Drag and drop chart components
 * - **Data mode**: Browse and select reports
 * - Click a component to configure before adding
 * - **Edit mode**: Shows configuration form when editing widgets from chat
 *
 * ### Pane2 (Main Content Area)
 * - **Dashboard mode**: Interactive drag-n-drop grid
 *   - Drop widgets from Pane1
 *   - Shows approval modal for configuration
 *   - Resize and reposition widgets
 *   - Live preview while editing
 * - **Data mode**: Shows ReportTable with the selected report
 *
 * ### Pane3 (Chat Interface) - **NEW: Natural Language Widget Control**
 * - Reference context updates based on selection
 * - Ask questions about dashboards or reports
 * - **Create widgets with natural language commands**
 * - **Edit widgets through chat**
 * - Approval flow for all widget operations
 *
 * ## Chat-Driven Widget Control:
 *
 * ### Creating Widgets
 * You can create widgets by asking Von in natural language. Examples:
 * 
 * - **"Build me a bar chart showing data from the pipeline overview report"**
 * - **"Add a line chart from deals at risk"**
 * - **"Create a metric card from account health"**
 * - **"Make a pie chart"**
 * - **"Add a data table showing rep performance"**
 *
 * The system will:
 * 1. Parse your intent (chart type + data source)
 * 2. Show an approval popover with configuration details
 * 3. Create the widget on approval
 * 4. Allow further customization
 *
 * ### Editing Widgets
 * Select a widget, then ask Von to edit it:
 * 
 * - **"Edit this widget"**
 * - **"Change this chart"**
 * - **"Modify the widget"**
 *
 * The system will:
 * 1. Open the configuration panel in Pane1
 * 2. Show live preview of changes
 * 3. Allow you to save or discard changes
 *
 * ## Try it out:
 *
 * ### Method 1: Drag & Drop (Traditional)
 * 1. **Drag a widget** from Pane1 onto Pane2
 * 2. **Configure** in the form that appears
 * 3. **Save** to add to dashboard
 *
 * ### Method 2: Chat Commands (New!)
 * 1. **Type in chat**: "Build me a bar chart showing data from the pipeline overview report"
 * 2. **Review** the approval popover
 * 3. **Click "Add Widget"** to approve
 * 4. **Widget appears** on your dashboard
 *
 * ### Method 3: Edit via Chat
 * 1. **Click a widget** to select it
 * 2. **Type in chat**: "Edit this widget"
 * 3. **Make changes** in Pane1 configuration form
 * 4. **Save** to apply changes
 *
 * ### Other Features
 * - **Switch to Data** to see the ReportTable
 * - **Click widgets** to see the reference change
 * - **Ask questions** about your data
 */
export const Default: Story = {
  decorators: [FullLayoutDecorator],
  render: () => <ManualDashboardDemo />,
};
