import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClockCounterClockwiseIcon,
  FileTextIcon,
  XIcon,
} from "@phosphor-icons/react";
import { VersionRow } from "./VersionRow";
import type { VersionHistoryItem, VersionHistoryTab } from "./types";

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Active draft (head) followed by `draft_saved` history rows, newest first. */
  drafts: VersionHistoryItem[];
  /** Published lineage, newest first. The first entry is treated as "Latest". */
  publishedVersions: VersionHistoryItem[];
  /** Caller's user id — drives the "(you)" annotation on rows they authored. */
  currentUserId?: string;
  /** Whether the versions query is in-flight. Suppresses the empty state so
   *  the list doesn't flash empty between open and first response. */
  isLoading?: boolean;
  /** Continue the active draft (head of the current-draft tab). */
  onContinueDraft?: (versionId: string) => void;
  /** Restore any non-head row as a new draft (forks from that version). */
  onRestoreAsDraft?: (versionId: string) => void;
}

// ─── Empty states (per tab) ──────────────────────────────────────

const EmptyState: React.FC<{ tab: VersionHistoryTab }> = ({ tab }) => (
  <div className="px-6 py-10 text-center">
    <span
      aria-hidden
      className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400"
    >
      {tab === "current" ? (
        <FileTextIcon size={18} />
      ) : (
        <ClockCounterClockwiseIcon size={18} />
      )}
    </span>
    <div className="mb-1 text-[12.5px] font-semibold text-gray-900">
      {tab === "current" ? "No drafts yet" : "Nothing published yet"}
    </div>
    <div className="mx-auto max-w-[220px] text-[11.5px] leading-snug text-gray-500">
      {tab === "current"
        ? "Drafts appear here while you're editing. Switch to Publish history to start a new draft from a published version."
        : "Once you publish a draft, every published version lands here and can be restored as a new draft."}
    </div>
  </div>
);

// ─── Drawer ──────────────────────────────────────────────────────

/**
 * Right-side version-history drawer (VON-1282). Slides in from the
 * right edge with two tabs:
 *   - Current draft : the active draft + `draft_saved` snapshots.
 *   - Publish history : the published lineage.
 *
 * The footer CTA is selection-aware:
 *   - Selected row is the active draft head → "Continue draft".
 *   - Any other row → "Restore as a draft" (forks a new draft).
 *
 * Visual treatment follows the design's `HistoryEditEntry` artboard.
 */
export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  drafts,
  publishedVersions,
  currentUserId,
  isLoading,
  onContinueDraft,
  onRestoreAsDraft,
}) => {
  const [tab, setTab] = useState<VersionHistoryTab>("current");
  const activeDraftHeadId =
    drafts[0]?.kind === "active_draft" ? drafts[0].id : null;
  const defaultSelectedId =
    tab === "current"
      ? (activeDraftHeadId ?? drafts[0]?.id ?? null)
      : (publishedVersions[0]?.id ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultSelectedId,
  );

  // Reset selection whenever the drawer reopens or the tab switches —
  // matches the "fresh open, latest highlighted" expectation.
  useEffect(() => {
    if (!isOpen) return;
    setSelectedId(defaultSelectedId);
    // We intentionally omit `defaultSelectedId` from the deps — it would
    // re-fire on every row change. We only want a reset on tab swap / open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab]);

  // Esc to dismiss — matches the share / edit-lock modals.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const rows = tab === "current" ? drafts : publishedVersions;
  const selectedRow = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const isOnActiveDraftHead =
    tab === "current" &&
    !!activeDraftHeadId &&
    selectedId === activeDraftHeadId;
  const ctaLabel = isOnActiveDraftHead
    ? "Continue draft"
    : "Restore as a draft";
  const canAct = !!selectedRow;

  const handlePrimary = useCallback(() => {
    if (!selectedRow) return;
    if (isOnActiveDraftHead) {
      onContinueDraft?.(selectedRow.id);
    } else {
      onRestoreAsDraft?.(selectedRow.id);
    }
  }, [selectedRow, isOnActiveDraftHead, onContinueDraft, onRestoreAsDraft]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — soft scrim so the dashboard underneath stays visible. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[9998] bg-black/15"
            onClick={onClose}
          />
          {/* Sliding panel */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Version history"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-[9999] flex h-full w-[380px] max-w-[92vw] flex-col bg-white shadow-[-12px_0_40px_rgba(0,0,0,0.14),-2px_0_8px_rgba(0,0,0,0.06)]"
          >
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 pb-3 pt-4">
              <ClockCounterClockwiseIcon size={16} className="text-gray-500" />
              <div className="min-w-0 flex-1 text-[14px] font-semibold text-gray-900">
                Version history
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close version history"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <XIcon size={14} />
              </button>
            </div>

            {/* Tabs — labels only, no counts (matches design). */}
            <div className="flex items-end gap-4 border-b border-gray-100 px-4">
              {(
                [
                  { id: "current", label: "Current draft" },
                  { id: "published", label: "Publish history" },
                ] as const
              ).map((t) => {
                const active = t.id === tab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`-mb-px border-b-2 px-0 py-2.5 text-[12.5px] transition-colors cursor-pointer ${
                      active
                        ? "border-gray-900 font-semibold text-gray-900"
                        : "border-transparent font-medium text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {isLoading && rows.length === 0 ? (
                <div className="flex h-full items-center justify-center px-6 py-10 text-[12px] text-gray-400">
                  Loading versions…
                </div>
              ) : rows.length === 0 ? (
                <EmptyState tab={tab} />
              ) : (
                <div className="relative">
                  {/* Vertical spine behind the dots. */}
                  <span
                    aria-hidden
                    className="absolute bottom-3 left-[19px] top-3 w-px bg-gray-100"
                  />
                  <div className="relative flex flex-col gap-0.5">
                    {rows.map((item, index) => (
                      <VersionRow
                        key={item.id}
                        item={item}
                        tab={tab}
                        selected={item.id === selectedId}
                        isCurrentDraftHead={
                          tab === "current" && item.id === activeDraftHeadId
                        }
                        // Only the first published row is "Latest" — lower
                        // rows are archived lineage entries.
                        isLatestPublished={tab === "published" && index === 0}
                        isYou={item.authorId === currentUserId}
                        onSelect={() => setSelectedId(item.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3">
              <div className="flex-1" />
              {selectedRow && !isOnActiveDraftHead && (
                <span className="mr-1 max-w-[180px] text-right text-[11px] leading-snug text-gray-400">
                  Restoring creates a new draft.
                </span>
              )}
              <button
                type="button"
                onClick={handlePrimary}
                disabled={!canAct}
                className={`rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium ${
                  canAct
                    ? "bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {ctaLabel}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
