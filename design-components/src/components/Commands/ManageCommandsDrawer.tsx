/**
 * ManageCommandsDrawer component
 * Full drawer for viewing, searching, sorting, and managing all commands.
 * Matches the CommandsList popover layout — flat list, favorites pinned at top.
 */

import React, { useState } from 'react';
import { X, MagnifyingGlass, Trash, BookmarkSimple, SortAscending } from '@phosphor-icons/react';
import { type Command, SORT_OPTIONS } from './types';
import { Drawer } from '../Drawer';
import { useCommandsFilter } from './useCommandsFilter';
import { Tooltip } from '../Tooltip';
import { DeleteCommandConfirmModal } from './DeleteCommandConfirmModal';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface ManageCommandsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  isLoading?: boolean;
  onNewCommand: () => void;
  onEditCommand: (command: Command) => void;
  onDeleteCommand: (id: string) => void;
  onToggleFavorite?: (command: Command) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatModifiedDate(isoString: string): string {
  const date = new Date(isoString);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPromptPreview(prompt: string, maxLen = 60): string {
  let text = prompt;
  if (text.includes('<') && text.includes('>')) {
    text = text.replace(/<[^>]*>/g, '');
  }
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

export const ManageCommandsDrawer: React.FC<ManageCommandsDrawerProps> = ({
  isOpen,
  onClose,
  commands,
  isLoading = false,
  onNewCommand,
  onEditCommand,
  onDeleteCommand,
  onToggleFavorite,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    showSortMenu,
    setShowSortMenu,
    currentSortLabel,
    orderedCommands,
  } = useCommandsFilter(commands);

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Commands</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onNewCommand}
              className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Create New
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlass
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all placeholder:text-gray-400"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-900 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              title="Sort commands"
            >
              <SortAscending size={13} />
              <span>{currentSortLabel}</span>
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-sm z-20 py-1">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortOption(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                        sortOption === option.value
                          ? 'bg-gray-50 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Commands list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {isLoading ? (
          <div className="space-y-1" aria-busy="true" aria-label="Loading commands">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start px-3 py-2 rounded-xl animate-pulse">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 bg-gray-100 rounded w-32" />
                    <div className="h-3.5 bg-gray-100 rounded w-10 shrink-0" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
                <div className="flex items-center gap-0.5 ml-3 shrink-0">
                  <div className="h-6 w-6 bg-gray-100 rounded-md" />
                  <div className="h-6 w-6 bg-gray-100 rounded-md" />
                  <div className="w-px h-4 bg-gray-100 mx-0.5" />
                  <div className="h-6 w-6 bg-gray-100 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : orderedCommands.length === 0 ? (
          <div className="px-4 py-8 text-sm text-gray-500 text-center">
            No commands found{searchQuery ? ` for "${searchQuery}"` : ''}.
          </div>
        ) : (
          orderedCommands.map((command) => (
            <div
              key={command.id}
              className="group flex items-start px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onEditCommand(command)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-900 truncate">{command.name}</span>
                  {command.sharingScope === 'org' ? (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">
                      Org
                    </span>
                  ) : (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">
                      Private
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-800/80 mt-0.5 line-clamp-1">
                  {getPromptPreview(command.prompt)}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {command.usageCount !== undefined && (
                    <span className="text-[11px] text-gray-400">Used {command.usageCount}x</span>
                  )}
                  {command.usageCount !== undefined && command.createdBy && (
                    <span className="text-[11px] text-gray-300">·</span>
                  )}
                  {command.createdBy && (
                    <span className="text-[11px] text-gray-400">
                      {command.createdBy === 'me'
                        ? 'Created by me'
                        : command.creatorName
                          ? `Created by ${command.creatorName}`
                          : 'Created by team'}
                    </span>
                  )}
                  {command.updatedAt && (
                    <>
                      <span className="text-[11px] text-gray-300">·</span>
                      <span className="text-[11px] text-gray-400">
                        Modified {formatModifiedDate(command.updatedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-0.5 ml-3 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(command);
                  }}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    command.isFavorite
                      ? 'text-gray-800 hover:text-gray-900'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
                  }`}
                  title={command.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <BookmarkSimple size={16} weight={command.isFavorite ? 'fill' : 'regular'} />
                </button>
                <div className="w-px h-4 bg-gray-200 mx-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Tooltip
                  content={
                    command.createdBy === 'me' ? 'Delete' : 'Only the owner can delete'
                  }
                  placement="top"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (command.createdBy === 'me') {
                        setConfirmDeleteId(command.id);
                      }
                    }}
                    disabled={command.createdBy !== 'me'}
                    className={`p-1 rounded-md transition-all opacity-0 group-hover:opacity-100 ${command.createdBy === 'me' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    <Trash size={16} />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))
        )}
      </div>
      <DeleteCommandConfirmModal
        isOpen={!!confirmDeleteId}
        commandName={orderedCommands.find((c) => c.id === confirmDeleteId)?.name ?? ''}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            onDeleteCommand(confirmDeleteId);
            setConfirmDeleteId(null);
          }
        }}
      />
    </Drawer>
  );
};

export default ManageCommandsDrawer;
