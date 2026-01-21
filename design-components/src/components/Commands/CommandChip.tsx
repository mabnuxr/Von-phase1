/**
 * CommandChip component
 * Displays a selected command as a removable chip
 */

import React from 'react';
import { X } from '@phosphor-icons/react';
import type { Command } from './types';

export interface CommandChipProps {
  /** The selected command to display */
  command: Command;
  /** Callback when the remove button is clicked */
  onRemove: () => void;
  /** Whether to show the description (defaults to command name) */
  showDescription?: boolean;
}

export const CommandChip: React.FC<CommandChipProps> = ({
  command,
  onRemove,
  showDescription = true,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg">
        <span className="text-sm font-medium text-indigo-700">{command.name}</span>
        <button
          onClick={onRemove}
          className="text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
      <span className="text-sm text-gray-400 truncate flex-1">
        {showDescription ? command.description : command.name}
      </span>
    </div>
  );
};
