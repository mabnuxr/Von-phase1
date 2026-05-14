import type { VersionHistoryItem, VersionHistoryTab } from "./types";

const AVATAR_PALETTE = [
  "#6b2fd6",
  "#2a5bff",
  "#f97316",
  "#16a34a",
  "#c53030",
  "#0ea5e9",
];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1)
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  // Match the design's "May 06, 2026 at 1:16 PM" cadence — concise enough
  // for narrow rows, unambiguous about the year for older entries.
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function roleLabel(item: VersionHistoryItem): string {
  if (item.kind === "last_published") return "Last published";
  if (item.restoredFromTimestamp) {
    return `Restored from ${formatTimestamp(item.restoredFromTimestamp)}`;
  }
  if (item.kind === "published") return "Published";
  return "Draft";
}

interface VersionRowProps {
  item: VersionHistoryItem;
  tab: VersionHistoryTab;
  selected: boolean;
  isCurrentDraftHead: boolean;
  /** Positional flag — only the first row of the published list is the
   *  live "latest" version. Lower rows are archived published lineage
   *  entries and must not show the chip. */
  isLatestPublished: boolean;
  isYou: boolean;
  onSelect: () => void;
}

/**
 * Single row in the version-history list. Click selects it (drives the
 * footer CTA). The row chrome (spine dot, avatar, label) mirrors the
 * design's `VersionRow` from `version-history.jsx`.
 *
 * Per product call: when `changeNote` is empty / null, the note element
 * is omitted entirely — no empty placeholder card.
 */
export const VersionRow: React.FC<VersionRowProps> = ({
  item,
  tab,
  selected,
  isCurrentDraftHead,
  isLatestPublished,
  isYou,
  onSelect,
}) => {
  const note = item.changeNote?.trim();
  const avatarColor = item.authorColor ?? hashColor(item.authorId);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`group relative flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected
          ? "border-blue-200 bg-blue-50/70"
          : "border-transparent hover:bg-gray-50"
      }`}
    >
      {/* Spine dot — fills when the entry is the current head of its tab. */}
      <span className="relative mt-1 flex flex-col items-center">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            isCurrentDraftHead || isLatestPublished
              ? "bg-blue-600 shadow-[0_0_0_3px_rgba(42,91,255,0.18)]"
              : "bg-gray-300"
          }`}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-medium text-gray-900">
            {formatTimestamp(item.timestamp)}
          </span>
          {tab === "published" && isLatestPublished && (
            <span className="rounded-full bg-blue-50 px-1.5 py-px text-[10px] font-semibold text-blue-700">
              Latest
            </span>
          )}
          {isCurrentDraftHead && (
            <span className="rounded-full bg-amber-50 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wider text-amber-700">
              Current draft
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white"
            style={{ background: avatarColor }}
          >
            {initials(item.authorName)}
          </span>
          <span className="truncate text-[11px] text-gray-500">
            {item.authorName}
            {isYou && <span className="text-gray-400"> (you)</span>} ·{" "}
            {roleLabel(item)}
          </span>
        </div>

        {note && (
          <div className="mt-2 rounded-md border border-gray-100 bg-white px-2 py-1.5 text-[11.5px] leading-snug text-gray-700">
            {note}
          </div>
        )}
      </div>
    </button>
  );
};
