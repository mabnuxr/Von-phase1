import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DashboardGrid } from './DashboardGrid';
import type { DashboardData } from './types';
import type { Layout } from 'react-grid-layout';
import type { DashboardWidget } from '../types';

const meta: Meta<typeof DashboardGrid> = {
  title: '3-Pane/Dashboard Builder/DashboardGrid',
  component: DashboardGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# DashboardGrid

A draggable and resizable grid-based dashboard component using react-grid-layout.

## Features

- **Drag & Drop**: Drag widgets by the grip handle in the header
- **Resizable**: Resize widgets from any corner or edge
- **Widget Actions**: Edit, expand, and delete actions for each widget
- **Responsive**: Adapts to container width

## Usage

\`\`\`tsx
<DashboardGrid
  dashboardData={dashboardData}
  onLayoutChange={(layout) => console.log('Layout changed:', layout)}
  onWidgetEdit={(widgetId) => console.log('Edit:', widgetId)}
  onWidgetExpand={(widgetId) => console.log('Expand:', widgetId)}
  onWidgetDelete={(widgetId) => console.log('Delete:', widgetId)}
/>
\`\`\`
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: '100%', padding: '16px', backgroundColor: '#f9fafb' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DashboardGrid>;

// Create comprehensive mock widgets
const createMockWidgets = (): { widgets: Record<string, DashboardWidget>; layout: Layout } => {
  const widgets: Record<string, DashboardWidget> = {
    'metric-arr': {
      id: 'metric-arr',
      type: 'metric',
      title: 'Total ARR at Risk',
      position: { x: 0, y: 0 },
      size: { width: 3, height: 4 },
      config: {
        id: 'metric-arr',
        label: 'Total ARR at Risk',
        value: '$4.2M',
        change: 12,
        changeType: 'negative',
        format: 'currency',
      },
    },
    'metric-accounts': {
      id: 'metric-accounts',
      type: 'metric',
      title: 'Accounts at Risk',
      position: { x: 3, y: 0 },
      size: { width: 3, height: 4 },
      config: {
        id: 'metric-accounts',
        label: 'Accounts at Risk',
        value: '24',
        change: 8,
        changeType: 'negative',
        format: 'number',
      },
    },
    'metric-health': {
      id: 'metric-health',
      type: 'metric',
      title: 'Avg Health Score',
      position: { x: 6, y: 0 },
      size: { width: 3, height: 4 },
      config: {
        id: 'metric-health',
        label: 'Avg Health Score',
        value: '38',
        change: -15,
        changeType: 'negative',
        format: 'number',
      },
    },
    'metric-churn': {
      id: 'metric-churn',
      type: 'metric',
      title: 'Churn Probability',
      position: { x: 9, y: 0 },
      size: { width: 3, height: 4 },
      config: {
        id: 'metric-churn',
        label: 'Avg Churn Prob',
        value: '67%',
        change: 23,
        changeType: 'negative',
        format: 'percentage',
      },
    },
    'chart-risk-region': {
      id: 'chart-risk-region',
      type: 'chart',
      title: 'ARR at Risk by Region',
      position: { x: 0, y: 4 },
      size: { width: 6, height: 8 },
      config: {
        id: 'chart-risk-region',
        type: 'bar',
        title: 'ARR at Risk by Region',
        subtitle: 'Distribution across regions',
        dataTableId: 'tbl-risk-by-region',
        xAxis: 'region',
        yAxis: 'arrAtRisk',
      },
    },
    'chart-churn-trend': {
      id: 'chart-churn-trend',
      type: 'chart',
      title: 'Churn Probability Trend',
      position: { x: 6, y: 4 },
      size: { width: 6, height: 8 },
      config: {
        id: 'chart-churn-trend',
        type: 'line',
        title: 'Churn Probability Trend',
        subtitle: 'Last 6 months',
        dataTableId: 'tbl-engagement-timeline',
        xAxis: 'month',
        yAxis: 'churnProbability',
      },
    },
    'chart-industry': {
      id: 'chart-industry',
      type: 'chart',
      title: 'Risk by Industry',
      position: { x: 0, y: 12 },
      size: { width: 4, height: 8 },
      config: {
        id: 'chart-industry',
        type: 'donut',
        title: 'Risk by Industry',
        subtitle: 'ARR distribution',
        dataTableId: 'tbl-arr-by-industry',
        xAxis: 'industry',
        yAxis: 'arr',
      },
    },
  };

  // Layout with proper positioning (no overlaps)
  // Grid is 12 columns, rowHeight is 80px (8px increments)
  const layout: Layout = [
    { i: 'metric-arr', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
    { i: 'metric-accounts', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
    { i: 'metric-health', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
    { i: 'metric-churn', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
    { i: 'chart-risk-region', x: 0, y: 3, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'chart-churn-trend', x: 6, y: 3, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'chart-industry', x: 0, y: 7, w: 4, h: 4, minW: 3, minH: 3 },
  ];

  return { widgets, layout };
};

const { widgets: mockWidgets, layout: mockLayout } = createMockWidgets();
const mockDashboardData: DashboardData = { layout: mockLayout, widgets: mockWidgets };

// Interactive wrapper that manages state
const InteractiveDashboardGrid = ({
  initialData,
  loading = false,
  width,
}: {
  initialData: DashboardData;
  loading?: boolean;
  width?: number;
}) => {
  const [dashboardData, setDashboardData] = useState(initialData);

  const handleLayoutChange = (layout: Layout) => {
    setDashboardData((prev) => ({ ...prev, layout }));
    console.log('Layout updated:', layout);
  };

  const handleWidgetEdit = (widgetId: string) => {
    console.log('Edit widget:', widgetId);
    alert(`Edit widget: ${widgetId}`);
  };

  const handleWidgetExpand = (widgetId: string) => {
    console.log('Expand widget:', widgetId);
    alert(`Expand widget: ${widgetId}`);
  };

  const handleWidgetDelete = (widgetId: string) => {
    setDashboardData((prev) => {
      const newWidgets = { ...prev.widgets };
      delete newWidgets[widgetId];
      const newLayout = prev.layout.filter((item) => item.i !== widgetId);
      return { layout: newLayout, widgets: newWidgets };
    });
    console.log('Deleted widget:', widgetId);
  };

  return (
    <DashboardGrid
      dashboardData={dashboardData}
      loading={loading}
      onLayoutChange={handleLayoutChange}
      onWidgetEdit={handleWidgetEdit}
      onWidgetExpand={handleWidgetExpand}
      onWidgetDelete={handleWidgetDelete}
      width={width}
    />
  );
};

/**
 * Default dashboard with 7 widgets (4 metrics + 3 charts).
 *
 * Try:
 * - Drag widgets by the grip icon in the header
 * - Resize widgets from corners/edges
 * - Click the menu (three dots) to edit, expand, or delete
 */
export const Default: Story = {
  render: () => <InteractiveDashboardGrid initialData={mockDashboardData} />,
};

/**
 * Dashboard in loading state.
 */
export const Loading: Story = {
  args: {
    dashboardData: mockDashboardData,
    loading: true,
    onLayoutChange: (layout: Layout) => console.log('Layout changed:', layout),
  },
};

/**
 * Empty dashboard with no widgets.
 */
export const Empty: Story = {
  args: {
    dashboardData: { layout: [], widgets: {} },
    onLayoutChange: (layout: Layout) => console.log('Layout changed:', layout),
  },
};

/**
 * Dashboard with only metric widgets.
 */
export const MetricsOnly: Story = {
  render: () => {
    const metricsData: DashboardData = {
      layout: mockLayout.filter((item) => item.i.startsWith('metric-')),
      widgets: Object.fromEntries(
        Object.entries(mockWidgets).filter(([key]) => key.startsWith('metric-'))
      ),
    };
    return <InteractiveDashboardGrid initialData={metricsData} />;
  },
};

/**
 * Dashboard with only chart widgets.
 */
export const ChartsOnly: Story = {
  render: () => {
    const chartsLayout: Layout = [
      { i: 'chart-risk-region', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 6 },
      { i: 'chart-churn-trend', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 6 },
      { i: 'chart-industry', x: 0, y: 10, w: 6, h: 10, minW: 3, minH: 6 },
    ];
    const chartsData: DashboardData = {
      layout: chartsLayout,
      widgets: Object.fromEntries(
        Object.entries(mockWidgets).filter(([key]) => key.startsWith('chart-'))
      ),
    };
    return <InteractiveDashboardGrid initialData={chartsData} />;
  },
};

/**
 * Test row-based resize behavior.
 *
 * This story demonstrates the dynamic row resize feature:
 * - When you resize a widget, adjacent widgets in the same row adjust automatically
 * - Expanding one widget will shrink/shift widgets to its right
 * - Shrinking a widget will shift widgets to the left to fill the gap
 *
 * Try resizing the first widget in each row to see the effect!
 */
export const RowResizeTest: Story = {
  render: () => {
    const testLayout: Layout = [
      // Row 1: Two equal widgets (6+6 = 12 cols)
      { i: 'chart-risk-region', x: 0, y: 0, w: 6, h: 4, minW: 2, minH: 3 },
      { i: 'chart-churn-trend', x: 6, y: 0, w: 6, h: 4, minW: 2, minH: 3 },
      // Row 2: Three widgets (4+4+4 = 12 cols)
      { i: 'metric-arr', x: 0, y: 4, w: 4, h: 3, minW: 2, minH: 2 },
      { i: 'metric-accounts', x: 4, y: 4, w: 4, h: 3, minW: 2, minH: 2 },
      { i: 'metric-health', x: 8, y: 4, w: 4, h: 3, minW: 2, minH: 2 },
    ];
    const testData: DashboardData = {
      layout: testLayout,
      widgets: {
        'chart-risk-region': mockWidgets['chart-risk-region'],
        'chart-churn-trend': mockWidgets['chart-churn-trend'],
        'metric-arr': mockWidgets['metric-arr'],
        'metric-accounts': mockWidgets['metric-accounts'],
        'metric-health': mockWidgets['metric-health'],
      },
    };
    return <InteractiveDashboardGrid initialData={testData} />;
  },
};
