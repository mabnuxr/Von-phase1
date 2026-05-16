import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClockCounterClockwiseIcon,
  FileTextIcon,
  XIcon,
} from "@phosphor-icons/react";
import { VersionRow } from "./VersionRow";
import { mapVersionsResponse } from "./mapVersions";
import { useDashboardVersions } from "../../../../hooks/useDashboardVersions";
import { useTeamMembers } from "../../../../hooks/useTeam";
import { useUser } from "../../../../hooks/useUser";
import type { VersionHistoryTab } from "./types";

interface VersionHistoryDrawerProps {
  dashboardId: string;
  isOpen: boolean;
  onClose: () => void;
  /**
   * Currently-previewed `dashboard_version` from the parent. Drives
   * the row highlight directly so the selection always matches what's
   * actually on screen — switching tabs doesn't conjure a fake
   * selection on the new tab's head. `null` means no preview is
   * active and no row should appear selected.
   */
  selectedVersion?: number | null;
  /**
   * Fires when a version is selected — either by an explicit row
   * click or by the one-shot auto-selection that runs on panel open
   * (latest draft when one exists, otherwise the latest published
   * row). Tab switches do **not** fire this; reflecting the actual
   * preview is the parent's job.
   */
  onSelectVersion?: (dashboardVersion: number) => void;
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
        ? "Drafts of latest published version appear here. Switch to Published to browse past versions."
        : "Once you publish a draft, every published version lands here."}
    </div>
  </div>
);

// ─── Panel ───────────────────────────────────────────────────────

/**
 * Version-history side-panel (VON-1282). Designed to be docked at the
 * right edge of the layout — same slot as the chat panel — so the
 * dashboard view width shrinks when the panel opens instead of an
 * overlay covering the canvas. The caller owns the open/close state
 * and the width-animated container chrome; this component is the
 * content (tabs + list) and a close button.
 *
 * Two tabs:
 *   - Current draft : the active draft + `draft_saved` snapshots.
 *   - Published     : the published lineage.
 *
 * Continue-draft / Restore-as-a-draft actions are intentionally absent
 * in v1; the panel is a read-only browser today.
 */
export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  dashboardId,
  isOpen,
  onClose,
  selectedVersion = null,
  onSelectVersion,
}) => {
  const { user } = useUser();
  const { data: teamMembers } = useTeamMembers(user?.tenantId);
  const versionsQuery = useDashboardVersions(dashboardId, { enabled: isOpen });
  const { drafts, publishedVersions } = useMemo(
    () => mapVersionsResponse(versionsQuery.data, teamMembers),
    [versionsQuery.data, teamMembers],
  );

  const [tab, setTab] = useState<VersionHistoryTab>("current");
  const activeDraftHeadId =
    drafts[0]?.kind === "active_draft" ? drafts[0].id : null;

  // Auto-select on panel open: latest draft if any, otherwise the
  // live published row. Fires exactly once per open session — the
  // ref resets when the panel closes so re-opening re-selects (and
  // re-establishes the preview state the parent cleared on close).
  // Also forces the tab to match the auto-selected row so the user
  // lands directly on the row whose preview is rendered — no need
  // to manually switch when the dashboard has no drafts.
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      autoSelectedRef.current = false;
      return;
    }
    if (autoSelectedRef.current) return;
    if (!versionsQuery.data) return;
    const draftHead = drafts[0]?.dashboardVersion;
    const publishedHead = publishedVersions[0]?.dashboardVersion;
    if (draftHead !== undefined) {
      autoSelectedRef.current = true;
      setTab("current");
      onSelectVersion?.(draftHead);
    } else if (publishedHead !== undefined) {
      autoSelectedRef.current = true;
      setTab("published");
      onSelectVersion?.(publishedHead);
    }
  }, [isOpen, versionsQuery.data, drafts, publishedVersions, onSelectVersion]);

  // Esc to dismiss — only while the panel is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const rows = tab === "current" ? drafts : publishedVersions;
  const isLoading = versionsQuery.isLoading;

  return (
    <div
      role="dialog"
      aria-label="Version history"
      className="flex h-full flex-col bg-white"
    >
      {/* Single header row — tabs on the left, close on the right.
          Mirrors the dashboard title row's `py-2.5` + 34px content so
          the bottom border lines up across the seam between the
          dashboard canvas and this panel. The active-tab underline
          is rendered via an absolute span tucked at the row's bottom
          (rather than a `border-b-2` on the button) so the row can
          use `items-center` and still merge the active marker with
          the row's `border-b`. */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 pr-3 py-2.5">
        <div className="flex items-center gap-4">
          {(
            [
              { id: "current", label: "Current draft" },
              { id: "published", label: "Published" },
            ] as const
          ).map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative inline-flex h-[34px] items-center text-[12.5px] transition-colors cursor-pointer ${
                  active
                    ? "font-semibold text-gray-900"
                    : "font-medium text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 right-0 -bottom-[11px] h-0.5 bg-gray-900"
                  />
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close version history"
          className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 cursor-pointer"
        >
          <XIcon size={14} />
        </button>
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
            {/* Vertical spine behind the dots. Position lines up with
                each row's dot center: row's `border` (1px) +
                `px-3` (12px) + half the 8px dot = 17px from the
                relative container's left. */}
            <span
              aria-hidden
              className="absolute bottom-3 left-[17px] top-3 w-px bg-gray-100"
            />
            <div className="relative flex flex-col gap-0.5">
              {rows.map((item, index) => (
                <VersionRow
                  key={item.id}
                  item={item}
                  tab={tab}
                  // Highlight reflects the actual previewed version
                  // (lifted to the page). When the user is on a draft
                  // and switches to the Published tab, no row matches
                  // → no row appears selected. Matches reality.
                  selected={
                    selectedVersion !== null &&
                    item.dashboardVersion === selectedVersion
                  }
                  isCurrentDraftHead={
                    tab === "current" && item.id === activeDraftHeadId
                  }
                  // Only the first published row is "Latest" — lower
                  // rows are archived lineage entries.
                  isLatestPublished={tab === "published" && index === 0}
                  isYou={item.authorId === user?.id}
                  onSelect={() => onSelectVersion?.(item.dashboardVersion)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
