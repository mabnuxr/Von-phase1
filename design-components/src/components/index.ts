// Main barrel export file for all components
//
// Components follow Atomic Design methodology:
// - ATOMS: Basic building blocks with no component dependencies (only theme tokens)
// - MOLECULES: Simple combinations of 2-3 atoms
// - ORGANISMS: Complex components with state management and business logic

// ============================================================================
// ERROR BOUNDARY
// ============================================================================
export { ErrorBoundary } from './ErrorBoundary';

// ============================================================================
// ATOMS
// Basic building blocks with NO dependencies on other components.
// These components only depend on theme tokens and can be used anywhere.
// ============================================================================

// Display Atoms
// -------------
export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

export { Menu } from './Menu';
export type { MenuProps, MenuItem } from './Menu';

export { Banner } from './Banner';
export type { BannerProps, BannerVariant, BannerAction } from './Banner';

// Forms Atoms
// -----------
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

// Layout Atoms
// ------------
export { Box } from './Box';
export type { BoxProps } from './Box';

export { Stack } from './Stack';
export type { StackProps } from './Stack';

export { Container } from './Container';
export type { ContainerProps } from './Container';

export { TabPill } from './TabPill';
export type { TabPillProps } from './TabPill';

// Typography Atoms
// ----------------
export { Text } from './Text';
export type { TextProps } from './Text';

export { Heading } from './Heading';
export type { HeadingProps } from './Heading';

// Chat Atoms
// ----------
export { ChatHeader } from './Chat';
export type { ChatHeaderProps } from './Chat';

export { ChatMessage } from './Chat';
export type { ChatMessageProps } from './Chat';

export { ChatInput } from './Chat';
export type { ChatInputProps } from './Chat';

export { ChatEmptyState } from './Chat/ChatEmptyState';
export type { ChatEmptyStateProps } from './Chat/ChatEmptyState';

export { ChatTypingIndicator } from './Chat/ChatTypingIndicator';

export { ChatMessageSkeleton } from './Chat/ChatMessageSkeleton';
export type { ChatMessageSkeletonProps } from './Chat/ChatMessageSkeleton';

// ============================================================================
// MOLECULES
// Simple compositions combining 2-3 atoms into reusable UI patterns.
// ============================================================================

// Dropdown Molecule (uses: Menu atom)
export { Dropdown } from './Dropdown';
export type { DropdownProps, DropdownItem } from './Dropdown';

// Chat Molecules
export { ChatBubble } from './ChatBubble';
export type { ChatBubbleProps } from './ChatBubble';

export { DocumentCard } from './DocumentCard';
export type { DocumentCardProps } from './DocumentCard';

export { TabSwitcher } from './TabSwitcher';
export type { TabSwitcherProps, TabSwitcherTab } from './TabSwitcher';

export { IntegrationCard } from './IntegrationCard';
export type { IntegrationCardProps } from './IntegrationCard';

export { ConfirmationModal } from './ConfirmationModal';
export type { ConfirmationModalProps } from './ConfirmationModal';

// ============================================================================
// ORGANISMS
// Complex components with state management, hooks, and business logic.
// These coordinate multiple atoms/molecules to create complete features.
// ============================================================================

// Header Organism (simple page header with logo)
export { Header } from './Header';
export type { HeaderProps } from './Header';

// Chat Organism (uses: ChatHeader + ChatMessage + ChatInput, manages chat state & API)
export { Chat } from './Chat';
export type { ChatProps, Message, FixedPosition } from './Chat';

// TopBar Organism (uses: TabPill + Avatar, manages tab state)
export { TopBar } from './TopBar';
export type { TopBarProps, Tab } from './TopBar';

// ChatSidebar Organism (uses: Search + List, manages chat history)
export { ChatSidebar } from './ChatSidebar';
export type { ChatSidebarProps, ChatItem } from './ChatSidebar';

// ChatConversation Organism (uses: ChatBubble + TabSwitcher + DocumentCard + ChatInput)
export { ChatConversation } from './ChatConversation';
export type { ChatConversationProps, ConversationMessage } from './ChatConversation';
