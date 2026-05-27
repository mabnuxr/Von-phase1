import { Command } from "cmdk";
import { motion } from "framer-motion";
import type { SearchResult } from "../../types/search";
import { SearchResultRow } from "./SearchResultRow";

interface Props {
  results: SearchResult[];
  shimmer: boolean;
  deepRunning: boolean;
  onOpen: (result: SearchResult, idx: number) => void;
}

function GroupHeading({ label, pulse }: { label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
      {pulse && (
        <motion.span
          aria-hidden
          className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500"
          animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {label}
    </div>
  );
}

export function SearchResultsList({
  results,
  shimmer,
  deepRunning,
  onOpen,
}: Props) {
  return (
    <Command.Group
      heading={
        <GroupHeading
          label={deepRunning ? "Doing a deeper search…" : "Search results"}
          pulse={deepRunning}
        />
      }
      className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1"
    >
      {results.map((r, i) => (
        <SearchResultRow
          key={`${r.type}:${r.id}`}
          value={`result:${r.type}:${r.id}`}
          result={r}
          shimmer={shimmer}
          onSelect={() => onOpen(r, i)}
        />
      ))}
    </Command.Group>
  );
}
