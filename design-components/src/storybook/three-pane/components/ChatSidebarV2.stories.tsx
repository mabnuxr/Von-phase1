import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState } from 'react';
import { ChatSidebar } from '../../../components/ChatSidebarV2';
import type { SidebarItem, Folder, FolderItemsMap } from '../../../components/ChatSidebarV2';

// ============================================================================
// Decorator
// ============================================================================

const SidebarDecorator: Decorator = (Story) => (
  <div
    style={{
      height: '100vh',
      width: 'fit-content',
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
// Meta
// ============================================================================

const meta = {
  title: 'Components/ChatSidebarV2',
  component: ChatSidebar,
  decorators: [SidebarDecorator],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'neutral',
      values: [{ name: 'neutral', value: '#f5f5f7' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Sample Data
// ============================================================================

const ITEMS: SidebarItem[] = [
  { id: 'chat-1', label: 'Deal Pipeline by Stage', type: 'chat' },
  { id: 'chat-2', label: 'Win Rate Trends Q3', type: 'chat' },
  { id: 'chat-3', label: 'Revenue Forecast', type: 'chat', status: 'running' },
  { id: 'chat-4', label: 'Top Performers Analysis', type: 'chat' },
  { id: 'chat-5', label: 'Competitive Analysis EMEA', type: 'chat', status: 'complete' },
  { id: 'chat-6', label: 'Territory Planning', type: 'chat' },
  { id: 'chat-7', label: 'Q4 Projections', type: 'chat', folderId: 'folder-1' },
  { id: 'chat-8', label: 'Pipeline Cleanup Notes', type: 'chat', folderId: 'folder-1' },
  { id: 'chat-9', label: 'Board Deck Prep', type: 'chat', folderId: 'folder-2' },
  { id: 'chat-10', label: 'Revenue Bridge Analysis', type: 'chat', folderId: 'folder-2' },
];

const FOLDERS: Folder[] = [
  { id: 'folder-1', label: 'Q4 Analysis', isExpanded: true },
  { id: 'folder-2', label: 'Executive Reports', isExpanded: false, isPinned: true },
];

const FOLDER_ITEMS: FolderItemsMap = {
  'folder-1': ITEMS.filter((i) => i.folderId === 'folder-1'),
  'folder-2': ITEMS.filter((i) => i.folderId === 'folder-2'),
};

// ============================================================================
// Stories
// ============================================================================

/**
 * Default sidebar with conversations, folders, and profile section.
 *
 * Features:
 * - Conversation list with status indicators (running, complete)
 * - Folder organization with expand/collapse
 * - Pinned folders
 * - Context menu (right-click) for rename/delete/move
 * - Collapsible sidebar
 * - Profile section with settings/help/sign-out
 */
const DefaultWrapper = () => {
  const [selectedId, setSelectedId] = useState('chat-1');
  const [collapsed, setCollapsed] = useState(false);
  const [folders, setFolders] = useState(FOLDERS);

  return (
    <div
      className="h-full flex flex-col min-h-0 rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200 transition-all duration-300"
      style={{ width: collapsed ? '50px' : '240px' }}
    >
      <ChatSidebar
        items={ITEMS.filter((i) => !i.folderId)}
        folders={folders}
        folderItems={FOLDER_ITEMS}
        selectedItemId={selectedId}
        isCollapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onItemClick={(id) => setSelectedId(id)}
        onNewChatClick={() => console.log('New chat')}
        onNewChatFolderClick={(name) => console.log('New folder:', name)}
        onRenameItem={(id, name) => console.log('Rename:', id, name)}
        onDeleteItem={(id) => console.log('Delete:', id)}
        onMoveItemToFolder={(itemId, folderId) => console.log('Move:', itemId, '→', folderId)}
        onFolderToggle={(folderId, isExpanded) => {
          setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, isExpanded } : f)));
        }}
        onRenameFolder={(id, name) => console.log('Rename folder:', id, name)}
        onDeleteFolder={(id) => console.log('Delete folder:', id)}
        onPinFolder={(id, isPinned) => console.log('Pin folder:', id, isPinned)}
        userName="Sarah Chen"
        userEmail="sarah@company.com"
        avatarLabel="SC"
        onSettingsClick={() => console.log('Settings')}
        onHelpClick={() => console.log('Help')}
        onSignOutClick={() => console.log('Sign out')}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <DefaultWrapper />,
};

/**
 * Collapsed state — shows only icons with a hover dropdown.
 */
const CollapsedWrapper = () => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      className="h-full flex flex-col min-h-0 rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200 transition-all duration-300"
      style={{ width: collapsed ? '50px' : '240px' }}
    >
      <ChatSidebar
        items={ITEMS.filter((i) => !i.folderId)}
        folders={FOLDERS}
        folderItems={FOLDER_ITEMS}
        isCollapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onItemClick={(id) => console.log('Click:', id)}
        onNewChatClick={() => console.log('New chat')}
        userName="Sarah Chen"
        userEmail="sarah@company.com"
        avatarLabel="SC"
      />
    </div>
  );
};

export const Collapsed: Story = {
  render: () => <CollapsedWrapper />,
};

/**
 * Loading state — shows skeleton placeholders.
 */
export const Loading: Story = {
  render: () => (
    <div
      className="h-full flex flex-col min-h-0 rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200"
      style={{ width: '240px' }}
    >
      <ChatSidebar
        isLoading
        onNewChatClick={() => console.log('New chat')}
        userName="Sarah Chen"
        userEmail="sarah@company.com"
        avatarLabel="SC"
      />
    </div>
  ),
};

/**
 * Empty state — no conversations yet.
 */
export const Empty: Story = {
  render: () => (
    <div
      className="h-full flex flex-col min-h-0 rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200"
      style={{ width: '240px' }}
    >
      <ChatSidebar
        items={[]}
        folders={[]}
        isNewChatActive
        onNewChatClick={() => console.log('New chat')}
        userName="Sarah Chen"
        userEmail="sarah@company.com"
        avatarLabel="SC"
      />
    </div>
  ),
};
