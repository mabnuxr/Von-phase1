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
import { useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FunnelIcon,
  XIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
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
  /** Filter definitions from the dashboard (filtered by applies_to externally). */
  definitions: DashboardFilterDefinition[];
  /** Effective state for this panel (post resolution). */
  effectiveState: Record<string, ActiveFilter>;
  /** Dashboard-level locked state — render read-only in popover. */
  lockedFilterState: Record<string, ActiveFilter>;
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
}

export const PanelFilterPopover: React.FC<PanelFilterPopoverProps> = ({
  panelId,
  definitions,
  effectiveState,
  lockedFilterState,
  panelFilterState,
  onPanelFilterChange,
  onResetPanelFilter,
}) => {
  const { open, hide, toggleVisibility, triggerRef, popoverRef, position } =
    usePortalPopover({ popoverWidth: POPOVER_WIDTH });

  const applicable = useMemo(
    () =>
      definitions.filter(
        (def) => !def.applies_to || def.applies_to.includes(panelId),
      ),
    [definitions, panelId],
  );

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
        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer shrink-0"
        title="Panel filters"
      >
        <FunnelIcon size={14} />
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
                Panel Filters
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
            <div className="p-3 flex flex-col gap-2 max-h-[320px] overflow-auto">
              {applicable.length === 0 && (
                <div className="py-4 text-center text-xs text-gray-500">
                  No dashboard filters apply to this widget.
                </div>
              )}
              {applicable.map((def) => {
                const eff = effectiveState[def.id];
                const isLocked = def.id in lockedFilterState;
                const hasPanelOverride = def.id in panelFilterState;
                const barValue = eff ? toFilterBarValue(eff, def) : null;
                const field = mapDefinition(def);
                return (
                  <div
                    key={def.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-gray-700 leading-none mb-1">
                        {def.label}
                        {isLocked && (
                          <span className="ml-1.5 text-[10px] text-gray-500">
                            (locked)
                          </span>
                        )}
                      </div>
                      {isLocked ? (
                        <div className="inline-flex items-center h-[26px] px-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200/50 whitespace-nowrap cursor-not-allowed">
                          {renderFilterValue(eff, def)}
                        </div>
                      ) : (
                        <SplitFilterDropdown
                          field={field}
                          value={barValue}
                          onChange={(v) => handleBarChange(def, v)}
                        >
                          <button className="inline-flex items-center gap-1 h-[26px] px-2 text-xs text-gray-900 bg-white rounded-lg shadow-xs border border-gray-200/50 hover:bg-gray-50 transition-colors cursor-pointer">
                            {barValue ? renderFilterValue(eff, def) : "All"}
                          </button>
                        </SplitFilterDropdown>
                      )}
                    </div>
                    {hasPanelOverride && !isLocked && (
                      <button
                        onClick={() => onResetPanelFilter(panelId, def.id)}
                        title="Reset to dashboard value"
                        className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        <ArrowCounterClockwiseIcon size={11} />
                      </button>
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
