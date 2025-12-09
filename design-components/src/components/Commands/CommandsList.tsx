/**
 * CommandsList component
 * Displays quick action commands in a dropdown when user types '/'
 * Compact design with improved positioning
 */

import React, { useState, useRef, useCallback } from 'react';
import { Plus, X } from '@phosphor-icons/react';
import type { Command, CommandCategory } from './types';
import { CATEGORY_OPTIONS } from './types';

interface CommandsListProps {
  commands: Command[];
  onSelectCommand: (command: Command) => void;
  onNewCommand: () => void;
  onManageCommands: () => void;
  onClose: () => void;
  searchQuery?: string;
  /** Position relative to input - defaults to 'above' */
  position?: 'above' | 'below';
}

export const CommandsList: React.FC<CommandsListProps> = ({
  commands,
  onSelectCommand,
  onNewCommand,
  onManageCommands,
  onClose,
  searchQuery = '',
  position = 'above',
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

  // Position classes based on prop
  const positionClasses =
    position === 'above' ? 'bottom-full mb-1' : 'top-full mt-1';

  return (
    <div
      ref={containerRef}
      className={`absolute ${positionClasses} left-0 w-[360px] max-h-[320px] bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50`}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-900">Quick Commands</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-0.5"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Commands List */}
      <div className="overflow-y-auto max-h-[220px]">
        {sortedCategories.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-gray-500">
            No commands found{searchQuery ? ` for "${searchQuery}"` : ''}
          </div>
        ) : (
          sortedCategories.map((category) => (
            <div key={category}>
              {/* Category Header */}
              <div className="px-3 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                {category}
              </div>

              {/* Category Commands */}
              {groupedCommands[category].map((command) => (
                <button
                  key={command.id}
                  onClick={() => onSelectCommand(command)}
                  onMouseEnter={() => setHoveredId(command.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`w-full px-3 py-2 text-left transition-colors cursor-pointer ${
                    hoveredId === command.id ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${
                      hoveredId === command.id ? 'text-gray-900' : 'text-gray-900'
                    }`}
                  >
                    {command.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {command.description}
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewCommand}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Plus size={12} weight="bold" />
            <span>New</span>
          </button>
          <button
            onClick={onManageCommands}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <span>Manage</span>
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <span>Press</span>
          <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-gray-500 font-mono text-[10px]">
            /
          </kbd>
          <span>to open</span>
        </div>
      </div>
    </div>
  );
};
