import React from 'react';

// ── Sub-component props ─────────────────────────────────────────

interface HeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface HeaderRowProps {
  children: React.ReactNode;
  className?: string;
  /** Add a bottom border (default: true) */
  bordered?: boolean;
}

interface HeaderRowSlotProps {
  children?: React.ReactNode;
  className?: string;
}

interface CanvasProps {
  children: React.ReactNode;
  className?: string;
}

interface AgentChatProps {
  children: React.ReactNode;
  className?: string;
  /** Fixed width in px (default: 420) */
  width?: number;
}

// ── Sub-components ──────────────────────────────────────────────

const Header: React.FC<HeaderProps> = ({ children, className = '' }) => (
  <div className={`shrink-0 ${className}`}>{children}</div>
);
Header.displayName = 'DashboardLayout.Header';

const HeaderRowLeft: React.FC<HeaderRowSlotProps> = ({ children, className = '' }) => (
  <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>{children}</div>
);
HeaderRowLeft.displayName = 'DashboardLayout.HeaderRow.Left';

const HeaderRowRight: React.FC<HeaderRowSlotProps> = ({ children, className = '' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>{children}</div>
);
HeaderRowRight.displayName = 'DashboardLayout.HeaderRow.Right';

const HeaderRowBase: React.FC<HeaderRowProps> = ({ children, className = '', bordered = true }) => (
  <div
    className={`flex items-center justify-between px-4 py-2 ${
      bordered ? 'border-b border-gray-100' : ''
    } ${className}`}
  >
    {children}
  </div>
);
HeaderRowBase.displayName = 'DashboardLayout.HeaderRow';

const HeaderRow = Object.assign(HeaderRowBase, {
  Left: HeaderRowLeft,
  Right: HeaderRowRight,
});

const Canvas: React.FC<CanvasProps> = ({ children, className = '' }) => (
  <div className={`flex-1 overflow-y-auto p-4 ${className}`}>{children}</div>
);
Canvas.displayName = 'DashboardLayout.Canvas';

const AgentChat: React.FC<AgentChatProps> = ({ children, className = '', width = 420 }) => (
  <div className={`shrink-0 h-full ${className}`} style={{ width }}>
    {children}
  </div>
);
AgentChat.displayName = 'DashboardLayout.AgentChat';

// ── Root component ──────────────────────────────────────────────

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Compound layout component for the dashboard page.
 *
 * Usage:
 * ```tsx
 * <DashboardLayout>
 *   <DashboardLayout.Header>
 *     <DashboardLayout.HeaderRow>...title & actions...</DashboardLayout.HeaderRow>
 *     <DashboardLayout.HeaderRow>...filters & customize...</DashboardLayout.HeaderRow>
 *   </DashboardLayout.Header>
 *   <DashboardLayout.Canvas>
 *     <DashboardGrid ... />
 *   </DashboardLayout.Canvas>
 *   <DashboardLayout.AgentChat>
 *     <ChatComponent ... />
 *   </DashboardLayout.AgentChat>
 * </DashboardLayout>
 * ```
 */
const DashboardLayoutRoot: React.FC<DashboardLayoutProps> = ({ children, className = '' }) => {
  // Separate AgentChat from the rest
  const childArray = React.Children.toArray(children);
  const chatChild = childArray.find(
    (child) => React.isValidElement(child) && child.type === AgentChat
  );
  const dashboardChildren = childArray.filter(
    (child) => !(React.isValidElement(child) && child.type === AgentChat)
  );

  return (
    <div className={`flex h-full w-full gap-2 ${className}`}>
      {/* Dashboard panel (header + canvas) */}
      <div className="flex-1 min-w-0 h-full bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
        {dashboardChildren}
      </div>

      {/* Agent chat panel (optional) */}
      {chatChild}
    </div>
  );
};
DashboardLayoutRoot.displayName = 'DashboardLayout';

// ── Compose the compound component ─────────────────────────────

export const DashboardLayout = Object.assign(DashboardLayoutRoot, {
  Header,
  HeaderRow,
  Canvas,
  AgentChat,
});
