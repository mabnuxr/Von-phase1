/**
 * ManageCommandsDrawer component
 * Drawer for viewing, searching, filtering, and managing all commands
 */

import React, { useState, useMemo } from 'react';
import { X, Plus, MagnifyingGlass, Trash, PencilSimple } from '@phosphor-icons/react';
import { type Command, type CommandCategory, CATEGORY_OPTIONS } from './types';

interface ManageCommandsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  onNewCommand: () => void;
  onEditCommand: (command: Command) => void;
  onDeleteCommand: (id: string) => void;
}

type FilterCategory = CommandCategory | 'All';

export const ManageCommandsDrawer: React.FC<ManageCommandsDrawerProps> = ({
  isOpen,
  onClose,
  commands,
  onNewCommand,
  onEditCommand,
  onDeleteCommand,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const categoryOptions: FilterCategory[] = ['All', ...CATEGORY_OPTIONS];

  // Filter commands
  const filteredCommands = useMemo(() => {
    let result = commands;

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter((cmd) => cmd.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (cmd) =>
          cmd.name.toLowerCase().includes(query) || cmd.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [commands, selectedCategory, searchQuery]);

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const sortedCategories = CATEGORY_OPTIONS.filter((cat) => groupedCommands[cat]?.length > 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 transition-opacity duration-300 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[520px] max-w-[90vw] bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Manage Quick Commands</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and New Action */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quick actions..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              />
            </div>
            <button
              onClick={onNewCommand}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>New Action</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="flex gap-2 overflow-x-auto">
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-sm rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Commands List */}
        <div className="flex-1 overflow-y-auto">
          {sortedCategories.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 mb-2">No commands found</div>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : 'Create your first quick action to get started'}
              </p>
            </div>
          ) : (
            sortedCategories.map((category) => (
              <div key={category}>
                {/* Category Header */}
                <div className="px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                  {category}
                </div>

                {/* Commands */}
                {groupedCommands[category].map((command) => (
                  <div
                    key={command.id}
                    onMouseEnter={() => setHoveredId(command.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`px-6 py-4 border-b border-gray-100 transition-colors ${
                      hoveredId === command.id ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{command.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {command.description}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div
                        className={`flex items-center gap-1 ml-4 transition-opacity ${
                          hoveredId === command.id ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <button
                          onClick={() => onEditCommand(command)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          onClick={() => onDeleteCommand(command.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-500">{filteredCommands.length} actions</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};
