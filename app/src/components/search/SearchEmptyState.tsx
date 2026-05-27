import { Command } from "cmdk";
import type { SearchResult } from "../../types/search";
import { Clock } from "./icons";
import { SearchResultRow } from "./SearchResultRow";

interface Props {
  recentSearches: string[];
  recentItems: SearchResult[];
  onChooseSearch: (q: string) => void;
  onOpenItem: (result: SearchResult, idx: number) => void;
}

const HEADING_CLASSES =
  "[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-500";

export function SearchEmptyState({
  recentSearches,
  recentItems,
  onChooseSearch,
  onOpenItem,
}: Props) {
  if (recentSearches.length === 0 && recentItems.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-500">
        Start typing to search your chats and dashboards.
      </div>
    );
  }

  return (
    <>
      {recentSearches.length > 0 && (
        <Command.Group heading="Search history" className={HEADING_CLASSES}>
          {recentSearches.slice(0, 3).map((q) => (
            <Command.Item
              key={`search:${q}`}
              value={`search:${q}`}
              onSelect={() => onChooseSearch(q)}
              className="flex items-center gap-3 w-full px-4 py-2.5 cursor-pointer border-l-2 border-transparent transition-colors data-[selected=true]:bg-gray-50 data-[selected=true]:border-indigo-600 hover:bg-gray-50 hover:border-indigo-600 text-left"
            >
              <Clock size={16} className="text-gray-500 shrink-0" />
              <span className="text-sm text-gray-900 truncate">{q}</span>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {recentItems.length > 0 && (
        <Command.Group heading="Recent" className={HEADING_CLASSES}>
          {recentItems.slice(0, 5).map((r, i) => (
            <SearchResultRow
              key={`${r.type}:${r.id}`}
              value={`recent:${r.type}:${r.id}`}
              result={r}
              shimmer={false}
              onSelect={() => onOpenItem(r, i)}
            />
          ))}
        </Command.Group>
      )}
    </>
  );
}
