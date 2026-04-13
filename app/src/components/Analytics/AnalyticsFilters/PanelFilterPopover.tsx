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
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FunnelIcon, XIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { SplitFilterDropdown } from "@vonlabs/design-components";
import type {
  FilterFieldConfig,
  FilterBarValue,
} from "@vonlabs/design-components";
import type { DashboardFilterDefinition } from "../../../types/dashboard";
import type { ActiveFilter } from "../../../hooks/useDashboardFilters";
import { usePortalPopover } from "@vonlabs/design-components";

const POPOVER_WIDTH = 360;

// ── Shared translation helpers (kept local to this module) ──────

const TOKEN_LABELS: Record<string, string> = {
  TODAY: "Today",
  YESTERDAY: "Yesterday",
  TOMORROW: "Tomorrow",
  THIS_WEEK: "This Week",
  LAST_WEEK: "Last Week",
  NEXT_WEEK: "Next Week",
  THIS_MONTH: "This Month",
  THIS_QUARTER: "This Quarter",
  THIS_FISCAL_QUARTER: "This Fiscal Quarter",
  LAST_QUARTER: "Last Quarter",
  QUARTER_TO_DATE: "Quarter to Date",
  THIS_YEAR: "This Year",
  THIS_FISCAL_YEAR: "This Fiscal Year",
  YEAR_TO_DATE: "Year to Date",
  LAST_7_DAYS: "Last 7 Days",
  LAST_30_DAYS: "Last 30 Days",
  LAST_90_DAYS: "Last 90 Days",
  MY_RECORDS: "My Records",
  MY_TEAMS_RECORDS: "My Team's Records",
  MY_MANAGERS_TEAM: "My Manager's Team",
  ALL_RECORDS: "All Records",
};
const LABEL_TO_TOKEN: Record<string, string> = Object.fromEntries(
  Object.entries(TOKEN_LABELS).map(([t, l]) => [l, t]),
);
const tokenLabel = (v: string) => TOKEN_LABELS[v] ?? v;
const reverseToken = (l: string) => LABEL_TO_TOKEN[l] ?? l;

function mapFieldType(
  type: DashboardFilterDefinition["type"],
): FilterFieldConfig["type"] {
  switch (type) {
    case "picklist":
    case "select":
    case "multi-select":
      return "picklist";
    case "date-range":
      return "date";
    case "range":
      return "number";
    default:
      return "text";
  }
}

function mapDefinition(def: DashboardFilterDefinition): FilterFieldConfig {
  const config: FilterFieldConfig = {
    id: def.id,
    label: def.label,
    type: mapFieldType(def.type),
  };
  if (config.type === "picklist") {
    const raw =
      def.dynamic && def.available_presets?.length
        ? def.available_presets
        : def.options;
    if (raw?.length) config.options = raw.map(tokenLabel);
  }
  // Date Relative-mode presets (non-parameterized + N-parameterized).
  if (config.type === "date" && def.dynamic) {
    if (def.available_presets?.length) {
      config.options = def.available_presets.map(tokenLabel);
    }
    if (def.available_dynamic_options?.length) {
      config.dynamicOptions = def.available_dynamic_options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        defaultN: opt.default_n,
        unit: opt.unit,
      }));
    }
  }
  // Backend is the source of truth for valid operators; semantic_type-based
  // restrictions (e.g. ownership) are already applied server-side.
  if (def.valid_operators?.length) {
    config.customOperators = def.valid_operators.map((op) => ({
      value: op.value,
      label: op.label,
    }));
  }
  return config;
}

function toFilterBarValue(
  filter: ActiveFilter,
  def: DashboardFilterDefinition,
): FilterBarValue {
  const v = filter.value;
  let barValue: string | string[] | undefined;
  if (v === undefined || v === null) barValue = undefined;
  else if (Array.isArray(v)) barValue = v.map((x) => tokenLabel(String(x)));
  else if (typeof v === "string") barValue = def.dynamic ? tokenLabel(v) : v;
  else barValue = String(v);
  return {
    operator: filter.operator,
    ...(barValue !== undefined && { value: barValue }),
    ...(filter.include_blank && { includeBlank: true }),
  };
}

function fromFilterBarValue(
  barValue: FilterBarValue,
  def: DashboardFilterDefinition,
): { operator: string; value?: unknown; includeBlank?: boolean } {
  const v = barValue.value;
  let rawValue: unknown;
  if (v === undefined) rawValue = undefined;
  else if (Array.isArray(v)) rawValue = def.dynamic ? v.map(reverseToken) : v;
  else if (typeof v === "string") rawValue = def.dynamic ? reverseToken(v) : v;
  else rawValue = v;
  return {
    operator: barValue.operator,
    ...(rawValue !== undefined && { value: rawValue }),
    ...(barValue.includeBlank && { includeBlank: true }),
  };
}

// ── Component ───────────────────────────────────────────────────

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
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);

  // Only filters that apply to this panel's widget
  const applicable = useMemo(
    () =>
      definitions.filter(
        (def) => !def.applies_to || def.applies_to.includes(panelId),
      ),
    [definitions, panelId],
  );

  if (applicable.length === 0) return null;

  const activeDef =
    activeFilterId != null
      ? applicable.find((d) => d.id === activeFilterId) ?? null
      : null;

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
                          {renderReadOnly(eff, def)}
                        </div>
                      ) : (
                        <SplitFilterDropdown
                          field={field}
                          value={barValue}
                          onChange={(v) => handleBarChange(def, v)}
                        >
                          <button
                            onClick={() => setActiveFilterId(def.id)}
                            className="inline-flex items-center gap-1 h-[26px] px-2 text-xs text-gray-900 bg-white rounded-lg shadow-xs border border-gray-200/50 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            {barValue ? renderReadOnly(eff, def) : "All"}
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
            {/* activeDef is tracked for potential future UX hook */}
            {activeDef && null}
          </div>,
          document.body,
        )}
    </div>
  );
};

function renderReadOnly(
  filter: ActiveFilter | undefined,
  def: DashboardFilterDefinition,
): string {
  if (!filter) return "All";
  const v = filter.value;
  if (v === undefined || v === null || v === "") return "All";
  if (Array.isArray(v)) {
    if (v.length === 0) return "All";
    const labeled = v.map((x) =>
      def.dynamic ? tokenLabel(String(x)) : String(x),
    );
    if (labeled.length > 2)
      return `${labeled.slice(0, 2).join(", ")} +${labeled.length - 2}`;
    return labeled.join(", ");
  }
  if (typeof v === "string") return def.dynamic ? tokenLabel(v) : v;
  return String(v);
}
