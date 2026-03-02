import { useState, useMemo } from 'react';
import { type Command, type CommandSortOption, SORT_OPTIONS } from './types';

export interface UseCommandsFilterReturn {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortOption: CommandSortOption;
  setSortOption: (opt: CommandSortOption) => void;
  showSortMenu: boolean;
  setShowSortMenu: (show: boolean) => void;
  /** Label of the active sort option, for display in the sort button. */
  currentSortLabel: string;
  /** Commands after search + sort filter + favorites-pinned ordering. */
  orderedCommands: Command[];
}

export function useCommandsFilter(commands: Command[]): UseCommandsFilterReturn {
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

  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === sortOption)?.label ?? 'Sort';

  return {
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    showSortMenu,
    setShowSortMenu,
    currentSortLabel,
    orderedCommands,
  };
}
