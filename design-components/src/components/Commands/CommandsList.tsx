/**
 * CommandsList component
 * Displays all commands in a flat dropdown when user types '/'
 * Features: favorites pinned at top, expand-to-edit
 * No category grouping — clean flat list with favorites pinned on top
 *
 * Filtering and ordering are handled by the parent (CommandsOverlay / ServerCommandsList).
 * This component is purely presentational: it renders whatever `commands` it receives.
 */

import React, { useEffect, useRef } from 'react';
import { ArrowsOut, BookmarkSimple } from '@phosphor-icons/react';
import type { Command } from './types';
import { IconButton } from '../forms/buttons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip HTML tags and truncate for prompt preview */
function getPromptPreview(prompt: string, maxLen = 60): string {
  let text = prompt;
  if (text.includes('<') && text.includes('>')) {
    text = text.replace(/<[^>]*>/g, '');
  }
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CommandsListHelpText: React.FC = () => (
  <div className="px-3 pt-2.5 pb-1.5">
    <span className="text-xs text-gray-400">/ Select command</span>
  </div>
);

interface CommandItemProps {
  command: Command;
  onSelect: (command: Command) => void;
  onExpand?: (command: Command) => void;
  onToggleFavorite?: (command: Command) => void;
  isHighlighted?: boolean;
}

const CommandItem: React.FC<CommandItemProps> = ({
  command,
  onSelect,
  onExpand,
  onToggleFavorite,
  isHighlighted,
}) => (
  <div
    className={`group flex items-start px-3 py-2 rounded-xl transition-colors cursor-pointer border border-transparent ${isHighlighted ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
    onClick={() => onSelect(command)}
  >
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-gray-900">{command.name}</div>
      <div className="text-xs text-gray-800/80 line-clamp-1">
        {getPromptPreview(command.prompt)}
      </div>
    </div>

    <div className="flex items-center gap-0.5 ml-3 shrink-0">
      <IconButton
        icon={<ArrowsOut size={14} />}
        onClick={(e) => {
          e.stopPropagation();
          onExpand?.(command);
        }}
        title={command.createdBy === 'me' ? 'Expand & edit' : 'View'}
        size="small"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <IconButton
        icon={
          <BookmarkSimple
            size={14}
            weight={command.isFavorite ? 'fill' : 'regular'}
            className={command.isFavorite ? 'text-black-500' : ''}
          />
        }
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(command);
        }}
        title={command.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        size="small"
        className={command.isFavorite ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}
      />
    </div>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="px-4 py-8 text-sm text-gray-500 text-center">No commands found.</div>
);

interface CommandsListFooterProps {
  onNewCommand: () => void;
  onManageCommands: () => void;
}

const CommandsListFooter: React.FC<CommandsListFooterProps> = ({
  onNewCommand,
  onManageCommands,
}) => (
  <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-end gap-1.5">
    <button
      type="button"
      onClick={onManageCommands}
      className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
    >
      Manage
    </button>
    <button
      type="button"
      onClick={onNewCommand}
      className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
    >
      Create New
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CommandsListProps {
  commands: Command[];
  isLoading: boolean;
  onSelectCommand: (command: Command) => void;
  onNewCommand: () => void;
  onManageCommands: () => void;
  onExpandCommand?: (command: Command) => void;
  onToggleFavorite?: (command: Command) => void;
  /** Max height in px for the scrollable list — computed dynamically by CommandsOverlay */
  maxHeight?: number;
  /** Index of the currently keyboard-highlighted command */
  highlightedIndex?: number;
}

export const CommandsList: React.FC<CommandsListProps> = ({
  commands,
  isLoading,
  onSelectCommand,
  onNewCommand,
  onManageCommands,
  onExpandCommand,
  onToggleFavorite,
  maxHeight = 300,
  highlightedIndex = 0,
}) => {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll highlighted item into view when navigating with arrow keys
  useEffect(() => {
    itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);
  if (isLoading && commands.length === 0) {
    return (
      <div className="w-full max-w-sm bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-8 text-sm text-gray-400 text-center">
        Loading commands…
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-white border border-gray-100 shadow-sm overflow-hidden rounded-xl">
      <CommandsListHelpText />

      <div className="overflow-y-auto px-1.5 py-2 flex flex-col gap-1" style={{ maxHeight }}>
        {commands.length === 0 ? (
          <EmptyState />
        ) : (
          commands.map((command, index) => (
            <div
              key={command.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
            >
              <CommandItem
                command={command}
                onSelect={onSelectCommand}
                onExpand={onExpandCommand}
                onToggleFavorite={onToggleFavorite}
                isHighlighted={index === highlightedIndex}
              />
            </div>
          ))
        )}
      </div>

      <CommandsListFooter onNewCommand={onNewCommand} onManageCommands={onManageCommands} />
    </div>
  );
};

export default CommandsList;
