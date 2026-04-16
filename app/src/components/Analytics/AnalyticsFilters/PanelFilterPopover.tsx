/**
 * PanelFilterPopover — per-widget filter popover (v2).
 *
 * Opens from the funnel icon on a widget header. Lists filters whose
 * `applies_to` includes this panel's query, showing the effective value
 * (dashboard value unless the panel overrides it) and letting the user
 * override values per-panel. Panel-level overrides are stored separately
 * from dashboard state and applied via PATCH with `panel_id`.
 *
 * Locked dashboard filters (set by owner) render read-only.
 * No lock toggle in v1 (see plan §4.4).
 */
import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { FunnelIcon, LockSimpleIcon, XIcon } from "@phosphor-icons/react";
import {
  SplitFilterDropdown,
  usePortalPopover,
} from "@vonlabs/design-components";
import type { FilterBarValue } from "@vonlabs/design-components";
import type { DashboardFilterDefinition } from "../../../types/dashboard";
import type { ActiveFilter } from "../../../hooks/useDashboardFilters";
import {
  fromFilterBarValue,
  mapDefinition,
  renderFilterValue,
  toFilterBarValue,
} from "./filterTranslation";

const POPOVER_WIDTH = 360;

interface PanelFilterPopoverProps {
  panelId: string;
  /**
   * Backend query ID powering this panel. Used to match against filter
   * `applies_to` entries, which reference query IDs (not widget IDs).
   * Falls back to `panelId` when the widget has no queryRef.
   */
  queryRef: string;
  /** Filter definitions from the dashboard (filtered by applies_to externally). */
  definitions: DashboardFilterDefinition[];
  /** Effective state for this panel (post resolution). */
  effectiveState: Record<string, ActiveFilter>;
  /** Dashboard-level locked state — render read-only in popover. */
  lockedFilterState: Record<string, ActiveFilter>;
  /**
   * Panel-level locked state for *this* panel (filterId → locked value).
   * Used to decide whether the row renders with the Lock indicator and
   * whether the SplitFilterDropdown opens read-only for non-owners.
   */
  lockedPanelFilterState?: Record<string, ActiveFilter>;
  /** Panel-local overrides (so we can show a "reset" action when present). */
  panelFilterState: Record<string, ActiveFilter>;
  onPanelFilterChange: (
    panelId: string,
    filterId: string,
    operator: string,
    value?: unknown,
    includeBlank?: boolean,
  ) => void;
  onResetPanelFilter: (panelId: string, filterId: string) => void;
  /**
   * Revert a pending (unapplied) per-panel edit to the last server-
   * committed state. Wired to the nested SplitFilterDropdown's
   * `onDismiss` so closing a single filter dropdown without Apply
   * discards that row's draft.
   */
  onRevertPanelFilter?: (panelId: string, filterId: string) => void;
  /**
   * Revert ALL pending edits for this panel. Fired when the outer
   * Widget Filters popover closes via any path (X button, outside
   * click, Escape) — covers the case where the nested dropdown's own
   * `onDismiss` never fires because the parent unmounts it first.
   */
  onRevertPanel?: (panelId: string) => void;
  /**
   * Commit just one widget-level filter change to the server. PATCH
   * body contains only the affected filter, scoped to this `panelId`.
   * When omitted, the per-filter Apply button is a no-op close.
   */
  onApplyPanelFilter?: (panelId: string, filterId: string) => void;
  /** True when the given panel+filter has a pending commit. */
  canApplyPanelFilter?: (panelId: string, filterId: string) => boolean;
  /**
   * Owner-only. Toggle the per-panel lock for this filter. Wired to
   * each nested SplitFilterDropdown's in-popover Lock button.
   */
  onTogglePanelLock?: (
    panelId: string,
    filterId: string,
    locked: boolean,
  ) => void;
  /** Validity gate for the per-panel Lock button. */
  canLockPanelFilter?: (panelId: string, filterId: string) => boolean;
  /** Pass-through to each nested SplitFilterDropdown's spinner state. */
  isApplying?: boolean;
}

export const PanelFilterPopover: React.FC<PanelFilterPopoverProps> = ({
  panelId,
  queryRef,
  definitions,
  effectiveState,
  lockedFilterState,
  lockedPanelFilterState,
  panelFilterState,
  onPanelFilterChange,
  onResetPanelFilter,
  onRevertPanelFilter,
  onRevertPanel,
  onApplyPanelFilter,
  canApplyPanelFilter,
  onTogglePanelLock,
  canLockPanelFilter,
  isApplying = false,
}) => {
  const { open, hide, toggleVisibility, triggerRef, popoverRef, position } =
    usePortalPopover({ popoverWidth: POPOVER_WIDTH });

  // Revert all pending panel edits when the outer popover closes via any
  // path (X button, outside click, Escape, unmount). The nested
  // SplitFilterDropdown's own `onDismiss` is unreliable here because the
  // parent often unmounts it before its mousedown-outside handler fires.
  // Watching `open` transitioning true → false covers every close path.
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      onRevertPanel?.(panelId);
    }
    prevOpenRef.current = open;
  }, [open, onRevertPanel, panelId]);

  const applicable = useMemo(
    () =>
      definitions.filter(
        (def) => !def.applies_to || def.applies_to.includes(queryRef),
      ),
    [definitions, queryRef],
  );

  const appliedCount = applicable.filter(
    (def) => def.id in effectiveState,
  ).length;

  // Hide the icon only when the dashboard has no filters at all. If filters
  // exist but none of them is wired to this panel via `applies_to`, still
  // render the icon — the popover will surface an empty state so the user
  // understands why there's nothing to override here.
  if (definitions.length === 0) return null;

  const handleBarChange = (
    def: DashboardFilterDefinition,
    barValue: FilterBarValue | null,
  ) => {
    if (!barValue) {
      onResetPanelFilter(panelId, def.id);
      return;
    }
    const { operator, value, includeBlank } = fromFilterBarValue(barValue, def);
    onPanelFilterChange(panelId, def.id, operator, value, includeBlank);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          toggleVisibility();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity relative flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer shrink-0"
        title="Widget filters"
      >
        <FunnelIcon size={14} />
        {appliedCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-gray-100 text-[9px] font-semibold leading-none text-gray-500">
            {appliedCount}
          </span>
        )}
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 9000,
              width: POPOVER_WIDTH,
            }}
            className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-700">
                Widget Filters
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  hide();
                }}
                className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
              >
                <XIcon size={12} />
              </button>
            </div>
            <div className="p-2 flex flex-col gap-1 max-h-[320px] overflow-auto">
              {applicable.length === 0 && (
                <div className="py-4 text-center text-xs text-gray-500">
                  No dashboard filters apply to this widget.
                </div>
              )}
              {applicable.map((def) => {
                const eff = effectiveState[def.id];
                const isDashLocked = def.id in lockedFilterState;
                const isPanelLocked =
                  !!lockedPanelFilterState && def.id in lockedPanelFilterState;
                const hasPanelOverride = def.id in panelFilterState;
                // Signals "this filter carries a widget-level value" — either
                // a pending/saved override or a panel-level lock. Drives the
                // "[Widget]" suffix on the label.
                const isWidgetScoped = hasPanelOverride || isPanelLocked;
                // Render as a static read-only chip only when the filter is
                // dashboard-locked AND has no panel-level lock to toggle.
                // When BOTH are locked, we still render SplitFilterDropdown
                // (in locked mode) so the owner can Unlock the panel-level
                // lock while the dashboard lock stays in place.
                const isDashLockedOnly = isDashLocked && !isPanelLocked;
                const barValue = eff ? toFilterBarValue(eff, def) : null;
                const field = mapDefinition(def);
                return (
                  <div
                    key={def.id}
                    className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg bg-gray-50/40"
                  >
                    <span className="text-[11px] font-medium text-gray-700 whitespace-nowrap shrink-0">
                      {def.label}
                      {isWidgetScoped && (
                        <span className="ml-1 text-[10px] text-gray-400">
                          [Widget]
                        </span>
                      )}
                    </span>
                    {isDashLockedOnly ? (
                      // Dashboard-level lock with no panel lock — fully
                      // read-only in the widget popover. Owner manages the
                      // dashboard lock from the main filter bar, not here.
                      <div className="inline-flex items-center gap-1 h-[26px] px-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200/50 whitespace-nowrap cursor-not-allowed">
                        <LockSimpleIcon
                          size={11}
                          className="text-gray-500 shrink-0"
                        />
                        {renderFilterValue(eff, def)}
                      </div>
                    ) : (
                      <SplitFilterDropdown
                        field={field}
                        value={barValue}
                        onChange={(v) => handleBarChange(def, v)}
                        locked={isPanelLocked}
                        onToggleLock={undefined}
                        canLock={
                          canLockPanelFilter
                            ? canLockPanelFilter(panelId, def.id)
                            : false
                        }
                        onApply={
                          onApplyPanelFilter
                            ? () => onApplyPanelFilter(panelId, def.id)
                            : undefined
                        }
                        canApply={
                          canApplyPanelFilter
                            ? canApplyPanelFilter(panelId, def.id)
                            : true
                        }
                        onClear={() => onResetPanelFilter(panelId, def.id)}
                        onDismiss={
                          onRevertPanelFilter
                            ? () => onRevertPanelFilter(panelId, def.id)
                            : undefined
                        }
                        isApplying={isApplying}
                      >
                        <button
                          className={`inline-flex items-center gap-1 h-[26px] px-2 text-xs rounded-lg border transition-colors ${
                            isPanelLocked
                              ? // Panel-locked chip stays gray for both owner
                                // and non-owner (visual signal: "pinned"), but
                                // the owner gets pointer + hover so it's clear
                                // the chip is still clickable (to open the
                                // popover and hit Unlock).
                                onTogglePanelLock
                                ? "bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100 cursor-pointer"
                                : "bg-gray-50 text-gray-700 border-gray-100 cursor-default"
                              : !barValue
                                ? // Empty state — faint grey bg reinforces
                                  // "no filter selected"
                                  "bg-gray-50/50 text-gray-500 border-gray-100 hover:bg-gray-100/60 cursor-pointer"
                                : "bg-white text-gray-900 shadow-xs border-gray-200/50 hover:bg-gray-50 cursor-pointer"
                          }`}
                        >
                          {isPanelLocked && (
                            <LockSimpleIcon
                              size={11}
                              className="text-gray-500 shrink-0"
                            />
                          )}
                          {barValue
                            ? renderFilterValue(eff, def)
                            : "Select a filter"}
                        </button>
                      </SplitFilterDropdown>
                    )}
                  </div>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
