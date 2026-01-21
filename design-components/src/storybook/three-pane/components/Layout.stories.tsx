import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState } from 'react';
import { TopBar } from '../../../components/TopBar/TopBar';
import { ChatSidebar } from '../../../components/ChatSidebar/ChatSidebar';
import { Pane1 } from '../../../components/Pane1/Pane1';
import { ChatPane } from '../../../components/ChatPane/ChatPane';
import type { Message } from '../../../components/Chat/types';
import type { AutoEditMode, ActivePopover } from '../../../components/Chat/StandardChatInput/types';

// Using a generic component for the meta since we have multiple components
const LayoutComponents = () => <div>Layout Components</div>;

/**
 * LayoutDecorator - Wraps stories in a container that mimics the app's layout structure
 * This ensures components that expect to fill their parent (like sidebars) display correctly.
 *
 * Structure mirrors Dashboard.tsx:
 * - Full viewport height (100vh)
 * - Flex column layout
 * - Gray background (#f5f5f7) matching the app
 */
const LayoutDecorator: Decorator = (Story) => (
  <div
    style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f7',
      overflow: 'hidden',
    }}
  >
    <Story />
  </div>
);

/**
 * LayoutDecoratorRow - For components that sit in a horizontal flex container
 * (like sidebars alongside main content)
 */
const LayoutDecoratorRow: Decorator = (Story) => (
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

const meta = {
  title: '3-Pane/Components/Layout',
  component: LayoutComponents,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'neutral',
      values: [{ name: 'neutral', value: '#f5f5f7' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LayoutComponents>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * TopBar - Default
 *
 * The default TopBar with logo and new chat button.
 * Wrapped in LayoutDecorator to show it at the top of a full-height container.
 */
export const TopBarDefault: Story = {
  decorators: [LayoutDecorator],
  render: () => (
    <TopBar
      showMenu={false}
      onLogoClick={() => console.log('Logo clicked')}
      onNewChatClick={() => console.log('New chat clicked')}
    />
  ),
};

/**
 * ChatSidebar - Default
 *
 * The default ChatSidebar with sample charts, dashboards, and folders.
 * Features:
 * - Charts section with AI-generated charts
 * - Dashboards section with ownership indicators (mine vs shared)
 * - Folder organization
 * - Context menu for rename/delete
 * - Search functionality
 * - Collapsible sidebar with hover dropdown
 */
const ChatSidebarWrapper = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedId, setSelectedId] = useState('chat-1');
  const [folders, setFolders] = useState([
    { id: 'folder-1', label: 'Q4 Analysis', isExpanded: true, type: 'chat' as const },
    { id: 'folder-2', label: 'Executive Reports', isExpanded: false, type: 'dashboard' as const },
  ]);

  const items = [
    // Chats (AI-generated conversations)
    { id: 'chat-1', label: 'Deal Pipeline by Stage', type: 'chat' as const },
    { id: 'chat-2', label: 'Win Rate Trends Q3', type: 'chat' as const },
    { id: 'chat-3', label: 'Revenue Forecast', type: 'chat' as const },
    { id: 'chat-4', label: 'Top Performers Analysis', type: 'chat' as const },

    // Dashboards - Private (mine, not shared)
    {
      id: 'dash-1',
      label: 'Sales Overview',
      type: 'dashboard' as const,
      ownership: 'mine' as const,
    },
    {
      id: 'dash-2',
      label: 'My Team Performance',
      type: 'dashboard' as const,
      ownership: 'mine' as const,
    },

    // Dashboards - Shared by you (created by you and shared with others)
    {
      id: 'dash-3',
      label: 'Q4 Pipeline Dashboard',
      type: 'dashboard' as const,
      ownership: 'shared_by_me' as const,
    },
    {
      id: 'dash-4',
      label: 'Weekly Sales Report',
      type: 'dashboard' as const,
      ownership: 'shared_by_me' as const,
    },

    // Dashboards - Org-wide (shared by someone else)
    {
      id: 'dash-5',
      label: 'Company KPIs',
      type: 'dashboard' as const,
      ownership: 'shared' as const,
      ownerName: 'Sarah Chen',
    },
    {
      id: 'dash-6',
      label: 'Regional Breakdown',
      type: 'dashboard' as const,
      ownership: 'shared' as const,
      ownerName: 'Mike Johnson',
    },

    // Items in folders
    { id: 'chat-5', label: 'Q4 Projections', type: 'chat' as const, folderId: 'folder-1' },
    {
      id: 'dash-7',
      label: 'Q4 Executive Summary',
      type: 'dashboard' as const,
      ownership: 'mine' as const,
      folderId: 'folder-2',
    },
    {
      id: 'dash-8',
      label: 'Team Metrics',
      type: 'dashboard' as const,
      ownership: 'shared_by_me' as const,
      folderId: 'folder-2',
    },
    {
      id: 'dash-9',
      label: 'Board Deck Data',
      type: 'dashboard' as const,
      ownership: 'shared' as const,
      ownerName: 'CEO',
      folderId: 'folder-2',
    },
  ];

  return (
    <div
      style={{
        height: '100%',
        width: isCollapsed ? '64px' : '260px',
        transition: 'width 0.3s ease',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
      }}
    >
      <ChatSidebar
        items={items}
        folders={folders}
        selectedItemId={selectedId}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onItemClick={(id, type) => {
          console.log('Item clicked:', id, type);
          setSelectedId(id);
        }}
        onNewChatClick={() => console.log('New Chat clicked')}
        onNewDashboardClick={() => console.log('New Dashboard clicked')}
        onNewChatFolderClick={() => console.log('New Chat Folder clicked')}
        onNewDashboardFolderClick={() => console.log('New Dashboard Folder clicked')}
        onRenameItem={(id, type) => console.log('Rename:', id, type)}
        onDeleteItem={(id, type) => console.log('Delete:', id, type)}
        onFolderToggle={(folderId, isExpanded) => {
          setFolders(folders.map((f) => (f.id === folderId ? { ...f, isExpanded } : f)));
        }}
        userName="John Doe"
        userEmail="john@example.com"
        avatarLabel="JD"
        hasNextPage={true}
        onLoadMore={() => console.log('Load more')}
      />
    </div>
  );
};

export const ChatSidebarDefault: Story = {
  decorators: [LayoutDecoratorRow],
  render: () => <ChatSidebarWrapper />,
};

/**
 * Pane1 - Default
 *
 * Dashboard builder side panel with Data/Dashboard toggle.
 * Container is resizable - drag the right edge to resize.
 * Wrapped in LayoutDecoratorRow to show it filling the full height like in the app.
 *
 * Features:
 * - Click on a component to open the configuration form
 * - Configure report source, title, and filters
 * - Drag components to add them to a dashboard
 */
const Pane1Wrapper = () => {
  const [width, setWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      setWidth(Math.max(240, Math.min(480, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{
        height: '100%',
        width: `${width}px`,
        position: 'relative',
        transition: isResizing ? 'none' : 'width 0.1s ease',
      }}
    >
      <Pane1
        onDragStart={(component) => console.log('Drag started:', component)}
        onComponentClick={(component) => console.log('Component clicked:', component)}
        onDataSourceClick={(id) => console.log('Data source clicked:', id)}
        onSaveConfig={(config) => console.log('Config saved:', config)}
        onDiscardConfig={() => console.log('Config discarded')}
      />
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '6px',
          height: '100%',
          cursor: 'ew-resize',
          backgroundColor: isResizing ? '#d1d5db' : 'transparent',
          borderRadius: '0 12px 12px 0',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = '#e5e7eb';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      />
    </div>
  );
};

export const Pane1Default: Story = {
  decorators: [LayoutDecoratorRow],
  render: () => <Pane1Wrapper />,
};

// ============================================================================
// Pane3 (ChatPane) - Chat interface for the three-pane layout
// ============================================================================

/**
 * Sample messages for the ChatPane stories
 */
const sampleMessages: Message[] = [
  {
    id: 'msg-1',
    type: 'user',
    content: 'Show me the deal pipeline by stage for Q4',
  },
  {
    id: 'msg-2',
    type: 'assistant',
    content: `Based on your Q4 deal pipeline data, here's what I found:

## Pipeline Overview

Your current pipeline shows **$4.2M** in total value across **47 opportunities**.

### Stage Breakdown:
- **Discovery**: $890K (12 deals)
- **Qualification**: $1.1M (15 deals)
- **Proposal**: $1.4M (11 deals)
- **Negotiation**: $810K (9 deals)

The pipeline is healthy with good distribution across stages.`,
    status: 'completed',
  },
];

/**
 * Pane3 - Expanded (ChatPane)
 *
 * The ChatPane in its expanded state showing:
 * - Header with conversation name and action icons
 * - Messages area with user/assistant messages
 * - Chat input at the bottom
 *
 * Features:
 * - Collapsible to the right
 * - New chat, history, and cancel buttons
 * - Reference context support for dashboards
 */
const Pane3ExpandedWrapper = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>(sampleMessages);

  const handleSend = (message: string) => {
    const newUserMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: message,
    };
    setMessages([...messages, newUserMessage]);
  };

  return (
    <div
      style={{
        height: '100%',
        width: isCollapsed ? '48px' : '400px',
        transition: 'width 0.3s ease',
      }}
    >
      <ChatPane
        conversationName="Build with Von"
        messages={messages}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onNewChat={() => {
          setMessages([]);
          console.log('New chat clicked');
        }}
        onViewHistory={() => console.log('View history clicked')}
        onSendMessage={handleSend}
        userName="John Doe"
        userEmail="john@example.com"
      />
    </div>
  );
};

// Pane3ExpandedWrapper kept for reference but not exported as story
// export const Pane3Expanded: Story = {
//   decorators: [LayoutDecoratorRow],
//   render: () => <Pane3ExpandedWrapper />,
// };

/**
 * Pane3 - With Reference
 *
 * The ChatPane with a dashboard reference shown above the input.
 * This is the main Pane3 story showing the chat interface with reference context.
 */
const Pane3WithReferenceWrapper = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [reference, setReference] = useState({
    type: 'dashboard' as const,
    name: 'Sales Overview',
    id: 'dash-1',
  });

  return (
    <div
      style={{
        height: '100%',
        width: isCollapsed ? '48px' : '400px',
        transition: 'width 0.3s ease',
      }}
    >
      <ChatPane
        conversationName="Build with Von"
        messages={sampleMessages}
        referenceContext={reference}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onRemoveReference={() => setReference(undefined as any)}
        onNewChat={() => console.log('New chat clicked')}
        onViewHistory={() => console.log('View history clicked')}
        onSendMessage={(message) => console.log('Send:', message)}
        userName="John Doe"
        userEmail="john@example.com"
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
    </div>
  );
};

export const Pane3Default: Story = {
  decorators: [LayoutDecoratorRow],
  render: () => <Pane3WithReferenceWrapper />,
};

// ============================================================================
// Additional Pane3 configurations (kept for reference, not exported as stories)
// ============================================================================

/**
 * Pane3 - Collapsed configuration
 */
const _Pane3CollapsedConfig = {
  decorators: [LayoutDecoratorRow],
  render: () => (
    <div style={{ height: '100%', width: '48px' }}>
      <ChatPane
        conversationName="Build with Von"
        isCollapsed={true}
        onToggleCollapse={() => console.log('Expand clicked')}
      />
    </div>
  ),
};

/**
 * Pane3 - Empty State configuration
 */
const _Pane3EmptyConfig = {
  decorators: [LayoutDecoratorRow],
  render: () => (
    <div style={{ height: '100%', width: '400px' }}>
      <ChatPane
        conversationName="Build with Von"
        messages={[]}
        onNewChat={() => console.log('New chat clicked')}
        onViewHistory={() => console.log('View history clicked')}
        onSendMessage={(message: string) => console.log('Send:', message)}
        userName="John Doe"
        userEmail="john@example.com"
      />
    </div>
  ),
};

/**
 * Pane3 - Streaming configuration
 */
const _Pane3StreamingConfig = {
  decorators: [LayoutDecoratorRow],
  render: () => {
    const streamingMessages: Message[] = [
      {
        id: 'msg-1',
        type: 'user',
        content: 'What are the top performing deals this quarter?',
      },
      {
        id: 'msg-2',
        type: 'assistant',
        content: "I'm analyzing your deal data now. Looking at the top performers...",
        isStreaming: true,
        status: 'streaming',
      },
    ];

    return (
      <div style={{ height: '100%', width: '400px' }}>
        <ChatPane
          conversationName="Build with Von"
          messages={streamingMessages}
          isStreaming={true}
          onStop={() => console.log('Stop clicked')}
          onCancel={() => console.log('Cancel clicked')}
          onNewChat={() => console.log('New chat clicked')}
          onViewHistory={() => console.log('View history clicked')}
          onSendMessage={(message: string) => console.log('Send:', message)}
          userName="John Doe"
          userEmail="john@example.com"
        />
      </div>
    );
  },
};

// Keep references to prevent unused variable warnings
void _Pane3CollapsedConfig;
void _Pane3EmptyConfig;
void _Pane3StreamingConfig;
void Pane3ExpandedWrapper;

// ============================================================================
// Pane3 with Mode Selector and Popovers
// ============================================================================

// Sample markdown content for the plan popover
const SAMPLE_PLAN_CONTENT = `## Implementation Plan

I'll help you create a sales performance dashboard. Here's my plan:

### Step 1: Data Analysis
- Analyze the existing sales data structure
- Identify key metrics (revenue, deals closed, conversion rate)

### Step 2: Widget Creation
- Create a KPI summary widget for top-level metrics
- Build a line chart for revenue trends over time
- Add a bar chart for deals by stage

### Step 3: Layout & Styling
- Arrange widgets in a 2x2 grid layout
- Apply the design system styling
- Add responsive behavior
`;

const SAMPLE_EDIT_CONTENT = `## Proposed Edits

I'll make the following changes to your dashboard:

### Changes to "Revenue by Region" Chart
- Update chart type from bar to stacked bar
- Add year-over-year comparison
- Include percentage change labels

### Changes to Layout
- Move the chart to the top-right position
- Increase height by 50px for better visibility

Do you want me to proceed with these changes?
`;

/**
 * Pane3 - With Mode Selector
 *
 * The ChatPane with the Auto Edits mode selector button.
 * Click the button to cycle through modes: off -> on -> Plan Mode
 */
const Pane3WithModeSelectorWrapper = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('off');

  const handleSend = (message: string) => {
    const newUserMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: message,
    };
    setMessages([...messages, newUserMessage]);
  };

  return (
    <div
      style={{
        height: '100%',
        width: isCollapsed ? '48px' : '400px',
        transition: 'width 0.3s ease',
      }}
    >
      <ChatPane
        conversationName="Build with Von"
        messages={messages}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onNewChat={() => {
          setMessages([]);
          console.log('New chat clicked');
        }}
        onViewHistory={() => console.log('View history clicked')}
        onSendMessage={handleSend}
        userName="John Doe"
        userEmail="john@example.com"
        showModeSelector={true}
        autoEditMode={autoEditMode}
        onAutoEditModeChange={setAutoEditMode}
      />
    </div>
  );
};

export const Pane3WithModeSelector: Story = {
  decorators: [LayoutDecoratorRow],
  render: () => <Pane3WithModeSelectorWrapper />,
};

/**
 * Pane3 - With Plan Popover
 *
 * The ChatPane showing the Plan Mode popover with a markdown plan from the LLM.
 * Features:
 * - Mode selector in "Plan Mode" state
 * - Plan popover above the chat input
 * - Approve button and close button
 * - Feedback input at the bottom
 */
const Pane3WithPlanPopoverWrapper = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      type: 'user',
      content: 'Create a sales performance dashboard with revenue trends and deal pipeline',
    },
  ]);
  const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('plan');
  const [activePopover, setActivePopover] = useState<ActivePopover | undefined>({
    intent: 'plan',
    title: 'Plan for "Create a sales dashboard"',
    content: SAMPLE_PLAN_CONTENT,
    primaryActionLabel: 'Approve Plan',
    isStreaming: false,
  });

  const handleApprove = () => {
    console.log('Plan approved!');
    setActivePopover(undefined);
    setAutoEditMode('off');
    // Add assistant response
    setMessages([
      ...messages,
      {
        id: `msg-${Date.now()}`,
        type: 'assistant',
        content: "Great! I'll start implementing the dashboard now based on the approved plan.",
        status: 'completed',
      },
    ]);
  };

  return (
    <div
      style={{
        height: '100%',
        width: isCollapsed ? '48px' : '400px',
        transition: 'width 0.3s ease',
      }}
    >
      <ChatPane
        conversationName="Build with Von"
        messages={messages}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onNewChat={() => console.log('New chat clicked')}
        onViewHistory={() => console.log('View history clicked')}
        onSendMessage={(message) => console.log('Send:', message)}
        userName="John Doe"
        userEmail="john@example.com"
        showModeSelector={true}
        autoEditMode={autoEditMode}
        onAutoEditModeChange={setAutoEditMode}
        activePopover={activePopover}
        onPopoverClose={() => {
          setActivePopover(undefined);
          setAutoEditMode('off');
        }}
        onPopoverPrimaryAction={handleApprove}
        onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
      />
    </div>
  );
};

export const Pane3WithPlanPopover: Story = {
  decorators: [LayoutDecoratorRow],
  render: () => <Pane3WithPlanPopoverWrapper />,
};

/**
 * Pane3 - With Edit Request Popover
 *
 * The ChatPane showing an edit request popover asking user to confirm edits.
 */
const Pane3WithEditPopoverWrapper = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      type: 'user',
      content: 'Change the Revenue by Region chart to a stacked bar chart',
    },
  ]);
  const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('on');
  const [activePopover, setActivePopover] = useState<ActivePopover | undefined>({
    intent: 'edit',
    title: 'Edit: Update Revenue Chart',
    content: SAMPLE_EDIT_CONTENT,
    primaryActionLabel: 'Confirm Edits',
    isStreaming: false,
  });

  const handleConfirm = () => {
    console.log('Edits confirmed!');
    setActivePopover(undefined);
    // Add assistant response
    setMessages([
      ...messages,
      {
        id: `msg-${Date.now()}`,
        type: 'assistant',
        content:
          "Done! I've updated the Revenue by Region chart to a stacked bar chart with year-over-year comparison.",
        status: 'completed',
      },
    ]);
  };

  return (
    <div
      style={{
        height: '100%',
        width: isCollapsed ? '48px' : '400px',
        transition: 'width 0.3s ease',
      }}
    >
      <ChatPane
        conversationName="Build with Von"
        messages={messages}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onNewChat={() => console.log('New chat clicked')}
        onViewHistory={() => console.log('View history clicked')}
        onSendMessage={(message) => console.log('Send:', message)}
        userName="John Doe"
        userEmail="john@example.com"
        showModeSelector={true}
        autoEditMode={autoEditMode}
        onAutoEditModeChange={setAutoEditMode}
        activePopover={activePopover}
        onPopoverClose={() => setActivePopover(undefined)}
        onPopoverPrimaryAction={handleConfirm}
        onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
      />
    </div>
  );
};

export const Pane3WithEditPopover: Story = {
  decorators: [LayoutDecoratorRow],
  render: () => <Pane3WithEditPopoverWrapper />,
};

/**
 * Pane3 - Interactive Mode Flow
 *
 * Full interactive demo showing how mode selection triggers popovers.
 * - Switch to "Plan Mode" to see the plan popover appear
 * - In "Auto edits: on" mode, sending a message shows an edit popover
 */
const Pane3InteractiveFlowWrapper = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('off');
  const [activePopover, setActivePopover] = useState<ActivePopover | undefined>();

  const handleModeChange = (newMode: AutoEditMode) => {
    setAutoEditMode(newMode);

    // When entering plan mode, show the plan popover (simulating LLM response)
    if (newMode === 'plan' && messages.length > 0) {
      setTimeout(() => {
        setActivePopover({
          intent: 'plan',
          title: 'Plan for your request',
          content: SAMPLE_PLAN_CONTENT,
          primaryActionLabel: 'Approve Plan',
          isStreaming: false,
        });
      }, 500);
    } else {
      setActivePopover(undefined);
    }
  };

  const handleSend = (message: string) => {
    const newUserMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: message,
    };
    setMessages([...messages, newUserMessage]);

    // If in auto edit mode, show an edit popover (simulating LLM response)
    if (autoEditMode === 'on') {
      setTimeout(() => {
        setActivePopover({
          intent: 'edit',
          title: `Edit: ${message.slice(0, 30)}...`,
          content: SAMPLE_EDIT_CONTENT,
          primaryActionLabel: 'Confirm Edits',
          isStreaming: false,
        });
      }, 500);
    } else if (autoEditMode === 'plan') {
      setTimeout(() => {
        setActivePopover({
          intent: 'plan',
          title: `Plan for "${message.slice(0, 25)}..."`,
          content: SAMPLE_PLAN_CONTENT,
          primaryActionLabel: 'Approve Plan',
          isStreaming: false,
        });
      }, 500);
    }
  };

  const handlePopoverAction = () => {
    const assistantMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'assistant',
      content:
        activePopover?.intent === 'plan'
          ? "Great! I'll start implementing now."
          : 'Done! The changes have been applied.',
      status: 'completed',
    };
    setMessages([...messages, assistantMessage]);
    setActivePopover(undefined);
    if (autoEditMode === 'plan') {
      setAutoEditMode('off');
    }
  };

  return (
    <div
      style={{
        height: '100%',
        width: isCollapsed ? '48px' : '400px',
        transition: 'width 0.3s ease',
      }}
    >
      <ChatPane
        conversationName="Build with Von"
        messages={messages}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onNewChat={() => {
          setMessages([]);
          setActivePopover(undefined);
          setAutoEditMode('off');
        }}
        onViewHistory={() => console.log('View history clicked')}
        onSendMessage={handleSend}
        userName="John Doe"
        userEmail="john@example.com"
        showModeSelector={true}
        autoEditMode={autoEditMode}
        onAutoEditModeChange={handleModeChange}
        activePopover={activePopover}
        onPopoverClose={() => {
          setActivePopover(undefined);
          if (autoEditMode === 'plan') {
            setAutoEditMode('off');
          }
        }}
        onPopoverPrimaryAction={handlePopoverAction}
        onPopoverFeedback={(feedback) => console.log('Feedback:', feedback)}
      />
    </div>
  );
};

export const Pane3InteractiveFlow: Story = {
  decorators: [LayoutDecoratorRow],
  render: () => <Pane3InteractiveFlowWrapper />,
};

/**
 * Pane3 - With Reference and Mode Selector
 *
 * The ChatPane with both a dashboard reference and the mode selector.
 */
const Pane3WithReferenceAndModeSelectorWrapper = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('off');
  const [reference, setReference] = useState<
    | {
        type: 'dashboard' | 'report' | 'document';
        name: string;
        id: string;
      }
    | undefined
  >({
    type: 'dashboard',
    name: 'Sales Overview',
    id: 'dash-1',
  });

  return (
    <div
      style={{
        height: '100%',
        width: isCollapsed ? '48px' : '400px',
        transition: 'width 0.3s ease',
      }}
    >
      <ChatPane
        conversationName="Build with Von"
        messages={sampleMessages}
        referenceContext={reference}
        onRemoveReference={() => setReference(undefined)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onNewChat={() => console.log('New chat clicked')}
        onViewHistory={() => console.log('View history clicked')}
        onSendMessage={(message) => console.log('Send:', message)}
        userName="John Doe"
        userEmail="john@example.com"
        showModeSelector={true}
        autoEditMode={autoEditMode}
        onAutoEditModeChange={setAutoEditMode}
      />
    </div>
  );
};

export const Pane3WithReferenceAndModeSelector: Story = {
  decorators: [LayoutDecoratorRow],
  render: () => <Pane3WithReferenceAndModeSelectorWrapper />,
};
