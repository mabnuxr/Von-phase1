import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState, useCallback } from 'react';
import { ChatSidebar } from '../../../components/ChatSidebar';
import { Pane1, type ChartComponent, type ComponentConfig } from '../../../components/Pane1';
import { ChatPane } from '../../../components/ChatPane';
import { DashboardCanvas } from '../../../components/DashboardBuilder/DashboardCanvas';
import type { Message } from '../../../components/Chat/types';
import type {
  Dashboard,
  DashboardWidget,
  DataTable,
  DragItem,
} from '../../../components/DashboardBuilder/types';
import { mockDashboard, mockDataTables } from '../../../components/DashboardBuilder/mockData';

/**
 * FullPageDecorator - Full viewport height container
 */
const FullPageDecorator: Decorator = (Story) => (
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

const meta = {
  title: '3-Pane/Dashboard Builder/BuildModeCompleteNew',
  decorators: [FullPageDecorator],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'neutral',
      values: [{ name: 'neutral', value: '#f5f5f7' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Build Mode Complete New
// ============================================================================

/**
 * Build Mode Complete (New Layout)
 *
 * Complete build mode layout using the new components:
 * - ChatSidebar (collapsible) on the left
 * - Pane1 (Dashboard Builder panel with drag-and-drop components)
 * - DashboardCanvas in the center
 * - ChatPane (Pane3) on the right
 *
 * Features:
 * - Drag and drop chart components from Pane1 to DashboardCanvas
 * - Configure components via form in Pane1
 * - Chat with Von AI in the right pane
 * - Collapsible sidebar and chat pane
 */
export const BuildModeCompleteNew: Story = {
  render: () => {
    // Sidebar state
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>('dash-1');

    // Chat pane state
    const [isChatCollapsed, setIsChatCollapsed] = useState(false);
    const [chatMessages, setChatMessages] = useState<Message[]>([
      {
        id: 'msg-1',
        type: 'assistant',
        content: `I've analyzed your customer data and identified **8 accounts** that are showing signs of potential churn. Here's what I found:

**Key Insights:**
- **Total ARR at Risk:** $4.95M across all flagged accounts
- **Critical Accounts:** 3 accounts require immediate attention
- **Average Health Score:** 37 (down 8 points from last quarter)

The main risk factors I identified are:
1. **Declining engagement** - Login frequency dropped 40% over 6 months
2. **Rising support tickets** - 3.4x increase in open tickets
3. **Low feature adoption** - Only 35% of available features being used

I've created a dashboard with detailed breakdowns by region, industry, and individual account metrics. You can drag components from the left panel to customize further.`,
      },
    ]);
    const [isStreaming, setIsStreaming] = useState(false);

    // Dashboard state
    const [dashboard, setDashboard] = useState<Dashboard>(mockDashboard);
    const [viewMode, setViewMode] = useState<'data' | 'dashboard'>('dashboard');

    // Pane1 state - for component configuration
    const [selectedComponent, setSelectedComponent] = useState<ChartComponent | null>(null);

    // Sample sidebar items
    const sampleItems = [
      { id: 'chat-1', label: 'Pipeline by Stage', type: 'chat' as const },
      { id: 'chat-2', label: 'Q4 Revenue Forecast', type: 'chat' as const },
      {
        id: 'dash-1',
        label: 'Churn Risk Analysis',
        type: 'dashboard' as const,
        ownership: 'mine' as const,
      },
      {
        id: 'dash-2',
        label: 'Sales Overview',
        type: 'dashboard' as const,
        ownership: 'shared' as const,
        ownerName: 'Marketing Team',
      },
    ];

    const sampleFolders = [
      { id: 'folder-1', label: 'Q4 Analysis', isExpanded: false, type: 'chat' as const },
    ];

    // Data tables for Pane1
    const dataTables: DataTable[] = mockDataTables;

    // Handle sending a chat message
    const handleSendMessage = useCallback((message: string) => {
      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        type: 'user',
        content: message,
      };
      setChatMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      // Simulate AI response
      setTimeout(() => {
        const aiMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          type: 'assistant',
          content: `I understand you want to "${message}". I'm updating the dashboard based on your request. You can see the changes reflected in the visualization, or drag additional components from the left panel to customize further.`,
        };
        setChatMessages((prev) => [...prev, aiMessage]);
        setIsStreaming(false);
      }, 1500);
    }, []);

    // Handle drag start from Pane1
    const handleDragStart = useCallback((component: ChartComponent) => {
      // Create drag data for the DashboardCanvas
      const dragItem: DragItem = {
        type: 'visualization',
        visualizationType: component.icon as DragItem['visualizationType'],
      };

      // Store in a custom event or use data transfer in the actual drag event
      // This will be picked up by DashboardCanvas's onDrop handler
      const event = new CustomEvent('pane1-drag-start', { detail: dragItem });
      window.dispatchEvent(event);
    }, []);

    // Handle component click in Pane1 (opens configuration form)
    const handleComponentClick = useCallback((component: ChartComponent) => {
      setSelectedComponent(component);
    }, []);

    // Handle saving component configuration
    const handleSaveConfig = useCallback((config: ComponentConfig) => {
      console.log('Component config saved:', config);

      // Create new widget from the configuration
      const newWidget: DashboardWidget = {
        id: `widget-${Date.now()}`,
        type:
          config.componentType.icon === 'metric'
            ? 'metric'
            : config.componentType.icon === 'table'
              ? 'table'
              : 'chart',
        title: config.title,
        position: { x: 0, y: 0 },
        size: { width: 6, height: 2 },
        config: {
          id: `config-${Date.now()}`,
          type: config.componentType.icon as 'bar' | 'line' | 'pie' | 'donut',
          title: config.title,
          dataTableId: config.reportId,
        },
      };

      setDashboard((prev) => ({
        ...prev,
        widgets: [...prev.widgets, newWidget],
        updatedAt: new Date(),
      }));

      setSelectedComponent(null);
    }, []);

    // Handle widget add via drag-and-drop
    const handleWidgetAdd = useCallback((widget: DashboardWidget) => {
      setDashboard((prev) => ({
        ...prev,
        widgets: [...prev.widgets, widget],
        updatedAt: new Date(),
      }));
    }, []);

    // Handle widget delete
    const handleWidgetDelete = useCallback((widgetId: string) => {
      setDashboard((prev) => ({
        ...prev,
        widgets: prev.widgets.filter((w) => w.id !== widgetId),
        updatedAt: new Date(),
      }));
    }, []);

    return (
      <div className="flex flex-col h-full">
        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden p-2 gap-2">
          {/* ChatSidebar (Left) */}
          <div
            style={{
              width: isSidebarCollapsed ? '64px' : '240px',
              transition: 'width 0.3s ease',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              flexShrink: 0,
            }}
          >
            <ChatSidebar
              items={sampleItems}
              folders={sampleFolders}
              selectedItemId={selectedItemId}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onItemClick={(id) => setSelectedItemId(id)}
              onNewChatClick={() => console.log('New Chat')}
              onNewDashboardClick={() => console.log('New Dashboard')}
              onNewChatFolderClick={() => console.log('New Chat Folder')}
              onNewDashboardFolderClick={() => console.log('New Dashboard Folder')}
              onRenameItem={(id, type, newName) => console.log('Rename:', id, type, newName)}
              onDeleteItem={(id, type) => console.log('Delete:', id, type)}
              onFolderToggle={() => {}}
              userName="Sarah Chen"
              userEmail="sarah@company.com"
              avatarLabel="SC"
              onProfileClick={() => console.log('Profile clicked')}
              onSettingsClick={() => console.log('Settings clicked')}
              onSignOutClick={() => console.log('Sign out clicked')}
            />
          </div>

          {/* Pane1 - Dashboard Builder Panel */}
          <div
            style={{
              width: '280px',
              flexShrink: 0,
            }}
          >
            <Pane1
              dataSources={dataTables.map((t) => ({
                id: t.id,
                label: t.name,
                columnCount: t.columns.length,
                fields: t.columns.map((c) => ({ value: c.key, label: c.label })),
              }))}
              onDragStart={handleDragStart}
              onComponentClick={handleComponentClick}
              onDataSourceClick={(id) => console.log('Data source clicked:', id)}
              defaultTab="dashboard"
              onSaveConfig={handleSaveConfig}
              onDiscardConfig={() => setSelectedComponent(null)}
              selectedComponent={selectedComponent}
              onSelectedComponentChange={setSelectedComponent}
            />
          </div>

          {/* Center - Dashboard Canvas */}
          <div
            className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            <DashboardCanvas
              dashboard={dashboard}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onShare={() => console.log('Share clicked')}
              onFilter={() => console.log('Filter clicked')}
              onExport={() => console.log('Export clicked')}
              onWidgetAdd={handleWidgetAdd}
              onWidgetDelete={handleWidgetDelete}
              dataTables={dataTables}
              hideViewToggle
            />
          </div>

          {/* ChatPane (Right - Pane3) */}
          <div
            style={{
              width: isChatCollapsed ? '48px' : '320px',
              transition: 'width 0.3s ease',
              flexShrink: 0,
            }}
          >
            <ChatPane
              conversationName="Build with Von"
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              isCollapsed={isChatCollapsed}
              onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
              onNewChat={() => {
                setChatMessages([]);
                console.log('New chat');
              }}
              onViewHistory={() => console.log('View history')}
              userName="Sarah Chen"
              userEmail="sarah@company.com"
              placeholder="Ask Von to modify the dashboard..."
            />
          </div>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Build Mode - Sidebar Collapsed
// ============================================================================

/**
 * Build Mode with Collapsed Sidebar
 *
 * Same as BuildModeCompleteNew but with the sidebar collapsed by default.
 */
export const SidebarCollapsed: Story = {
  render: () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>('dash-1');
    const [isChatCollapsed, setIsChatCollapsed] = useState(false);
    const [chatMessages, setChatMessages] = useState<Message[]>([
      {
        id: 'msg-1',
        type: 'assistant',
        content:
          'Your dashboard is ready! Drag components from the left panel to add more visualizations.',
      },
    ]);
    const [dashboard, setDashboard] = useState<Dashboard>(mockDashboard);
    const [viewMode, setViewMode] = useState<'data' | 'dashboard'>('dashboard');
    const [selectedComponent, setSelectedComponent] = useState<ChartComponent | null>(null);

    const sampleItems = [
      { id: 'chat-1', label: 'Pipeline by Stage', type: 'chat' as const },
      {
        id: 'dash-1',
        label: 'Churn Risk Analysis',
        type: 'dashboard' as const,
        ownership: 'mine' as const,
      },
    ];

    const dataTables: DataTable[] = mockDataTables;

    const handleSendMessage = useCallback((message: string) => {
      const userMessage: Message = { id: `msg-${Date.now()}`, type: 'user', content: message };
      setChatMessages((prev) => [...prev, userMessage]);

      setTimeout(() => {
        const aiMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          type: 'assistant',
          content: `Got it! I'll help you with "${message}".`,
        };
        setChatMessages((prev) => [...prev, aiMessage]);
      }, 1000);
    }, []);

    const handleWidgetAdd = useCallback((widget: DashboardWidget) => {
      setDashboard((prev) => ({
        ...prev,
        widgets: [...prev.widgets, widget],
        updatedAt: new Date(),
      }));
    }, []);

    const handleWidgetDelete = useCallback((widgetId: string) => {
      setDashboard((prev) => ({
        ...prev,
        widgets: prev.widgets.filter((w) => w.id !== widgetId),
        updatedAt: new Date(),
      }));
    }, []);

    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-1 overflow-hidden p-2 gap-2">
          <div
            style={{
              width: isSidebarCollapsed ? '64px' : '240px',
              transition: 'width 0.3s ease',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              flexShrink: 0,
            }}
          >
            <ChatSidebar
              items={sampleItems}
              selectedItemId={selectedItemId}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onItemClick={(id) => setSelectedItemId(id)}
              onNewChatClick={() => console.log('New Chat')}
              onFolderToggle={() => {}}
              userName="Sarah Chen"
              userEmail="sarah@company.com"
              avatarLabel="SC"
            />
          </div>

          <div style={{ width: '280px', flexShrink: 0 }}>
            <Pane1
              dataSources={dataTables.map((t) => ({
                id: t.id,
                label: t.name,
                columnCount: t.columns.length,
                fields: t.columns.map((c) => ({ value: c.key, label: c.label })),
              }))}
              defaultTab="dashboard"
              selectedComponent={selectedComponent}
              onSelectedComponentChange={setSelectedComponent}
            />
          </div>

          <div
            className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            <DashboardCanvas
              dashboard={dashboard}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onWidgetAdd={handleWidgetAdd}
              onWidgetDelete={handleWidgetDelete}
              dataTables={dataTables}
              hideViewToggle
            />
          </div>

          <div
            style={{
              width: isChatCollapsed ? '48px' : '320px',
              transition: 'width 0.3s ease',
              flexShrink: 0,
            }}
          >
            <ChatPane
              conversationName="Build with Von"
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isCollapsed={isChatCollapsed}
              onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
              userName="Sarah Chen"
              userEmail="sarah@company.com"
              placeholder="Ask Von to modify the dashboard..."
            />
          </div>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Build Mode - Chat Pane Collapsed
// ============================================================================

/**
 * Build Mode with Collapsed Chat Pane
 *
 * Same as BuildModeCompleteNew but with the chat pane collapsed by default.
 * Shows more space for the dashboard canvas.
 */
export const ChatPaneCollapsed: Story = {
  render: () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>('dash-1');
    const [isChatCollapsed, setIsChatCollapsed] = useState(true);
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [dashboard, setDashboard] = useState<Dashboard>(mockDashboard);
    const [viewMode, setViewMode] = useState<'data' | 'dashboard'>('dashboard');
    const [selectedComponent, setSelectedComponent] = useState<ChartComponent | null>(null);

    const sampleItems = [
      { id: 'chat-1', label: 'Pipeline by Stage', type: 'chat' as const },
      {
        id: 'dash-1',
        label: 'Churn Risk Analysis',
        type: 'dashboard' as const,
        ownership: 'mine' as const,
      },
    ];

    const dataTables: DataTable[] = mockDataTables;

    const handleSendMessage = useCallback((message: string) => {
      const userMessage: Message = { id: `msg-${Date.now()}`, type: 'user', content: message };
      setChatMessages((prev) => [...prev, userMessage]);

      setTimeout(() => {
        const aiMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          type: 'assistant',
          content: `Got it! I'll help you with "${message}".`,
        };
        setChatMessages((prev) => [...prev, aiMessage]);
      }, 1000);
    }, []);

    const handleWidgetAdd = useCallback((widget: DashboardWidget) => {
      setDashboard((prev) => ({
        ...prev,
        widgets: [...prev.widgets, widget],
        updatedAt: new Date(),
      }));
    }, []);

    const handleWidgetDelete = useCallback((widgetId: string) => {
      setDashboard((prev) => ({
        ...prev,
        widgets: prev.widgets.filter((w) => w.id !== widgetId),
        updatedAt: new Date(),
      }));
    }, []);

    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-1 overflow-hidden p-2 gap-2">
          <div
            style={{
              width: isSidebarCollapsed ? '64px' : '240px',
              transition: 'width 0.3s ease',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              flexShrink: 0,
            }}
          >
            <ChatSidebar
              items={sampleItems}
              selectedItemId={selectedItemId}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onItemClick={(id) => setSelectedItemId(id)}
              onNewChatClick={() => console.log('New Chat')}
              onFolderToggle={() => {}}
              userName="Sarah Chen"
              userEmail="sarah@company.com"
              avatarLabel="SC"
            />
          </div>

          <div style={{ width: '280px', flexShrink: 0 }}>
            <Pane1
              dataSources={dataTables.map((t) => ({
                id: t.id,
                label: t.name,
                columnCount: t.columns.length,
                fields: t.columns.map((c) => ({ value: c.key, label: c.label })),
              }))}
              defaultTab="dashboard"
              selectedComponent={selectedComponent}
              onSelectedComponentChange={setSelectedComponent}
            />
          </div>

          <div
            className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            <DashboardCanvas
              dashboard={dashboard}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onWidgetAdd={handleWidgetAdd}
              onWidgetDelete={handleWidgetDelete}
              dataTables={dataTables}
              hideViewToggle
            />
          </div>

          <div
            style={{
              width: isChatCollapsed ? '48px' : '320px',
              transition: 'width 0.3s ease',
              flexShrink: 0,
            }}
          >
            <ChatPane
              conversationName="Build with Von"
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isCollapsed={isChatCollapsed}
              onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
              userName="Sarah Chen"
              userEmail="sarah@company.com"
              placeholder="Ask Von to modify the dashboard..."
            />
          </div>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Build Mode - Data View
// ============================================================================

/**
 * Build Mode with Data View
 *
 * Shows the dashboard in "Data" view mode where users can see the
 * underlying data tables.
 */
export const DataView: Story = {
  render: () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>('dash-1');
    const [isChatCollapsed, setIsChatCollapsed] = useState(false);
    const [chatMessages, setChatMessages] = useState<Message[]>([
      {
        id: 'msg-1',
        type: 'assistant',
        content: 'Showing the data view. You can switch to Dashboard view using the toggle above.',
      },
    ]);
    const [dashboard, setDashboard] = useState<Dashboard>(mockDashboard);
    const [viewMode, setViewMode] = useState<'data' | 'dashboard'>('data');
    const [selectedComponent, setSelectedComponent] = useState<ChartComponent | null>(null);

    const sampleItems = [
      { id: 'chat-1', label: 'Pipeline by Stage', type: 'chat' as const },
      {
        id: 'dash-1',
        label: 'Churn Risk Analysis',
        type: 'dashboard' as const,
        ownership: 'mine' as const,
      },
    ];

    const dataTables: DataTable[] = mockDataTables;

    const handleSendMessage = useCallback((message: string) => {
      const userMessage: Message = { id: `msg-${Date.now()}`, type: 'user', content: message };
      setChatMessages((prev) => [...prev, userMessage]);

      setTimeout(() => {
        const aiMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          type: 'assistant',
          content: `Got it! I'll help you with "${message}".`,
        };
        setChatMessages((prev) => [...prev, aiMessage]);
      }, 1000);
    }, []);

    const handleWidgetAdd = useCallback((widget: DashboardWidget) => {
      setDashboard((prev) => ({
        ...prev,
        widgets: [...prev.widgets, widget],
        updatedAt: new Date(),
      }));
    }, []);

    const handleWidgetDelete = useCallback((widgetId: string) => {
      setDashboard((prev) => ({
        ...prev,
        widgets: prev.widgets.filter((w) => w.id !== widgetId),
        updatedAt: new Date(),
      }));
    }, []);

    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-1 overflow-hidden p-2 gap-2">
          <div
            style={{
              width: isSidebarCollapsed ? '64px' : '240px',
              transition: 'width 0.3s ease',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              flexShrink: 0,
            }}
          >
            <ChatSidebar
              items={sampleItems}
              selectedItemId={selectedItemId}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onItemClick={(id) => setSelectedItemId(id)}
              onNewChatClick={() => console.log('New Chat')}
              onFolderToggle={() => {}}
              userName="Sarah Chen"
              userEmail="sarah@company.com"
              avatarLabel="SC"
            />
          </div>

          <div style={{ width: '280px', flexShrink: 0 }}>
            <Pane1
              dataSources={dataTables.map((t) => ({
                id: t.id,
                label: t.name,
                columnCount: t.columns.length,
                fields: t.columns.map((c) => ({ value: c.key, label: c.label })),
              }))}
              defaultTab="data"
              selectedComponent={selectedComponent}
              onSelectedComponentChange={setSelectedComponent}
            />
          </div>

          <div
            className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            <DashboardCanvas
              dashboard={dashboard}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onWidgetAdd={handleWidgetAdd}
              onWidgetDelete={handleWidgetDelete}
              dataTables={dataTables}
              hideViewToggle
            />
          </div>

          <div
            style={{
              width: isChatCollapsed ? '48px' : '320px',
              transition: 'width 0.3s ease',
              flexShrink: 0,
            }}
          >
            <ChatPane
              conversationName="Build with Von"
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isCollapsed={isChatCollapsed}
              onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
              userName="Sarah Chen"
              userEmail="sarah@company.com"
              placeholder="Ask Von about the data..."
            />
          </div>
        </div>
      </div>
    );
  },
};
