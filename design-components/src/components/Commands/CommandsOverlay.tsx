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

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Command } from './types';
import { CommandDrawer } from './CommandDrawer';
import { CommandsList } from './CommandsList';
import { ManageCommandsDrawer } from './ManageCommandsDrawer';

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
    data: Pick<Command, 'name' | 'prompt' | 'prefillText' | 'sharingScope'>,
    editingId?: string,
    dataSources?: import('./types').CommandAttachment[],
    commandId?: string
  ) => void;
  /** Called when a command is deleted from the manage drawer */
  onDeleteCommand: (id: string) => void;
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
  onRequestFilePreviewUrl?: (commandId: string, fileId: string) => Promise<string>;
  /**
   * Called immediately when a file is picked in CommandDrawer.
   * Should presign + upload the file and return the backend fileId and s3Key.
   */
  onUploadFile?: (commandId: string, file: File, attachment: import('./types').CommandAttachment) => Promise<{ fileId: string; s3Key: string }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MARGIN_PX = 8;
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
}) => {
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [showManageDrawer, setShowManageDrawer] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Sentinel fills the ChatInputSelector's relative container — used to measure
  // available space above and below the input before the dropdown appears.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState<'above' | 'below'>('above');
  const [listMaxHeight, setListMaxHeight] = useState(MAX_LIST_HEIGHT);

  useEffect(() => {
    if (!showCommandsList || !sentinelRef.current) return;

    const rect = sentinelRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceAbove >= MIN_LIST_HEIGHT + MARGIN_PX && spaceAbove >= spaceBelow) {
      setPopupPosition('above');
      setListMaxHeight(Math.min(spaceAbove - MARGIN_PX, MAX_LIST_HEIGHT));
    } else if (spaceBelow >= MIN_LIST_HEIGHT + MARGIN_PX) {
      setPopupPosition('below');
      setListMaxHeight(Math.min(spaceBelow - MARGIN_PX, MAX_LIST_HEIGHT));
    } else {
      // Fall back to whichever side has more room
      if (spaceAbove >= spaceBelow) {
        setPopupPosition('above');
        setListMaxHeight(Math.max(MIN_LIST_HEIGHT, spaceAbove - MARGIN_PX));
      } else {
        setPopupPosition('below');
        setListMaxHeight(Math.max(MIN_LIST_HEIGHT, spaceBelow - MARGIN_PX));
      }
    }
  }, [showCommandsList]);

  const openCreateDrawer = useCallback(() => {
    setEditingCommand(null);
    setShowManageDrawer(false);
    setShowFormDrawer(true);
    onCloseCommandsList();
  }, [onCloseCommandsList]);

  const openEditDrawer = useCallback((command: Command) => {
    setEditingCommand(command);
    setIsReadOnly(command.createdBy !== 'me');
    setShowManageDrawer(false);
    setShowFormDrawer(true);
  }, []);

  const openManageDrawer = useCallback(() => {
    setShowManageDrawer(true);
    onCloseCommandsList();
  }, [onCloseCommandsList]);

  const handleSave = useCallback(
    (
      data: Pick<Command, 'name' | 'prompt' | 'prefillText' | 'sharingScope'>,
      dataSources: import('./types').CommandAttachment[],
      commandId: string
    ) => {
      onSaveCommand(data, editingCommand?.id, dataSources, commandId);
      setShowFormDrawer(false);
      setEditingCommand(null);
    },
    [editingCommand, onSaveCommand]
  );

  const handleRequestFilePreviewUrl = useCallback(
    async (fileId: string): Promise<string> => {
      if (!editingCommand?.id || !onRequestFilePreviewUrl) return '';
      return onRequestFilePreviewUrl(editingCommand.id, fileId);
    },
    [editingCommand, onRequestFilePreviewUrl]
  );

  const filteredCommands = commandSearch
    ? commands.filter((c) => c.name.toLowerCase().includes(commandSearch.toLowerCase().trim()))
    : commands;

  const isAbove = popupPosition === 'above';
  const positionClass = isAbove
    ? 'absolute bottom-full left-0 right-0 max-w-4xl mx-auto w-full mb-1 z-50'
    : 'absolute top-full left-0 right-0 max-w-4xl mx-auto w-full mt-1 z-50';
  const motionY = isAbove ? 8 : -8;

  return (
    <>
      {/* Sentinel — always rendered, fills the relative container, used only for measurement */}
      <div ref={sentinelRef} className="absolute inset-0 pointer-events-none" />

      {/* "/" dropdown */}
      <AnimatePresence>
        {showCommandsList && (
          <motion.div
            className={positionClass}
            initial={{ opacity: 0, y: motionY }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: motionY }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <CommandsList
              commands={filteredCommands}
              isLoading={isLoading}
              onSelectCommand={onSelectCommand}
              onNewCommand={openCreateDrawer}
              onManageCommands={openManageDrawer}
              onClose={onCloseCommandsList}
              onExpandCommand={openEditDrawer}
              onToggleFavorite={onToggleFavorite}
              maxHeight={listMaxHeight}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create / Edit drawer */}
      <CommandDrawer
        isOpen={showFormDrawer}
        onClose={() => {
          setShowFormDrawer(false);
          setEditingCommand(null);
          setIsReadOnly(false);
        }}
        onSave={handleSave}
        editingCommand={editingCommand}
        isSaving={isSaving}
        readOnly={isReadOnly}
        isAdmin={isAdmin}
        onRequestFilePreviewUrl={
          onRequestFilePreviewUrl ? handleRequestFilePreviewUrl : undefined
        }
        onUploadFile={onUploadFile}
      />

      {/* Manage drawer */}
      <ManageCommandsDrawer
        isOpen={showManageDrawer}
        onClose={() => setShowManageDrawer(false)}
        commands={commands}
        isLoading={isLoading}
        onNewCommand={openCreateDrawer}
        onEditCommand={openEditDrawer}
        onDeleteCommand={onDeleteCommand}
        onToggleFavorite={onToggleFavorite}
      />
    </>
  );
};

export default CommandsOverlay;
