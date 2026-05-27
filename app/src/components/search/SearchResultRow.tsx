import { Command } from "cmdk";
import { motion } from "framer-motion";
import type { SearchResult } from "../../types/search";
import { ResultTypeIcon, ShareNetwork } from "./icons";
import { formatRelativeTime } from "./searchUtils";

interface Props {
  result: SearchResult;
  value: string;
  shimmer: boolean;
  onSelect: () => void;
}

function subtitleFor(r: SearchResult): string {
  if (r.type === "widget" && r.parent_dashboard_name) {
    return `Widget · in ${r.parent_dashboard_name}`;
  }
  return r.subtitle;
}

export function SearchResultRow({ result, value, shimmer, onSelect }: Props) {
  const sub = subtitleFor(result);

  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="relative grid grid-cols-[28px_1fr_auto] gap-x-3 px-4 py-2.5 cursor-pointer border-l-2 border-transparent transition-colors data-[selected=true]:bg-gray-50 data-[selected=true]:border-indigo-600 hover:bg-gray-50 hover:border-indigo-600"
    >
      <div className="row-start-1 row-span-2 pt-0.5 text-gray-500">
        <ResultTypeIcon type={result.type} />
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-gray-900 truncate">
          {result.title}
        </span>
        {result.is_shared && result.shared_by_name && (
          <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium whitespace-nowrap shrink-0">
            <ShareNetwork size={11} weight="regular" />
            {result.shared_by_name}
          </span>
        )}
      </div>

      <span className="self-start pt-0.5 text-xs text-gray-400 tabular-nums whitespace-nowrap">
        {formatRelativeTime(result.updated_at)}
      </span>

      {sub && (
        <div className="col-start-2 col-span-2 text-[13px] text-gray-600 line-clamp-1">
          {sub}
        </div>
      )}

      {shimmer && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
          initial={{ backgroundPosition: "200% 0" }}
          animate={{ backgroundPosition: "-200% 0" }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        />
      )}
    </Command.Item>
  );
}
