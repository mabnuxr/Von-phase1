/**
 * CommandChip component
 * Displays the selected command as a small pill.
 * Layout: [name >] [×?]
 * The file icon stack lives outside this component, in CommandStrip.
 */

import React from 'react';
import { CaretRight, X } from '@phosphor-icons/react';
import type { Command } from './types';

export interface CommandChipProps {
  /** The selected command to display */
  command: Command;
  /** Callback when the chip is clicked — opens details drawer */
  onClick?: () => void;
  /** If provided, renders an inline × remove button */
  onRemove?: () => void;
  /** Whether to show the caret icon — defaults to true */
  showCaret?: boolean;
  /** Whether the chip is in an expanded state (rotates the caret) */
  isExpanded?: boolean;
  /** When true, renders the command description below the name */
  showDescription?: boolean;
}

export const CommandChip: React.FC<CommandChipProps> = ({
  command,
  onClick,
  onRemove,
  showCaret = true,
  isExpanded = false,
  showDescription = false,
}) => {
  return (
    <div
      className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-xl border border-gray-200/60 bg-white shadow-xs shrink-0 ${onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-150' : ''}`}
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

      {showCaret && (
        <span
          className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
        >
          <CaretRight size={11} weight="bold" className="opacity-60" />
        </span>
      )}

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer shrink-0 ml-1"
          aria-label="Remove command"
        >
          <X size={12} weight="bold" />
        </button>
      )}
    </div>
  );
};

export default CommandChip;
