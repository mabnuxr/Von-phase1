import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatSidebar } from '../../../components/ChatSidebar';
import type { SidebarItem, Folder } from '../../../components/ChatSidebar';

// ============================================================================
// Types
// ============================================================================

export interface PrototypeFrameProps {
  /** Main content area (center pane) */
  children: React.ReactNode;
  /** Optional right panel (artifact viewer, chat pane, etc.) */
  rightPanel?: React.ReactNode;
  /** Width of the right panel in pixels (default: 400) */
  rightPanelWidth?: number;
  /** Whether the right panel is resizable (default: false) */
  rightPanelResizable?: boolean;
  /** Sidebar items to display */
  sidebarItems?: SidebarItem[];
  /** Sidebar folders */
  sidebarFolders?: Folder[];
  /** Currently selected sidebar item ID */
  selectedItemId?: string;
  /** Callback when a sidebar item is clicked */
  onItemClick?: (id: string) => void;
  /** Callback when "New Chat" is clicked */
  onNewChatClick?: () => void;
  /** Whether to start with sidebar collapsed (default: false) */
  initialSidebarCollapsed?: boolean;
  /** Hide the sidebar entirely (default: false) */
  hideSidebar?: boolean;
}

// ============================================================================
// Default sidebar data
// ============================================================================

const DEFAULT_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'chat-1', label: 'Deal Pipeline Analysis', type: 'chat' },
  { id: 'chat-2', label: 'Revenue Forecast Q4', type: 'chat' },
  { id: 'chat-3', label: 'Win Rate Trends', type: 'chat' },
  { id: 'chat-4', label: 'Top Performers Review', type: 'chat' },
  { id: 'chat-5', label: 'Territory Planning', type: 'chat', folderId: 'folder-1' },
  { id: 'chat-6', label: 'Q4 Projections', type: 'chat', folderId: 'folder-1' },
];

const DEFAULT_FOLDERS: Folder[] = [{ id: 'folder-1', label: 'Q4 Analysis', isExpanded: true }];

// ============================================================================
// Component
// ============================================================================

export function PrototypeFrame({
  children,
  rightPanel,
  rightPanelWidth = 400,
  rightPanelResizable = false,
  sidebarItems = DEFAULT_SIDEBAR_ITEMS,
  sidebarFolders = DEFAULT_FOLDERS,
  selectedItemId: controlledSelectedId,
  onItemClick,
  onNewChatClick,
  initialSidebarCollapsed = false,
  hideSidebar = false,
}: PrototypeFrameProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialSidebarCollapsed);
  const [internalSelectedId, setInternalSelectedId] = useState(sidebarItems[0]?.id ?? '');
  const [folders, setFolders] = useState(sidebarFolders);
  const [rpWidth, setRpWidth] = useState(rightPanelWidth);
  const isResizing = useRef(false);

  useEffect(() => {
    if (controlledSelectedId == null) {
      setInternalSelectedId(sidebarItems[0]?.id ?? '');
    }
  }, [controlledSelectedId, sidebarItems]);

  const selectedId = controlledSelectedId ?? internalSelectedId;

  const handleItemClick = useCallback(
    (id: string) => {
      if (onItemClick) {
        onItemClick(id);
      } else {
        setInternalSelectedId(id);
      }
    },
    [onItemClick]
  );

  const handleFolderToggle = useCallback((folderId: string, isExpanded: boolean) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, isExpanded } : f)));
  }, []);

  // Right panel resize handler
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!rightPanelResizable) return;
      e.preventDefault();
      isResizing.current = true;

      const startX = e.clientX;
      const startWidth = rpWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        // Dragging left increases width, dragging right decreases
        const newWidth = startWidth - (moveEvent.clientX - startX);
        setRpWidth(Math.max(280, Math.min(600, newWidth)));
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [rightPanelResizable, rpWidth]
  );

  return (
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
      {/* Sidebar */}
      {!hideSidebar && (
        <div
          className="h-full flex flex-col min-h-0 rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200 transition-all duration-300"
          style={{
            width: isCollapsed ? '50px' : '240px',
            minWidth: isCollapsed ? '50px' : '240px',
          }}
        >
          <ChatSidebar
            items={sidebarItems}
            folders={folders}
            selectedItemId={selectedId}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            onItemClick={handleItemClick}
            onNewChatClick={onNewChatClick ?? (() => console.log('New chat'))}
            onRenameItem={(id, newName) => console.log('Rename:', id, newName)}
            onDeleteItem={(id) => console.log('Delete:', id)}
            onFolderToggle={handleFolderToggle}
            userName="John Doe"
            userEmail="john@example.com"
            avatarLabel="JD"
          />
        </div>
      )}

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          height: '100%',
          minWidth: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>

      {/* Right panel */}
      {rightPanel && (
        <div
          style={{
            height: '100%',
            width: `${rpWidth}px`,
            minWidth: `${rpWidth}px`,
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Resize handle (left edge of right panel) */}
          {rightPanelResizable && (
            <div
              onMouseDown={handleResizeMouseDown}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6px',
                height: '100%',
                cursor: 'ew-resize',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                if (!isResizing.current) e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                if (!isResizing.current) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
          )}
          {rightPanel}
        </div>
      )}
    </div>
  );
}
