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

export interface StandardChatInputProps {
  /**
   * Placeholder text for the input
   * @default 'Type a message...'
   */
  placeholder?: string;

  /**
   * Callback when send/enter is pressed
   */
  onSend?: (message: string, attachments?: FileAttachment[]) => void;

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
}
