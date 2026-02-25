/**
 * ManageCommandsDrawer component
 * Full drawer for viewing, searching, sorting, and managing all commands.
 * Matches the CommandsList popover layout — flat list, favorites pinned at top.
 */

import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MagnifyingGlass,
  Trash,
  ArrowsOut,
  BookmarkSimple,
  SortAscending,
} from '@phosphor-icons/react';
import { type Command, type CommandSortOption, SORT_OPTIONS } from './types';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<CommandSortOption>('recently_used');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filteredCommands = useMemo(() => {
    let list = commands;

    // "Created by me" is a filter, not a sort
    if (sortOption === 'created_by_me') {
      list = list.filter((cmd) => cmd.createdBy === 'me');
    }

    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((cmd) => cmd.name.toLowerCase().includes(query));
  }, [commands, searchQuery, sortOption]);

  const sortedCommands = useMemo(() => {
    const sorted = [...filteredCommands];
    switch (sortOption) {
      case 'recently_used':
        sorted.sort(
          (a, b) =>
            new Date(b.lastUsedAt || b.updatedAt).getTime() -
            new Date(a.lastUsedAt || a.updatedAt).getTime()
        );
        break;
      case 'most_used':
        sorted.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case 'created_by_me':
        // Already filtered above — no additional sort needed
        break;
    }
    return sorted;
  }, [filteredCommands, sortOption]);

  // Favorites pinned at top
  const orderedCommands = useMemo(() => {
    const favorites = sortedCommands.filter((cmd) => cmd.isFavorite);
    const rest = sortedCommands.filter((cmd) => !cmd.isFavorite);
    return [...favorites, ...rest];
  }, [sortedCommands]);

  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === sortOption)?.label || 'Sort';

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/15 z-55"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-0 right-0 h-full p-2 z-60"
            style={{ width: '480px', maxWidth: '90vw' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-3 py-2.5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-900">Commands</h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onNewCommand}
                      className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Create New
                    </button>
                    <button
                      onClick={onClose}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
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
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search commands..."
                      className="w-full pl-7 pr-2.5 py-1 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all placeholder:text-gray-400"
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
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowSortMenu(false)}
                        />
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
                      <div
                        key={i}
                        className="flex items-start px-3 py-2 rounded-xl animate-pulse"
                      >
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
                      className="flex items-start px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {command.name}
                          </span>
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
                            <span className="text-[11px] text-gray-400">
                              Used {command.usageCount}x
                            </span>
                          )}
                          {command.usageCount !== undefined && command.createdBy && (
                            <span className="text-[11px] text-gray-300">·</span>
                          )}
                          {command.createdBy && (
                            <span className="text-[11px] text-gray-400">
                              {command.createdBy === 'me' ? 'Created by me' : 'Created by team'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 ml-3 shrink-0">
                        <button
                          onClick={() => onEditCommand(command)}
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                          title={command.createdBy === 'me' ? 'Expand & edit' : 'View'}
                        >
                          <ArrowsOut size={16} />
                        </button>
                        <button
                          onClick={() => onToggleFavorite?.(command)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            command.isFavorite
                              ? 'text-gray-800 hover:text-gray-900'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title={command.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <BookmarkSimple
                            size={16}
                            weight={command.isFavorite ? 'fill' : 'regular'}
                          />
                        </button>
                        <>
                          <div className="w-px h-4 bg-gray-200 mx-0.5" />
                          <button
                            onClick={() =>
                              command.createdBy === 'me' && onDeleteCommand(command.id)
                            }
                            disabled={command.createdBy !== 'me'}
                            className={`p-1 rounded-md transition-colors ${command.createdBy === 'me' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                            title={
                              command.createdBy === 'me'
                                ? 'Delete'
                                : 'Only the creator can delete this command'
                            }
                          >
                            <Trash size={16} />
                          </button>
                        </>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ManageCommandsDrawer;
