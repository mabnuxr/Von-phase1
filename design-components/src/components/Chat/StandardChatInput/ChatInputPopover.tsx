import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PencilSimple, Plus, Trash, ListChecks } from '@phosphor-icons/react';
import { PrimaryButton, SecondaryIconButton } from '../../forms/buttons';
import { ChatMarkdown } from '../ChatMarkdown';
import { TiptapEditor } from '../../TiptapEditor';
import type { Editor } from '@tiptap/react';
import type { PopoverIntent } from './types';

/**
 * Base props for ChatInputPopover
 */
export interface ChatInputPopoverProps {
  /**
   * Whether the popover is visible
   */
  isOpen: boolean;
  /**
   * Callback when popover should close
   */
  onClose: () => void;
  /**
   * The intent/type of the popover
   */
  intent: PopoverIntent;
  /**
   * Title shown in the popover header
   */
  title: string;
  /**
   * Markdown content to display
   */
  content: string;
  /**
   * Whether the content is streaming
   * @default false
   */
  isStreaming?: boolean;
  /**
   * Primary action button label
   */
  primaryActionLabel: string;
  /**
   * Callback when primary action is clicked
   */
  onPrimaryAction: () => void;
  /**
   * Placeholder for the feedback input
   */
  feedbackPlaceholder?: string;
  /**
   * Callback when feedback is submitted
   */
  onFeedbackSubmit?: (feedback: string) => void;
  /**
   * Whether to show the feedback input
   * @default true
   */
  showFeedbackInput?: boolean;
  /**
   * Whether the user has made edits (shows a hint message)
   * @default false
   */
  hasUserEdits?: boolean;
  /**
   * Whether primary action is disabled
   * @default false
   */
  primaryActionDisabled?: boolean;
}

/**
 * Get icon for popover intent
 */
function getIntentIcon(intent: PopoverIntent) {
  switch (intent) {
    case 'plan':
      return <ListChecks size={16} weight="regular" className="text-gray-700" />;
    case 'edit':
      return <PencilSimple size={16} weight="regular" className="text-gray-700" />;
    case 'add-widget':
      return <Plus size={16} weight="regular" className="text-gray-700" />;
    case 'delete-widget':
      return <Trash size={16} weight="regular" className="text-gray-700" />;
    default:
      return <ListChecks size={16} weight="regular" className="text-gray-700" />;
  }
}

/**
 * ChatInputPopover - A popover that appears above the chat input
 *
 * Features:
 * - Displays markdown content (plan, edit request, etc.)
 * - Header with title and action buttons
 * - Optional feedback input at the bottom
 * - Animates in/out smoothly
 * - Covers the chat input area when open
 */
export const ChatInputPopover: React.FC<ChatInputPopoverProps> = ({
  isOpen,
  onClose,
  intent,
  title,
  content,
  isStreaming = false,
  primaryActionLabel,
  onPrimaryAction,
  feedbackPlaceholder = 'Tell Von what to do differently...',
  onFeedbackSubmit,
  showFeedbackInput = true,
  hasUserEdits = false,
  primaryActionDisabled = false,
}) => {
  const [feedback, setFeedback] = useState('');
  const editorRef = useRef<Editor | null>(null);

  const handleFeedbackSubmit = () => {
    if (feedback.trim() && onFeedbackSubmit) {
      onFeedbackSubmit(feedback.trim());
      setFeedback('');
      if (editorRef.current) {
        editorRef.current.commands.clearContent();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute bottom-0 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {getIntentIcon(intent)}
              <span className="text-[13px] font-medium text-gray-900">{title}</span>
            </div>
            <div className="flex items-center gap-2">
              <PrimaryButton
                onClick={onPrimaryAction}
                disabled={primaryActionDisabled}
                className="text-[13px] px-3 py-1.5"
              >
                {primaryActionLabel}
              </PrimaryButton>
              <SecondaryIconButton
                icon={<X size={14} weight="bold" className="text-gray-700" />}
                onClick={onClose}
                title="Discard"
                className="w-8 h-8 rounded-xl"
              />
            </div>
          </div>

          {/* Content area */}
          <div className="px-4 py-4 max-h-[300px] overflow-y-auto">
            <ChatMarkdown content={content} isStreaming={isStreaming} className="text-[13px]" />
          </div>

          {/* User edits hint */}
          {hasUserEdits && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
              <p className="text-[13px] text-amber-700">
                You have made edits. Von will consider your changes while implementing.
              </p>
            </div>
          )}

          {/* Feedback input */}
          {showFeedbackInput && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-start gap-2">
                <div className="flex-1 bg-white border border-gray-100 rounded-xl px-3 py-2">
                  <TiptapEditor
                    content={feedback}
                    onChange={setFeedback}
                    onSubmit={handleFeedbackSubmit}
                    placeholder={feedbackPlaceholder}
                    editorRef={editorRef}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// Convenience wrapper components for specific intents
// ============================================================================

export interface PlanPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  /** Summarized user query for the title */
  queryTitle: string;
  /** The plan content in markdown */
  planContent: string;
  /** Whether the plan is streaming */
  isStreaming?: boolean;
  /** Called when user approves the plan */
  onApprove: () => void;
  /** Called when user submits feedback */
  onFeedback?: (feedback: string) => void;
  /** Whether user has made edits */
  hasUserEdits?: boolean;
}

/**
 * PlanPopover - Shows the LLM's plan for implementing user queries
 */
export const PlanPopover: React.FC<PlanPopoverProps> = ({
  isOpen,
  onClose,
  queryTitle,
  planContent,
  isStreaming = false,
  onApprove,
  onFeedback,
  hasUserEdits = false,
}) => {
  return (
    <ChatInputPopover
      isOpen={isOpen}
      onClose={onClose}
      intent="plan"
      title={`Plan for "${queryTitle}"`}
      content={planContent}
      isStreaming={isStreaming}
      primaryActionLabel="Approve Plan"
      onPrimaryAction={onApprove}
      feedbackPlaceholder="Tell Von what to do differently..."
      onFeedbackSubmit={onFeedback}
      showFeedbackInput={true}
      hasUserEdits={hasUserEdits}
    />
  );
};

export interface EditRequestPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  /** Description of what edits are being requested */
  editDescription: string;
  /** The edit request content in markdown */
  content: string;
  /** Whether the content is streaming */
  isStreaming?: boolean;
  /** Called when user confirms the edits */
  onConfirm: () => void;
  /** Called when user submits feedback */
  onFeedback?: (feedback: string) => void;
}

/**
 * EditRequestPopover - Asks user for making edits to the report or dashboard
 */
export const EditRequestPopover: React.FC<EditRequestPopoverProps> = ({
  isOpen,
  onClose,
  editDescription,
  content,
  isStreaming = false,
  onConfirm,
  onFeedback,
}) => {
  return (
    <ChatInputPopover
      isOpen={isOpen}
      onClose={onClose}
      intent="edit"
      title={`Edit: ${editDescription}`}
      content={content}
      isStreaming={isStreaming}
      primaryActionLabel="Confirm Edits"
      onPrimaryAction={onConfirm}
      feedbackPlaceholder="Suggest different edits..."
      onFeedbackSubmit={onFeedback}
      showFeedbackInput={true}
    />
  );
};

export interface AddWidgetPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  /** Description of the widget being added */
  widgetDescription: string;
  /** The add widget content in markdown */
  content: string;
  /** Whether the content is streaming */
  isStreaming?: boolean;
  /** Called when user confirms adding the widget */
  onConfirm: () => void;
  /** Called when user submits feedback */
  onFeedback?: (feedback: string) => void;
}

/**
 * AddWidgetPopover - Asks user for adding a widget to the report or dashboard
 */
export const AddWidgetPopover: React.FC<AddWidgetPopoverProps> = ({
  isOpen,
  onClose,
  widgetDescription,
  content,
  isStreaming = false,
  onConfirm,
  onFeedback,
}) => {
  return (
    <ChatInputPopover
      isOpen={isOpen}
      onClose={onClose}
      intent="add-widget"
      title={`Add Widget: ${widgetDescription}`}
      content={content}
      isStreaming={isStreaming}
      primaryActionLabel="Add Widget"
      onPrimaryAction={onConfirm}
      feedbackPlaceholder="Suggest changes to this widget..."
      onFeedbackSubmit={onFeedback}
      showFeedbackInput={true}
    />
  );
};

export interface DeleteWidgetPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  /** Name of the widget being deleted */
  widgetName: string;
  /** The delete widget content in markdown */
  content: string;
  /** Whether the content is streaming */
  isStreaming?: boolean;
  /** Called when user confirms deletion */
  onConfirm: () => void;
  /** Called when user submits feedback */
  onFeedback?: (feedback: string) => void;
}

/**
 * DeleteWidgetPopover - Asks user for deleting a widget from the report or dashboard
 */
export const DeleteWidgetPopover: React.FC<DeleteWidgetPopoverProps> = ({
  isOpen,
  onClose,
  widgetName,
  content,
  isStreaming = false,
  onConfirm,
  onFeedback,
}) => {
  return (
    <ChatInputPopover
      isOpen={isOpen}
      onClose={onClose}
      intent="delete-widget"
      title={`Delete Widget: ${widgetName}`}
      content={content}
      isStreaming={isStreaming}
      primaryActionLabel="Delete Widget"
      onPrimaryAction={onConfirm}
      feedbackPlaceholder="Any concerns about deleting this?"
      onFeedbackSubmit={onFeedback}
      showFeedbackInput={true}
    />
  );
};

export default ChatInputPopover;
