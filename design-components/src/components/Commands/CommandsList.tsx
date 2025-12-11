/**
 * CommandsList component
 * Displays quick action commands in a dropdown when user types '/'
 */

import React, { useState, useRef, useCallback } from 'react';
import { Plus } from '@phosphor-icons/react';
import type { Command, CommandCategory } from './types';
import { CATEGORY_OPTIONS } from './types';

interface CommandsListProps {
  commands: Command[];
  onSelectCommand: (command: Command) => void;
  onNewCommand: () => void;
  onManageCommands: () => void;
  onClose: () => void;
  searchQuery?: string;
}

export const CommandsList: React.FC<CommandsListProps> = ({
  commands,
  onSelectCommand,
  onNewCommand,
  onManageCommands,
  onClose,
  searchQuery = '',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search query (after the '/')
  const filteredCommands = searchQuery
    ? commands.filter(
        (cmd) =>
          cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : commands;

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<CommandCategory, Command[]>
  );

  // Sort categories in preferred order
  const sortedCategories = CATEGORY_OPTIONS.filter((cat) => groupedCommands[cat]?.length > 0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 w-[420px] max-h-[400px] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-900">Quick Commands</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Commands List */}
      <div className="overflow-y-auto max-h-[280px]">
        {sortedCategories.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No commands found{searchQuery ? ` for "${searchQuery}"` : ''}
          </div>
        ) : (
          sortedCategories.map((category) => (
            <div key={category}>
              {/* Category Header */}
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                {category}
              </div>

              {/* Category Commands */}
              {groupedCommands[category].map((command) => (
                <button
                  key={command.id}
                  onClick={() => onSelectCommand(command)}
                  onMouseEnter={() => setHoveredId(command.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`w-full px-4 py-3 text-left transition-colors cursor-pointer ${
                    hoveredId === command.id ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${
                      hoveredId === command.id ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {command.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{command.description}</div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={onNewCommand}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Plus size={14} weight="bold" />
            <span>New</span>
          </button>
          <button
            onClick={onManageCommands}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <span>Manage</span>
          </button>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500 font-mono">
            /
          </kbd>
          <span>to open</span>
        </div>
      </div>
    </div>
  );
};
