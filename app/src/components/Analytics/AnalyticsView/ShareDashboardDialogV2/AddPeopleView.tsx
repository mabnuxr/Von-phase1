import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  InviteChip,
  PerRowRoleMenu,
  ScopeDataByOwnership,
} from "./components";
import { ROLE_LABEL } from "./constants";
import { ROLES } from "../../../../constants/roles";
import type {
  DataScopeOptionV2,
  DirectoryPersonV2,
  GrantableRoleV2,
  ShareDialogPersonV2,
} from "./types";

interface AddPeopleViewProps {
  /** Tenant directory feeding the suggestions list. */
  directory: DirectoryPersonV2[];
  /** Users already on the access list — rendered dimmed with an "Already shared" tag. */
  existingGrants: ShareDialogPersonV2[];
  /** Caller's role on this dashboard (gates whether Editor is a selectable batch role). */
  myAccessLevel: ShareDialogPersonV2["role"];
  /** Whether the dashboard has a data source that supports row-level ownership. */
  dataScopingAvailable: boolean;
  /** Initial scope-data toggle state (only meaningful when batch role is "viewer"). */
  initialDataScope: DataScopeOptionV2 | null;
  /** Submit handler. Returns once the network call resolves. */
  onSubmit: (
    userIds: string[],
    role: GrantableRoleV2,
    dataScope: DataScopeOptionV2 | null,
  ) => Promise<void> | void;
  onCancel: () => void;
  /** Disable inputs while a submit is in flight. */
  isSubmitting?: boolean;
  /**
   * True once the share mutation succeeded — drives the in-footer
   * "Access updated" pill that replaces the Cancel / Share buttons
   * for the brief hold-open window before the modal dismisses.
   * Surfacing the toast inline (rather than rolling back to the
   * default view first) keeps the success cue anchored to the
   * surface the user just acted on.
   */
  saveSucceeded?: boolean;
  /** Copy rendered inside the success pill — see `saveSucceeded`. */
  saveSuccessLabel?: string;
}

const DEFAULT_SCOPE: DataScopeOptionV2 = "MY_TEAMS_RECORDS";

export const AddPeopleView: React.FC<AddPeopleViewProps> = ({
  directory,
  existingGrants,
  myAccessLevel,
  dataScopingAvailable,
  initialDataScope,
  onSubmit,
  onCancel,
  isSubmitting,
  saveSucceeded = false,
  saveSuccessLabel = "Access updated",
}) => {
  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<DirectoryPersonV2[]>([]);
  const [batchRole, setBatchRole] = useState<GrantableRoleV2>("viewer");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [scopeEnabled, setScopeEnabled] = useState(!!initialDataScope);
  const [scopeValue, setScopeValue] = useState<DataScopeOptionV2>(
    initialDataScope ?? DEFAULT_SCOPE,
  );
  // User-driven suspension of the suggestions dropdown. The base
  // visibility comes from `chips`/`query` state, but a click outside
  // the chip input + dropdown container collapses it until the user
  // re-engages (focuses the input or types).
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-focus the input when the view first mounts — matches the design's
  // "just landed" state where the search field is primed for typing.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Read-only users can only invite at Read-only level (spec §2.4.2, D13).
  const allowEditor = myAccessLevel === "owner" || myAccessLevel === "editor";

  const existingByUser = useMemo(() => {
    const map = new Map<string, ShareDialogPersonV2>();
    for (const g of existingGrants) map.set(g.userId, g);
    return map;
  }, [existingGrants]);

  const selectedIds = useMemo(
    () => new Set(chips.map((c) => c.userId)),
    [chips],
  );

  const trimmedQuery = query.trim().toLowerCase();
  const wouldShowSuggestions = chips.length === 0 || trimmedQuery.length > 0;
  const showSuggestions = wouldShowSuggestions && !suggestionsDismissed;

  // Outside-click handler — dismisses the dropdown when the user
  // clicks anywhere that isn't the chip input bar or the suggestions
  // list itself. Only attaches while the dropdown is visible so we
  // don't churn listeners during normal use.
  useEffect(() => {
    if (!showSuggestions) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (inputContainerRef.current?.contains(target)) return;
      setSuggestionsDismissed(true);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showSuggestions]);
  const suggestions = useMemo(() => {
    if (!showSuggestions) return [];
    const filtered = directory.filter((p) => {
      if (selectedIds.has(p.userId)) return false;
      // Already-shared users don't belong in the "Add people" suggestions
      // — they're already on the access list. Per-row role changes for
      // them happen from the default view's row menu.
      if (existingByUser.has(p.userId)) return false;
      if (!trimmedQuery) return true;
      return (
        p.name.toLowerCase().includes(trimmedQuery) ||
        p.email.toLowerCase().includes(trimmedQuery)
      );
    });
    // Cap the dropdown at a reasonable size; tenant directories can be large.
    return filtered.slice(0, 8);
  }, [directory, selectedIds, existingByUser, trimmedQuery, showSuggestions]);

  // Effective scope toggle — only applies to Read-only batch invites.
  const scopeApplies = batchRole === "viewer" && dataScopingAvailable;
  const effectiveDataScope = scopeApplies && scopeEnabled ? scopeValue : null;

  const canSubmit = chips.length > 0 && !isSubmitting;

  const handleAddChip = (person: DirectoryPersonV2) => {
    if (selectedIds.has(person.userId)) return;
    if (existingByUser.has(person.userId)) return;
    setChips((prev) => [...prev, person]);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleRemoveChip = (userId: string) => {
    setChips((prev) => prev.filter((c) => c.userId !== userId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && query.length === 0 && chips.length > 0) {
      e.preventDefault();
      setChips((prev) => prev.slice(0, -1));
    }
  };

  const handleSend = () => {
    if (!canSubmit) return;
    void onSubmit(
      chips.map((c) => c.userId),
      batchRole,
      effectiveDataScope,
    );
  };

  return (
    <>
      {/* Chip input + batch role pill */}
      <div className="relative" ref={inputContainerRef}>
        <div className="flex items-start gap-2">
          {/* Chip + input field column. The role pill used to live
              inside this wrapper, but the wrap-after-N-chips behaviour
              shoved it down to a new row as more invitees were added.
              Lifting it to a sibling pins it to the top-right edge
              regardless of chip count. */}
          <div
            className="flex min-h-[38px] flex-1 flex-wrap items-center gap-1 rounded-lg border-2 border-blue-500 bg-white px-2 py-1 shadow-[0_0_0_3px_rgba(42,91,255,0.12)]"
            onClick={() => inputRef.current?.focus()}
          >
            {chips.map((c) => (
              <InviteChip
                key={c.userId}
                name={c.name}
                seed={c.userId}
                color={c.colorHex}
                onRemove={() => handleRemoveChip(c.userId)}
                isViewOnly={
                  batchRole === "editor" && c.tenantRole === ROLES.VIEW_ONLY
                }
              />
            ))}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                // Typing re-engages the dropdown after an outside-click
                // dismissal so searching after collapsing it just works.
                if (suggestionsDismissed) setSuggestionsDismissed(false);
              }}
              onFocus={() => {
                if (suggestionsDismissed) setSuggestionsDismissed(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                chips.length === 0 ? "Email or group, separated by commas" : ""
              }
              className="flex-1 min-w-[80px] border-0 bg-transparent py-1 text-[13px] text-gray-900 outline-none placeholder:text-gray-400"
              disabled={isSubmitting}
            />
          </div>
          {/* Batch role pill — pinned to the top-right of the input
              row. `self-start` keeps it aligned with the first line
              of chips even as the chip column grows to multiple rows;
              `mt-[5px]` matches the input field's vertical padding so
              the label visually sits on the same baseline as the
              first row of chips. */}
          <div
            className="relative z-20 mt-[5px] shrink-0 self-start"
            // Clicks on the role pill (or the menu it spawns) must not
            // bubble to the chip-input wrapper's focus-the-input
            // handler — that focus would re-engage the suggestions
            // dropdown the user just dismissed.
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setRoleMenuOpen((v) => !v)}
              className={`inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-[12.5px] text-gray-600 ${
                roleMenuOpen ? "bg-gray-100" : "hover:bg-gray-50"
              } cursor-pointer`}
            >
              <span>{ROLE_LABEL[batchRole]}</span>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {roleMenuOpen && (
              <PerRowRoleMenu
                current={batchRole}
                options={["editor", "viewer"]}
                allowEditor={allowEditor}
                onSelect={(next) => {
                  setBatchRole(next);
                  setRoleMenuOpen(false);
                }}
                onClose={() => setRoleMenuOpen(false)}
              />
            )}
          </div>
        </div>

        {batchRole === "editor" &&
          chips.some((c) => c.tenantRole === ROLES.VIEW_ONLY) && (
            <p className="mt-1 text-[11px] text-red-600">
              Highlighted users are View Only users.
            </p>
          )}

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute left-0 right-0 top-[44px] z-10 max-h-[260px] overflow-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)]">
            {!trimmedQuery && (
              <div className="px-2 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">
                Suggested
              </div>
            )}
            {suggestions.length === 0 && trimmedQuery && (
              <div className="px-2 py-2 text-[12px] text-gray-400">
                No matches for “{query}”
              </div>
            )}
            {suggestions.map((p) => (
              <button
                key={p.userId}
                type="button"
                onClick={() => handleAddChip(p)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-gray-50 cursor-pointer"
              >
                <Avatar
                  name={p.name}
                  seed={p.userId}
                  color={p.colorHex}
                  size={22}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium text-gray-900">
                    {p.name}
                  </div>
                  <div className="truncate text-[11px] text-gray-400">
                    {p.email}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fixed gap between the chip input and the scope toggle. The
          suggestions dropdown floats `absolute` above this region
          (with `z-10`) and overlays whatever sits below — keeping
          the modal at a stable height instead of reflowing 220px
          taller every time the user focuses the input. */}
      <div className="h-3" aria-hidden />

      {/* Scope toggle (or editor notice) */}
      {batchRole === "viewer" ? (
        dataScopingAvailable ? (
          <ScopeDataByOwnership
            enabled={scopeEnabled}
            selected={scopeValue}
            onToggle={setScopeEnabled}
            onSelect={setScopeValue}
          />
        ) : null
      ) : (
        <div className="mt-3 rounded-lg bg-gray-50 px-3.5 py-2.5 text-[12px] leading-snug text-gray-500">
          Editors always see the full underlying data. Switch the role to{" "}
          <span className="font-medium text-gray-700">Read-only</span> to scope
          what they can see.
        </div>
      )}

      {/* Footer: Cancel / Share by default. Once the share succeeds,
          swap in an "Access updated" pill in the same slot so the cue
          is anchored to the surface the user just acted on. Stays
          mounted (rather than rolling back to the default view) for
          the ~2s hold-open window before the modal dismisses. */}
      <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
        {saveSucceeded ? (
          <div className="flex w-full justify-end">
            <div
              className="rounded-md bg-gray-900 px-3 py-1.5 text-[12.5px] font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.18),0_1px_3px_rgba(0,0,0,0.12)]"
              role="status"
              aria-live="polite"
            >
              {saveSuccessLabel}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12.5px] font-medium text-gray-900 hover:bg-gray-50 cursor-pointer disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSubmit}
              className={`rounded-lg px-4 py-2 text-[12.5px] font-medium ${
                canSubmit
                  ? "bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Sharing…" : "Share"}
            </button>
          </>
        )}
      </div>
    </>
  );
};
