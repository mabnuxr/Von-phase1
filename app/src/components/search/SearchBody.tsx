import { Command } from "cmdk";
import type { SearchResult } from "../../types/search";
import { SearchEmptyState } from "./SearchEmptyState";
import { SearchResultsList } from "./SearchResultsList";

interface Props {
  query: string;
  results: SearchResult[];
  isQuickLoading: boolean;
  isDeepRunning: boolean;
  isDeepDone: boolean;
  error: string | null;
  recentSearches: string[];
  recentItems: SearchResult[];
  onChooseRecentSearch: (q: string) => void;
  onOpen: (result: SearchResult, idx: number) => void;
}

export function SearchBody(props: Props) {
  const {
    query,
    results,
    isQuickLoading,
    isDeepRunning,
    isDeepDone,
    error,
    recentSearches,
    recentItems,
    onChooseRecentSearch,
    onOpen,
  } = props;

  const trimmed = query.trim();

  if (!trimmed) {
    return (
      <SearchEmptyState
        recentSearches={recentSearches}
        recentItems={recentItems}
        onChooseSearch={onChooseRecentSearch}
        onOpenItem={onOpen}
      />
    );
  }

  if (error && results.length === 0) {
    return (
      <Command.Empty>
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          Search unavailable. Try again in a moment.
        </div>
      </Command.Empty>
    );
  }

  if (isQuickLoading && results.length === 0) {
    return (
      <Command.Loading>
        <div className="px-4 py-8 text-center text-sm text-gray-400">
          Searching…
        </div>
      </Command.Loading>
    );
  }

  if (isDeepDone && results.length === 0) {
    return (
      <Command.Empty>
        <div className="px-4 py-8 text-center">
          <div className="text-sm font-medium text-gray-900">
            No matches for &ldquo;{trimmed}&rdquo;
          </div>
          <div className="mt-1 text-[13px] text-gray-500">
            Start a new chat — Von can pick up from scratch.
          </div>
        </div>
      </Command.Empty>
    );
  }

  if (results.length === 0 && !isDeepRunning) {
    return (
      <Command.Empty>
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          No matches yet — try a different phrase.
        </div>
      </Command.Empty>
    );
  }

  return (
    <SearchResultsList
      results={results}
      shimmer={isDeepRunning}
      deepRunning={isDeepRunning}
      onOpen={onOpen}
    />
  );
}
