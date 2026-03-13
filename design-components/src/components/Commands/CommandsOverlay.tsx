/**
 * CommandsOverlay
 *
 * Composes the "/" dropdown, the create/edit drawer, and the manage drawer.
 * Purely presentational — all commands data and mutations come from props.
 *
 * The parent (e.g. ChatInputSelector) owns:
 *   showCommandsList  — whether the "/" dropdown is visible
 *   commandSearch     — text typed after "/"
 *   commands          — prefetched list (fetched when chat input mounts)
 *   onSelectCommand   — fires when the user picks a command
 *   onCloseCommandsList
 *   onSaveCommand     — called for both create and update (pass editingId to update)
 *   onDeleteCommand
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Command, ScheduleRecipient } from './types';
import { CommandDrawer } from './CommandDrawer';
import { CommandsList } from './CommandsList';
import { ManageCommandsDrawer } from './ManageCommandsDrawer';
import { AnchoredPopup } from '../AnchoredPopup';
import { useVisibilityToggle } from '../../hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommandsOverlayProps {
  /** Controls the "/" dropdown visibility */
  showCommandsList: boolean;
  /** Text typed after "/" — used to filter the list */
  commandSearch: string;
  /** Prefetched commands from the parent */
  commands: Command[];
  /** Show a loading state while commands are being fetched */
  isLoading?: boolean;
  /** Called when the user picks a command from the list */
  onSelectCommand: (command: Command) => void;
  /** Called to dismiss the "/" dropdown */
  onCloseCommandsList: () => void;
  /**
   * Called on both create and edit.
   * `editingId`  — set when updating an existing command; omit to create.
   * `dataSources` — all attachments (already uploaded eagerly).
   * `commandId`  — the pre-generated ObjectId used during file presigning; pass
   *                as `id` when creating a new command for a single-call create.
   */
  onSaveCommand: (
    data: Pick<Command, 'name' | 'prompt' | 'prefillText' | 'sharingScope' | 'schedule'>,
    editingId?: string,
    dataSources?: import('./types').CommandAttachment[],
    commandId?: string
  ) => void;
  /** Called when a command is deleted from the manage drawer */
  onDeleteCommand: (id: string) => void;
  /** Index of the keyboard-highlighted command in the filtered list */
  highlightedIndex?: number;
  /** Called when the user hovers a command row — lets the parent sync keyboard nav position */
  onHoverIndex?: (index: number) => void;
  /** Screen coordinates of the "/" character — when provided, the list is portalled near the caret */
  slashRect?: { left: number; top: number; bottom: number } | null;
  /** Disables the save button while a mutation is in-flight */
  isSaving?: boolean;
  /** When true, the "Org-wide" sharing option is available in the command drawer */
  isAdmin?: boolean;
  /** Called when the bookmark/favorite icon is toggled on a command */
  onToggleFavorite?: (command: Command) => void;
  /**
   * Fetches a presigned download URL for an already-uploaded command data source file.
   * Used by the file-preview panel inside CommandDrawer.
   */
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;
  /**
   * Called immediately when a file is picked in CommandDrawer.
   * Should presign + upload the file and return the backend fileId and s3Key.
   */
  onUploadFile?: (commandId: string, file: File) => Promise<{ fileId: string; s3Key: string }>;
  /** Team members available as schedule recipients */
  teamMembers?: ScheduleRecipient[];
  /** Current user — auto-added as recipient when schedule is first enabled */
  currentUser?: ScheduleRecipient;
  /** Called when the user clicks "Send test" in the schedule section. Receives current form data. */
  onSendTest?: (
    data: Pick<Command, 'name' | 'prompt'>,
    dataSources: import('./types').CommandAttachment[],
    recipients: ScheduleRecipient[]
  ) => void;

  // ---------------------------------------------------------------------------
  // Legacy props — accepted for backwards compatibility with older consumers
  // that controlled drawer state externally. The current implementation manages
  // all drawer state internally and ignores these.
  // ---------------------------------------------------------------------------
  /** @deprecated Drawer visibility is now managed internally. */
  showCommandDrawer?: boolean;
  /** @deprecated Drawer visibility is now managed internally. */
  showManageDrawer?: boolean;
  /** @deprecated Editing state is now managed internally. */
  editingCommand?: Command | null;
  /** @deprecated Use onCloseCommandsList instead. */
  onNewCommand?: () => void;
  /** @deprecated Use onCloseCommandsList instead. */
  onManageCommands?: () => void;
  /** @deprecated Editing state is now managed internally. */
  onEditCommand?: (command: Command) => void;
  /** @deprecated Drawer visibility is now managed internally. */
  onCloseCommandDrawer?: () => void;
  /** @deprecated Drawer visibility is now managed internally. */
  onCloseManageDrawer?: () => void;
  /** @deprecated No longer used. */
  salesforceFields?: unknown;
  /** @deprecated No longer used. */
  isLoadingSalesforceFields?: boolean;
  /** @deprecated No longer used. */
  commandsListClassName?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_LIST_HEIGHT = 150;
const MAX_LIST_HEIGHT = 300;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CommandsOverlay: React.FC<CommandsOverlayProps> = ({
  showCommandsList,
  commandSearch,
  commands,
  isLoading = false,
  onSelectCommand,
  onCloseCommandsList,
  onSaveCommand,
  onDeleteCommand,
  isSaving = false,
  isAdmin = false,
  onToggleFavorite,
  onRequestFilePreviewUrl,
  onUploadFile,
  teamMembers,
  currentUser,
  onSendTest,
  highlightedIndex = -1,
  onHoverIndex,
  slashRect,
}) => {
  const formDrawer = useVisibilityToggle();
  const manageDrawer = useVisibilityToggle();
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [openedFromManage, setOpenedFromManage] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Close commands list on click outside
  useEffect(() => {
    if (!showCommandsList) return;
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onCloseCommandsList();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCommandsList, onCloseCommandsList]);

  const openCreateDrawer = useCallback(() => {
    setEditingCommand(null);
    setOpenedFromManage(false);
    manageDrawer.hide();
    formDrawer.show();
    onCloseCommandsList();
  }, [formDrawer, manageDrawer, onCloseCommandsList]);

  const openEditDrawer = useCallback(
    (command: Command, fromManage = false) => {
      setEditingCommand(command);
      setIsReadOnly(command.createdBy !== 'me');
      setOpenedFromManage(fromManage);
      manageDrawer.hide();
      formDrawer.show();
    },
    [formDrawer, manageDrawer]
  );

  const handleBackToManage = useCallback(() => {
    formDrawer.hide();
    setEditingCommand(null);
    setIsReadOnly(false);
    setOpenedFromManage(false);
    manageDrawer.show();
  }, [formDrawer, manageDrawer]);

  const openManageDrawer = useCallback(() => {
    manageDrawer.show();
    onCloseCommandsList();
  }, [manageDrawer, onCloseCommandsList]);

  const handleSave = useCallback(
    (
      data: Pick<Command, 'name' | 'prompt' | 'prefillText' | 'sharingScope' | 'schedule'>,
      dataSources: import('./types').CommandAttachment[],
      commandId: string
    ) => {
      onSaveCommand(data, editingCommand?.id, dataSources, commandId);
      formDrawer.hide();
      setEditingCommand(null);
    },
    [editingCommand, formDrawer, onSaveCommand]
  );

  const filteredCommands = commandSearch
    ? commands.filter((c) => c.name.toLowerCase().includes(commandSearch.toLowerCase().trim()))
    : commands;

  return (
    <>
      {/* "/" dropdown */}
      <AnchoredPopup
        isOpen={showCommandsList}
        minHeight={MIN_LIST_HEIGHT}
        maxHeight={MAX_LIST_HEIGHT}
        className="z-50"
        anchorRect={slashRect}
      >
        {({ maxHeight }) => (
          <div ref={listRef}>
            <CommandsList
              commands={filteredCommands}
              isLoading={isLoading}
              onSelectCommand={onSelectCommand}
              onNewCommand={openCreateDrawer}
              onManageCommands={openManageDrawer}
              onExpandCommand={openEditDrawer}
              onToggleFavorite={onToggleFavorite}
              maxHeight={maxHeight}
              highlightedIndex={highlightedIndex}
              onHoverIndex={onHoverIndex}
            />
          </div>
        )}
      </AnchoredPopup>

      {/* Create / Edit drawer */}
      <CommandDrawer
        isOpen={formDrawer.isVisible}
        onClose={() => {
          formDrawer.hide();
          setEditingCommand(null);
          setIsReadOnly(false);
          setOpenedFromManage(false);
        }}
        onSave={handleSave}
        editingCommand={editingCommand}
        isSaving={isSaving}
        readOnly={isReadOnly}
        isAdmin={isAdmin}
        onRequestFilePreviewUrl={onRequestFilePreviewUrl}
        onUploadFile={onUploadFile}
        onBack={openedFromManage ? handleBackToManage : undefined}
        teamMembers={teamMembers}
        currentUser={currentUser}
        onSendTest={onSendTest}
      />

      {/* Manage drawer */}
      <ManageCommandsDrawer
        isOpen={manageDrawer.isVisible}
        onClose={manageDrawer.hide}
        commands={commands}
        isLoading={isLoading}
        onNewCommand={openCreateDrawer}
        onEditCommand={(command) => openEditDrawer(command, true)}
        onDeleteCommand={onDeleteCommand}
        onToggleFavorite={onToggleFavorite}
      />
    </>
  );
};

export default CommandsOverlay;
