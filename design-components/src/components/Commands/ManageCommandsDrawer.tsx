/**
 * ManageCommandsDrawer component
 * Drawer for viewing, searching, filtering, and managing all commands
 * Updated with compact styling and removed blue accents
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
        className="fixed inset-0 bg-black/20 transition-opacity duration-300 z-[55]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full p-2 z-[60]"
        style={{ width: '520px', maxWidth: '90vw' }}
      >
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Manage Quick Actions</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search and New Action */}
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MagnifyingGlass
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search quick actions..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
                />
              </div>
              <button
                onClick={onNewCommand}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <Plus size={14} weight="bold" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="px-5 py-2.5 border-b border-gray-100">
            <div className="flex gap-1.5 overflow-x-auto">
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-md border whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-gray-900 border-gray-900 text-white'
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
              <div className="px-5 py-10 text-center">
                <div className="text-gray-400 mb-1 text-sm">No commands found</div>
                <p className="text-xs text-gray-500">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : 'Create your first quick action to get started'}
                </p>
              </div>
            ) : (
              sortedCategories.map((category) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-5 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                    {category}
                  </div>

                  {/* Commands */}
                  {groupedCommands[category].map((command) => (
                    <div
                      key={command.id}
                      onMouseEnter={() => setHoveredId(command.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`px-5 py-3 border-b border-gray-100 transition-colors ${
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
                          className={`flex items-center gap-0.5 ml-3 transition-opacity ${
                            hoveredId === command.id ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <button
                            onClick={() => onEditCommand(command)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <PencilSimple size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteCommand(command.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash size={14} />
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
          <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-xs text-gray-500">{filteredCommands.length} actions</span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
