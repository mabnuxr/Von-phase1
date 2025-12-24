import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TopBar } from '../../../components/TopBar/TopBar';
import { ChatSidebar } from '../../../components/ChatSidebar/ChatSidebar';
import { Pane1 } from '../../../components/Pane1/Pane1';

// Using a generic component for the meta since we have multiple components
const LayoutComponents = () => <div>Layout Components</div>;

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
 */
export const TopBarDefault: Story = {
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
 * The default ChatSidebar with sample chat items.
 */
const ChatSidebarWrapper = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div style={{ height: '500px', width: isCollapsed ? '64px' : '240px', transition: 'width 0.3s ease' }}>
      <ChatSidebar
        chatItems={[
          { id: '1', label: 'Forecast Q3 Analysis' },
          { id: '2', label: 'Sales Performance Review' },
          { id: '3', label: 'Pipeline Analysis' },
          { id: '4', label: 'Team Sync Notes' },
          { id: '5', label: 'Budget Planning' },
        ]}
        selectedChatId="1"
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onChatClick={(id) => console.log('Chat clicked:', id)}
        userName="John Doe"
        userEmail="john@example.com"
        avatarLabel="JD"
        onAvatarClick={(rect) => console.log('Avatar clicked', rect)}
      />
    </div>
  );
};

export const ChatSidebarDefault: Story = {
  render: () => <ChatSidebarWrapper />,
};

/**
 * Pane1 - Default
 *
 * Dashboard builder side panel with Data/Dashboard toggle.
 * Container is resizable - drag the right edge to resize.
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
        height: '600px',
        width: `${width}px`,
        position: 'relative',
        transition: isResizing ? 'none' : 'width 0.1s ease',
      }}
    >
      <Pane1
        onDragStart={(component) => console.log('Drag started:', component)}
        onDataSourceClick={(id) => console.log('Data source clicked:', id)}
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
  render: () => <Pane1Wrapper />,
};
