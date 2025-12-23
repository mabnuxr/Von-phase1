import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardBuilderDemo } from './DashboardBuilderDemo';
import { ThreePaneLayout } from './ThreePaneLayout';
import { BuildModeLayout } from './BuildModeLayout';
import { ModeToggle } from './ModeToggle';
import { ThinkingProcess } from './ThinkingProcess';
import { ProgressTimeline } from './ProgressTimeline';
import { DataExplorer } from './DataExplorer';
import { DashboardCanvas } from './DashboardCanvas';
import { TableViewer } from './TableViewer';
import { BuildChat } from './BuildChat';
import { ChartWidget } from './ChartWidget';
import { InteractivePrototype } from './InteractivePrototype';
import {
  mockThinkingSteps,
  mockProgressSteps,
  mockDataTables,
  mockDashboard,
  mockChatMessages,
} from './mockData';

// ============================================
// Full Demo Story
// ============================================
const meta: Meta<typeof DashboardBuilderDemo> = {
  title: '3-Pane/Dashboard Builder',
  component: DashboardBuilderDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Dashboard Builder

An interactive prototype for building dashboards using AI assistance. This component demonstrates:

## Modes

1. **Ask Mode (3-Pane Layout)**
   - Left: Collapsible sidebar with past chats
   - Center: Chat empty state with templates
   - Top: Navigation bar with tabs

2. **Build Mode (4-Column Layout)**
   - Left: Collapsed icon navigation
   - Second: Data explorer with tables and visualization palette
   - Center: Dashboard canvas with charts, metrics, and tables
   - Right: AI chat panel

## Features

- **Mode Toggle**: Switch between Ask and Build modes
- **AI Thinking Process**: Collapsible step-by-step reasoning display
- **Progress Timeline**: Visual build progress indicator
- **Data Explorer**: Browse and operate on data tables
- **Dashboard Canvas**: Interactive charts with Highcharts
- **Table Viewer**: Full-featured data table with operations
- **AI-Generated Columns**: Von gradient styling for AI columns

## Usage

Enter a query like "Give me a rundown of which accounts are at the risk of churning" to trigger the build mode and see the dashboard creation flow.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: '100vw' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DashboardBuilderDemo>;

/**
 * Full interactive demo starting in Ask mode.
 * Enter a query to trigger the build flow.
 */
export const Default: Story = {
  args: {
    userName: 'John',
    startInBuildMode: false,
    showBuildingAnimation: true,
  },
};

/**
 * Start directly in Build mode with the completed dashboard.
 */
export const BuildModeComplete: Story = {
  args: {
    userName: 'John',
    startInBuildMode: true,
    showBuildingAnimation: false,
  },
};

// ============================================
// Three Pane Layout Story
// ============================================
export const AskMode: StoryObj<typeof ThreePaneLayout> = {
  render: () => (
    <ThreePaneLayout
      userName="Sarah"
      chatItems={[
        { id: '1', label: 'Q4 Pipeline Review' },
        { id: '2', label: 'Forecast Analysis' },
        { id: '3', label: 'Rep Performance' },
        { id: '4', label: 'Deal Inspection' },
      ]}
      selectedChatId="1"
      avatarLabel="SJ"
      userDisplayName="Sarah Johnson"
      userEmail="sarah@company.com"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'The initial 3-pane layout with collapsible sidebar, top navigation, and chat empty state.',
      },
    },
  },
};

// ============================================
// Build Mode Layout Story
// ============================================
export const BuildMode: StoryObj<typeof BuildModeLayout> = {
  render: () => <BuildModeLayout />,
  parameters: {
    docs: {
      description: {
        story: 'The full 4-column build mode layout with data explorer, dashboard canvas, and chat panel.',
      },
    },
  },
};

// ============================================
// Component Stories
// ============================================

/**
 * Mode toggle component for switching between Ask and Build modes.
 */
export const ModeToggleComponent: StoryObj<typeof ModeToggle> = {
  render: () => {
    const ModeToggleWrapper = () => {
      const [mode, setMode] = React.useState<'ask' | 'build'>('ask');
      return (
        <div className="p-8 bg-gray-50 flex flex-col gap-4 items-start">
          <ModeToggle mode={mode} onModeChange={setMode} size="md" />
          <ModeToggle mode={mode} onModeChange={setMode} size="sm" />
          <p className="text-sm text-gray-500">Current mode: {mode}</p>
        </div>
      );
    };
    return <ModeToggleWrapper />;
  },
  parameters: {
    layout: 'padded',
  },
};

// We need to import React for the wrapper components
import React from 'react';

/**
 * AI thinking process with collapsible steps.
 */
export const ThinkingProcessComponent: StoryObj<typeof ThinkingProcess> = {
  render: () => {
    const ThinkingWrapper = () => {
      const [isCollapsed, setIsCollapsed] = React.useState(false);
      return (
        <div className="p-8 max-w-xl">
          <ThinkingProcess
            steps={mockThinkingSteps}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          />
        </div>
      );
    };
    return <ThinkingWrapper />;
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Displays the AI reasoning process with expandable/collapsible steps.',
      },
    },
  },
};

/**
 * Progress timeline showing build steps.
 */
export const ProgressTimelineComponent: StoryObj<typeof ProgressTimeline> = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h3 className="text-sm font-semibold mb-4 text-gray-700">Vertical Layout</h3>
        <div className="max-w-xs">
          <ProgressTimeline steps={mockProgressSteps} orientation="vertical" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-4 text-gray-700">Horizontal Layout</h3>
        <div className="max-w-3xl">
          <ProgressTimeline steps={mockProgressSteps} orientation="horizontal" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Shows build progress in vertical or horizontal orientation.',
      },
    },
  },
};

/**
 * Data explorer panel with tables and visualization palette.
 */
export const DataExplorerComponent: StoryObj<typeof DataExplorer> = {
  render: () => {
    const DataExplorerWrapper = () => {
      const [selectedTable, setSelectedTable] = React.useState<string | undefined>();
      const [viewMode, setViewMode] = React.useState<'data' | 'dashboard'>('data');
      return (
        <div className="h-[600px] w-64">
          <DataExplorer
            tables={mockDataTables}
            selectedTableId={selectedTable}
            onTableSelect={setSelectedTable}
            viewMode={viewMode}
          />
          <div className="mt-4 p-2 bg-gray-100 rounded">
            <button
              onClick={() => setViewMode(viewMode === 'data' ? 'dashboard' : 'data')}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Toggle to {viewMode === 'data' ? 'Dashboard' : 'Data'} mode
            </button>
          </div>
        </div>
      );
    };
    return <DataExplorerWrapper />;
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Left panel showing data tables with operations and visualization palette.',
      },
    },
  },
};

/**
 * Dashboard canvas with metrics, charts, and tables.
 */
export const DashboardCanvasComponent: StoryObj<typeof DashboardCanvas> = {
  render: () => {
    const CanvasWrapper = () => {
      const [viewMode, setViewMode] = React.useState<'data' | 'dashboard'>('dashboard');
      return (
        <div className="h-[800px]">
          <DashboardCanvas
            dashboard={mockDashboard}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      );
    };
    return <CanvasWrapper />;
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Main dashboard display with metrics, charts, and data tables.',
      },
    },
  },
};

/**
 * Table viewer with column operations and AI column highlighting.
 */
export const TableViewerComponent: StoryObj<typeof TableViewer> = {
  render: () => (
    <div className="h-[600px]">
      <TableViewer table={mockDataTables[0]} />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Full-featured table view with search, sort, and column operations. AI-generated columns are highlighted with the Von gradient.',
      },
    },
  },
};

/**
 * Build mode chat panel.
 */
export const BuildChatComponent: StoryObj<typeof BuildChat> = {
  render: () => {
    const ChatWrapper = () => {
      const [messages, setMessages] = React.useState(mockChatMessages);
      const [mode, setMode] = React.useState<'ask' | 'build'>('build');
      const [isLoading, setIsLoading] = React.useState(false);

      const handleSend = (message: string) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'user' as const,
            content: message,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(true);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now() + 1}`,
              role: 'assistant' as const,
              content: 'I understand. Let me update the dashboard based on your request.',
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
        }, 1500);
      };

      return (
        <div className="h-[600px] w-80">
          <BuildChat
            messages={messages}
            onSendMessage={handleSend}
            mode={mode}
            onModeChange={setMode}
            isLoading={isLoading}
          />
        </div>
      );
    };
    return <ChatWrapper />;
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Right-side chat panel for build mode with mode toggle and thinking process display.',
      },
    },
  },
};

/**
 * Individual chart widget with Highcharts.
 */
export const ChartWidgetComponent: StoryObj<typeof ChartWidget> = {
  render: () => (
    <div className="p-8 grid grid-cols-2 gap-4 max-w-4xl">
      {mockDashboard.widgets
        .filter((w) => w.type === 'chart')
        .map((widget) => (
          <ChartWidget key={widget.id} widget={widget} />
        ))}
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Individual chart widgets powered by Highcharts with various chart types.',
      },
    },
  },
};

// ============================================
// Interactive Prototype Story
// ============================================

/**
 * Full interactive prototype demonstrating the complete dashboard building flow.
 *
 * This is a cinematic demo that shows:
 * 1. Agent progress bar with animated gradient border
 * 2. Ambient glow effect around the page (purple to orange)
 * 3. Thinking process animation
 * 4. Progressive table creation with typing animations
 * 5. Simulated user interactions (filter, sort)
 * 6. Tab switching to dashboard view
 * 7. Chart configuration and rendering animations
 * 8. Finalization overlay with success state
 *
 * Click "Start Demo" to begin the ~30 second experience.
 */
export const InteractivePrototypeDemo: StoryObj<typeof InteractivePrototype> = {
  render: () => <InteractivePrototype />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: `
# Interactive Prototype

A full cinematic demonstration of the AI-powered dashboard building experience.

## What You'll See

1. **Agent Progress Bar** - Top bar showing agent status with animated gradient border
2. **Ambient Glow Effect** - Page edges glow with Von brand colors (purple ↔ orange)
3. **Thinking Process** - Step-by-step AI reasoning displayed in real-time
4. **Table Generation** - Tables appear one by one with typing title animations
5. **Simulated Interactions** - Filter and sort actions demonstrated automatically
6. **Dashboard Building** - Charts appear with configuration panel animations
7. **Finalization** - Overlay showing completion state

## How to Use

1. Click the **"Start Demo"** button to begin
2. Watch the ~30 second automated sequence
3. Click **"Explore Dashboard"** when complete
4. Use the **"Restart"** button to replay

This prototype demonstrates how Von AI builds dashboards from natural language queries.
        `,
      },
    },
  },
};
