import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardGrid } from './DashboardGrid';
import type { DashboardData } from './types';
import type { Layout } from 'react-grid-layout';
import { mockDashboard } from '../mockData';

const meta: Meta<typeof DashboardGrid> = {
  title: '3-Pane/Dashboard Builder/DashboardGrid',
  component: DashboardGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# DashboardGrid

A draggable grid-based dashboard component that renders widgets in a flexible, rearrangeable layout using react-grid-layout.

## Features

- **Draggable Widgets**: Users can drag and drop widgets to rearrange the dashboard layout
- **Async Data Loading**: Fetches dashboard data via provided async function
- **Layout Persistence**: Saves layout changes via provided update function
- **Animated Transitions**: Smooth loading and widget entrance animations
- **Responsive**: Adapts to container width

## Props

| Prop | Type | Description |
|------|------|-------------|
| fetchDashboardData | () => Promise<DashboardData> | Async function to fetch dashboard layout and widget data |
| updateDashboardLayout | (params: {layout: Layout}) => Promise<void> | Async function to persist layout changes |
| width | number (optional) | Fixed width for the grid, defaults to container width |

## Usage

\`\`\`tsx
<DashboardGrid
  fetchDashboardData={async () => {
    const response = await api.getDashboard();
    return response.data;
  }}
  updateDashboardLayout={async ({ layout }) => {
    await api.saveDashboardLayout(layout);
  }}
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

// Convert mockDashboard widgets to the DashboardData format
const createMockDashboardData = (): DashboardData => {
  const chartWidgets = mockDashboard.widgets.filter(w => w.type === 'chart');

  const layout: Layout = chartWidgets.map((widget, index) => ({
    i: widget.id,
    x: (index % 2) * 6,
    y: Math.floor(index / 2) * 4,
    w: 6,
    h: 4,
  }));

  const widgets: DashboardData['widgets'] = {};
  chartWidgets.forEach(widget => {
    widgets[widget.id] = widget;
  });

  return { layout, widgets };
};

const mockDashboardData = createMockDashboardData();

// Mock async functions
const mockFetchDashboardData = async (): Promise<DashboardData> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return mockDashboardData;
};

const mockUpdateDashboardLayout = async ({ layout }: { layout: Layout }): Promise<void> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Layout updated:', layout);
};

/**
 * Default dashboard grid with mock data.
 * Shows loading state initially, then displays draggable chart widgets.
 */
export const Default: Story = {
  args: {
    fetchDashboardData: mockFetchDashboardData,
    updateDashboardLayout: mockUpdateDashboardLayout,
  },
};

/**
 * Dashboard grid with fixed width.
 * Useful when embedding in a fixed-size container.
 */
export const FixedWidth: Story = {
  args: {
    fetchDashboardData: mockFetchDashboardData,
    updateDashboardLayout: mockUpdateDashboardLayout,
    width: 800,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: '800px', margin: '0 auto', padding: '16px', backgroundColor: '#f9fafb' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Dashboard grid with instant loading (no delay).
 * Demonstrates the immediate render state.
 */
export const InstantLoad: Story = {
  args: {
    fetchDashboardData: async () => mockDashboardData,
    updateDashboardLayout: mockUpdateDashboardLayout,
  },
};

/**
 * Dashboard grid with a single widget.
 * Shows minimal layout configuration.
 */
export const SingleWidget: Story = {
  args: {
    fetchDashboardData: async (): Promise<DashboardData> => {
      const widget = mockDashboard.widgets.find(w => w.type === 'chart');
      if (!widget) return { layout: [], widgets: {} };

      return {
        layout: [{ i: widget.id, x: 0, y: 0, w: 12, h: 6 }],
        widgets: { [widget.id]: widget },
      };
    },
    updateDashboardLayout: mockUpdateDashboardLayout,
  },
};

/**
 * Empty dashboard grid.
 * Shows state when no widgets are configured.
 */
export const Empty: Story = {
  args: {
    fetchDashboardData: async (): Promise<DashboardData> => ({
      layout: [],
      widgets: {},
    }),
    updateDashboardLayout: mockUpdateDashboardLayout,
  },
};

/**
 * Dashboard grid with slow loading.
 * Demonstrates extended loading state for testing.
 */
export const SlowLoading: Story = {
  args: {
    fetchDashboardData: async (): Promise<DashboardData> => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return mockDashboardData;
    },
    updateDashboardLayout: mockUpdateDashboardLayout,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows loading spinner for 3 seconds before displaying the dashboard.',
      },
    },
  },
};
