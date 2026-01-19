/**
 * CommandsOverlay component
 * Renders the commands list dropdown and drawers
 * Used by both ChatInputWithCommands and StandardChatInputWithCommands
 */

import React from 'react';
import { CommandsList } from './CommandsList';
import { CommandDrawer } from './CommandDrawer';
import { ManageCommandsDrawer } from './ManageCommandsDrawer';
import type { Command } from './types';

export interface CommandsOverlayProps {
  /** List of available commands */
  commands: Command[];
  /** Whether to show the commands list dropdown */
  showCommandsList: boolean;
  /** Search query for filtering commands */
  commandSearch: string;
  /** Whether to show the command drawer */
  showCommandDrawer: boolean;
  /** Whether to show the manage commands drawer */
  showManageDrawer: boolean;
  /** Command being edited (null for new command) */
  editingCommand: Command | null;

  // Handlers
  onSelectCommand: (command: Command) => void;
  onNewCommand: () => void;
  onManageCommands: () => void;
  onCloseCommandsList: () => void;
  onEditCommand: (command: Command) => void;
  onSaveCommand: (commandData: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteCommand: (id: string) => void;
  onCloseCommandDrawer: () => void;
  onCloseManageDrawer: () => void;

  // Optional props for command drawer
  salesforceFields?: Array<{ name: string; label: string; type: string }>;
  isLoadingSalesforceFields?: boolean;

  /** Custom class for commands list positioning container */
  commandsListClassName?: string;
}

export const CommandsOverlay: React.FC<CommandsOverlayProps> = ({
  commands,
  showCommandsList,
  commandSearch,
  showCommandDrawer,
  showManageDrawer,
  editingCommand,
  onSelectCommand,
  onNewCommand,
  onManageCommands,
  onCloseCommandsList,
  onEditCommand,
  onSaveCommand,
  onDeleteCommand,
  onCloseCommandDrawer,
  onCloseManageDrawer,
  salesforceFields,
  isLoadingSalesforceFields,
  commandsListClassName = 'absolute bottom-full left-0 right-0 max-w-3xl mx-auto w-full mb-1 z-50',
}) => {
  return (
    <>
      {/* Commands List Dropdown */}
      {showCommandsList && (
        <div className={commandsListClassName}>
          <CommandsList
            commands={commands}
            onSelectCommand={onSelectCommand}
            onNewCommand={onNewCommand}
            onManageCommands={onManageCommands}
            onClose={onCloseCommandsList}
            searchQuery={commandSearch}
            position="above"
          />
        </div>
      )}

      {/* Command Drawer */}
      <CommandDrawer
        isOpen={showCommandDrawer}
        onClose={onCloseCommandDrawer}
        onSave={onSaveCommand}
        editingCommand={editingCommand}
        salesforceFields={salesforceFields}
        isLoadingSalesforceFields={isLoadingSalesforceFields}
      />

      {/* Manage Commands Drawer */}
      <ManageCommandsDrawer
        isOpen={showManageDrawer}
        onClose={onCloseManageDrawer}
        commands={commands}
        onNewCommand={onNewCommand}
        onEditCommand={onEditCommand}
        onDeleteCommand={onDeleteCommand}
      />
    </>
  );
};
