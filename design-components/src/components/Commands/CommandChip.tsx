/**
 * CommandChip component
 * Displays a selected command as a removable or clickable chip
 * - Entire chip is clickable to open the details drawer (when onClick is provided)
 * - CaretRight icon always visible (when onClick is provided)
 * - X icon appears on hover (when onRemove is provided) — clicking it removes the command
 */

import React from 'react';
import { X, CaretRight } from '@phosphor-icons/react';
import type { Command } from './types';

export interface CommandChipProps {
  /** The selected command to display */
  command: Command;
  /** Callback when the remove button is clicked — shows X on hover */
  onRemove?: () => void;
  /** Callback when the chip is clicked — opens details drawer */
  onClick?: () => void;
  /** Whether the chip is in an expanded state (rotates the caret) */
  isExpanded?: boolean;
  /** When true, renders the command description below the name */
  showDescription?: boolean;
}

export const CommandChip: React.FC<CommandChipProps> = ({
  command,
  onRemove,
  onClick,
  isExpanded = false,
  showDescription = false,
}) => {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className={`group/chip inline-flex items-center gap-1 px-2 py-1 rounded-xl border border-gray-200/60 bg-white min-w-0 shadow-xs ${onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-150' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        <div className="flex flex-col min-w-0">
          <span
            className="text-[13px] font-medium whitespace-nowrap"
            style={{
              background: 'linear-gradient(90deg, #F97316, #A855F7)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {command.name}
          </span>
          {showDescription && command.description && (
            <span className="text-[11px] text-gray-400 truncate">{command.description}</span>
          )}
        </div>

        {/* Caret — rotates down when expanded */}
        {onClick && (
          <span
            className={`text-gray-400 p-0.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          >
            <CaretRight size={12} weight="bold" />
          </span>
        )}

        {/* X icon — always visible so the user can always remove the command */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer shrink-0 ml-0.5"
            aria-label="Remove command"
          >
            <X size={12} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CommandChip;
