import type { ReactNode } from 'react';
import type { FileAttachment } from '../FileAttachment/types';
import type { BuildMode } from '../../DashboardBuilder/types';

/**
 * Reference context for the chat input
 * Shows which dashboard/report the user is referencing
 */
export interface ReferenceContext {
  /** Type of reference */
  type: 'dashboard' | 'report' | 'document' | 'widget' | 'kpi' | 'table' | 'source';
  /** Display name of the reference */
  name: string;
  /** Unique identifier */
  id: string;
}

/**
 * Auto edit modes for the chat input
 */
export type AutoEditMode = 'off' | 'on' | 'plan';

/**
 * Popover intent types for different chat input states
 */
export type PopoverIntent = 'plan' | 'edit' | 'add-widget' | 'delete-widget';

/**
 * Active popover state for the chat input
 */
export interface ActivePopover {
  /** The type of popover */
  intent: PopoverIntent;
  /** Title for the popover header */
  title: string;
  /** Markdown content to display */
  content: string;
  /** Whether the content is streaming */
  isStreaming?: boolean;
  /** Primary action label */
  primaryActionLabel: string;
  /** Whether user has made edits */
  hasUserEdits?: boolean;
}

/**
 * Conversation mode — determines which agent/workflow handles a conversation.
 * Shared between frontend and backend.
 */
export const ConversationMode = {
  Auto: 'auto',
  DashboardBuilder: 'dashboard-builder',
} as const;

export type ConversationMode = (typeof ConversationMode)[keyof typeof ConversationMode];

/**
 * Ref handle for StandardChatInput, exposing imperative methods
 */
export interface StandardChatInputRef {
  /** Focus the input editor */
  focus: () => void;
}

export interface StandardChatInputProps {
  /**
   * Placeholder text for the input
   * @default 'Type a message...'
   */
  placeholder?: string;

  /**
   * Callback when send/enter is pressed
   * Includes the selected agent mode for the message
   */
  onSend?: (message: string, attachments?: FileAttachment[], agentMode?: ConversationMode) => void;

  /**
   * Callback when stop button is clicked during streaming
   */
  onStop?: () => void;

  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether a message is actively streaming
   * @default false
   */
  isStreaming?: boolean;

  /**
   * Whether to disable message submission
   * @default false
   */
  disableSubmit?: boolean;

  /**
   * Callback when user attempts to submit while disabled
   */
  onDisabledInput?: () => void;

  /**
   * Controlled value for the input
   */
  value?: string;

  /**
   * Callback when input value changes
   */
  onChange?: (value: string) => void;

  /**
   * Callback when voice input button is clicked
   */
  onVoiceInput?: () => void;

  /**
   * Whether voice input is currently recording
   * @default false
   */
  isRecording?: boolean;

  /**
   * Current mode (ask or build)
   * @default 'ask'
   */
  mode?: BuildMode;

  /**
   * Callback when mode changes
   */
  onModeChange?: (mode: BuildMode) => void;

  /**
   * File attachments to display
   */
  attachments?: FileAttachment[];

  /**
   * Callback when a file is removed
   */
  onRemoveAttachment?: (id: string) => void;

  /**
   * Files dropped via drag-and-drop
   */
  droppedFiles?: File[];

  /**
   * Callback when dropped files have been processed
   */
  onDroppedFilesProcessed?: () => void;

  /**
   * Callback when a file validation error occurs
   */
  onFileError?: (error: string, message: string) => void;

  /**
   * Reference context shown above the input
   * Shows which dashboard/report the user is referencing
   */
  referenceContext?: ReferenceContext;

  /**
   * Callback when the reference is removed
   */
  onRemoveReference?: () => void;

  /**
   * Show formatting toolbar for rich text editing
   * @default true
   */
  showFormattingToolbar?: boolean;

  // ============================================================================
  // Auto Edit Mode Props
  // ============================================================================

  /**
   * Whether to show the mode selector button
   * @default false
   */
  showModeSelector?: boolean;

  /**
   * Current auto edit mode
   * @default 'off'
   */
  autoEditMode?: AutoEditMode;

  /**
   * Callback when auto edit mode changes
   */
  onAutoEditModeChange?: (mode: AutoEditMode) => void;

  // ============================================================================
  // Popover Props
  // ============================================================================

  /**
   * Active popover configuration (if any)
   * When set, the popover will be displayed above the input
   */
  activePopover?: ActivePopover;

  /**
   * Callback when popover is closed/dismissed
   */
  onPopoverClose?: () => void;

  /**
   * Callback when popover primary action is clicked
   */
  onPopoverPrimaryAction?: () => void;

  /**
   * Callback when user submits feedback in the popover
   */
  onPopoverFeedback?: (feedback: string) => void;

  // ============================================================================
  // Agent Props
  // ============================================================================

  /**
   * Callback when Build Dashboard agent is selected from the menu
   */
  onBuildDashboard?: () => void;

  /**
   * Hide the disclaimer text below the input
   * @default false
   */
  hideDisclaimer?: boolean;

  /**
   * Whether to show the plus menu button (with agents and upload options)
   * @default false
   */
  showPlusMenu?: boolean;

  /**
   * Callback when files are selected via plus menu or drag-drop in controlled mode.
   * Only fires when `attachments` prop is provided (controlled mode).
   * Parent is responsible for validation and state management.
   */
  onFilesSelected?: (files: File[]) => void;

  // ============================================================================
  // Agent Selection Props (for locking after first message)
  // ============================================================================

  /**
   * Whether agent selection is locked (e.g., after first message in conversation)
   * When true, the agent selector will be disabled and show lockedConversationMode
   * @default false
   */
  isAgentLocked?: boolean;

  /**
   * The agent mode to display when locked (from backend/conversation data)
   * Only used when isAgentLocked is true
   * @default 'auto'
   */
  lockedConversationMode?: ConversationMode;

  // ============================================================================
  // File Error Props
  // ============================================================================

  /**
   * File validation error message to display above the input
   */
  fileErrorMessage?: string | null;

  /**
   * Callback to dismiss the file error toast
   */
  onDismissFileError?: () => void;

  /**
   * Command chip to render inside the input bubble (above the textarea)
   * When provided, sending is allowed even with an empty message
   */
  contextBar?: ReactNode;

  /**
   * When true, shows a "/" button in the toolbar that opens the commands overlay
   * @default false
   */
  enableCommands?: boolean;

  /** Called when the user presses Escape to dismiss the commands overlay */
  onCloseCommandsList?: () => void;
}
