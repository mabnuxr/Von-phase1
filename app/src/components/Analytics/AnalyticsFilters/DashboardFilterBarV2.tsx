/**
 * DashboardFilterBarV2 — v2 filter UI adapter.
 *
 * Wires the design-system ScrollableFilterBar + SplitFilterDropdown to the
 * useDashboardFilters hook v2 state. Translates between backend filter shapes
 * (snake_case, typed operators) and the bar's controlled value model.
 *
 * Behavior:
 * - Each SplitFilterDropdown change updates local hook state (no PATCH).
 * - Apply / Clear buttons sit at the end of the bar, visible when dirty / active.
 * - Locked filters render as read-only chips for non-owners.
 * - Dynamic date filters show a preset list; ownership filter shows viewer-scoped options.
 */
import { useMemo } from "react";
import { LockSimpleIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { ScrollableFilterBar, Tooltip } from "@vonlabs/design-components";
import type {
  FilterFieldConfig,
  FilterBarValue,
  FieldType,
} from "@vonlabs/design-components";
import type {
  DashboardFilterDefinition,
  DashboardFilterType,
} from "../../../types/dashboard";
import type { ActiveFilter } from "../../../hooks/useDashboardFilters";

// ── Token labels ────────────────────────────────────────────────

const TOKEN_LABELS: Record<string, string> = {
  // Date tokens
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
  // Ownership tokens
  MY_RECORDS: "My Records",
  MY_TEAMS_RECORDS: "My Team's Records",
  MY_MANAGERS_TEAM: "My Manager's Team",
  ALL_RECORDS: "All Records",
};

function tokenLabel(value: string): string {
  return TOKEN_LABELS[value] ?? value;
}

// ── Type mapping ────────────────────────────────────────────────

function mapFieldType(type: DashboardFilterType): FieldType {
  switch (type) {
    case "picklist":
    case "select":
    case "multi-select":
      return "picklist";
    case "date-range":
      return "date";
    case "range":
      return "number";
    case "search":
    default:
      return "text";
  }
}

// ── Definition → FilterFieldConfig ──────────────────────────────

function formatResolved(resolved: unknown): string | null {
  if (resolved === undefined || resolved === null) return null;
  if (Array.isArray(resolved)) {
    const [a, b] = resolved as unknown[];
    // Use nullish + empty-string checks instead of truthiness so valid
    // falsy values (0, "") aren't silently dropped.
    const aPresent = a !== undefined && a !== null && a !== "";
    const bPresent = b !== undefined && b !== null && b !== "";
    if (aPresent && bPresent) return `${String(a)} → ${String(b)}`;
    if (aPresent) return `From ${String(a)}`;
    if (bPresent) return `Through ${String(b)}`;
    return null;
  }
  if (typeof resolved === "string") return resolved;
  return String(resolved);
}

function mapDefinition(
  def: DashboardFilterDefinition,
  currentFilter?: ActiveFilter,
): FilterFieldConfig {
  const type = mapFieldType(def.type);
  const config: FilterFieldConfig = {
    id: def.id,
    label: def.label,
    type,
  };

  // Picklist options: for dynamic filters prefer available_presets over static options
  if (type === "picklist") {
    const rawOptions =
      def.dynamic && def.available_presets?.length
        ? def.available_presets
        : def.options;
    if (rawOptions?.length) {
      // Keep raw tokens as values (server expects tokens back); labels applied via tokenLabel in chip.
      config.options = rawOptions.map((opt) => tokenLabel(opt));
    }
  }

  // Date filter Relative-mode options. Non-parameterized presets become `options`
  // (labels humanized via tokenLabel; reverseToken() in fromFilterBarValue flips
  // them back to raw tokens for the API payload). Parameterized tokens become
  // `dynamicOptions` so SplitFilterDropdown renders the inline N input.
  if (type === "date" && def.dynamic) {
    if (def.available_presets?.length) {
      config.options = def.available_presets.map((opt) => tokenLabel(opt));
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

  // Tooltip: combine boundary description + resolved-value hint for dynamic tokens
  const tooltipParts: string[] = [];
  if (def.boundary_description) tooltipParts.push(def.boundary_description);
  if (def.dynamic && currentFilter?.resolved_value !== undefined) {
    const resolved = formatResolved(currentFilter.resolved_value);
    if (resolved) tooltipParts.push(`Resolves to: ${resolved}`);
  }
  if (tooltipParts.length > 0) config.tooltip = tooltipParts.join(" · ");

  // Operator set — backend is the source of truth. Ownership / other semantic
  // restrictions are already applied in `valid_operators`.
  if (def.valid_operators?.length) {
    config.customOperators = def.valid_operators.map((op) => ({
      value: op.value,
      label: op.label,
    }));
  }

  return config;
}

// ── State translation ───────────────────────────────────────────

/**
 * Convert backend ActiveFilter (operator + value + include_blank) → bar FilterBarValue.
 * Translates raw tokens to human labels so the UI reads correctly.
 * The reverse translation happens in toActiveFilter().
 */
function toFilterBarValue(
  filter: ActiveFilter,
  def: DashboardFilterDefinition,
): FilterBarValue {
  const v = filter.value;
  let barValue: string | string[] | undefined;
  if (v === undefined || v === null) {
    barValue = undefined;
  } else if (Array.isArray(v)) {
    barValue = v.map((x) => tokenLabel(String(x)));
  } else if (typeof v === "string") {
    barValue = def.dynamic ? tokenLabel(v) : v;
  } else {
    barValue = String(v);
  }
  return {
    operator: filter.operator,
    ...(barValue !== undefined && { value: barValue }),
    ...(filter.include_blank && { includeBlank: true }),
  };
}

/**
 * Reverse label → token lookup (for values coming back from the bar).
 */
const LABEL_TO_TOKEN: Record<string, string> = Object.fromEntries(
  Object.entries(TOKEN_LABELS).map(([token, label]) => [label, token]),
);

function reverseToken(label: string): string {
  return LABEL_TO_TOKEN[label] ?? label;
}

function fromFilterBarValue(
  barValue: FilterBarValue,
  def: DashboardFilterDefinition,
): { operator: string; value?: unknown; includeBlank?: boolean } {
  const v = barValue.value;
  let rawValue: unknown;
  if (v === undefined) {
    rawValue = undefined;
  } else if (Array.isArray(v)) {
    rawValue = def.dynamic ? v.map(reverseToken) : v;
  } else if (typeof v === "string") {
    rawValue = def.dynamic ? reverseToken(v) : v;
  } else {
    rawValue = v;
  }
  return {
    operator: barValue.operator,
    ...(rawValue !== undefined && { value: rawValue }),
    ...(barValue.includeBlank && { includeBlank: true }),
  };
}

// ── Component ───────────────────────────────────────────────────

interface DashboardFilterBarV2Props {
  definitions: DashboardFilterDefinition[];
  filterState: Record<string, ActiveFilter>;
  activeCount: number;
  canApply: boolean;
  isApplying: boolean;
  isOwner: boolean;
  onFilterChange: (
    filterId: string,
    operator: string,
    value?: unknown,
    includeBlank?: boolean,
  ) => void;
  onRemoveFilter: (filterId: string) => void;
  onApply: () => void;
  onClearAll: () => void;
}

export const DashboardFilterBarV2: React.FC<DashboardFilterBarV2Props> = ({
  definitions,
  filterState,
  activeCount,
  canApply,
  isApplying,
  isOwner,
  onFilterChange,
  onRemoveFilter,
  onApply,
  onClearAll,
}) => {
  // Split editable vs locked-for-viewer
  const { editableDefs, lockedDefs } = useMemo(() => {
    const editable: DashboardFilterDefinition[] = [];
    const locked: DashboardFilterDefinition[] = [];
    for (const def of definitions) {
      if (def.is_locked && !isOwner) locked.push(def);
      else editable.push(def);
    }
    return { editableDefs: editable, lockedDefs: locked };
  }, [definitions, isOwner]);

  const fields = useMemo(
    () => editableDefs.map((def) => mapDefinition(def, filterState[def.id])),
    [editableDefs, filterState],
  );

  const values = useMemo(() => {
    const out: Record<string, FilterBarValue> = {};
    for (const def of editableDefs) {
      const f = filterState[def.id];
      if (f) out[def.id] = toFilterBarValue(f, def);
    }
    return out;
  }, [editableDefs, filterState]);

  const defById = useMemo(() => {
    const map = new Map<string, DashboardFilterDefinition>();
    for (const def of definitions) map.set(def.id, def);
    return map;
  }, [definitions]);

  const handleBarChange = (
    fieldId: string,
    barValue: FilterBarValue | null,
  ) => {
    const def = defById.get(fieldId);
    if (!def) return;
    if (barValue === null) {
      onRemoveFilter(fieldId);
      return;
    }
    const { operator, value, includeBlank } = fromFilterBarValue(barValue, def);
    onFilterChange(fieldId, operator, value, includeBlank);
  };

  return (
    <div className="flex items-center gap-2 min-w-0 max-w-full">
      {/* Locked chips — read-only, rendered before the scrollable bar */}
      {lockedDefs.map((def) => {
        const f = filterState[def.id];
        const label = f ? renderLockedValue(f, def) : "—";
        return (
          <Tooltip
            key={def.id}
            content={
              def.boundary_description
                ? `Locked by dashboard owner · ${def.boundary_description}`
                : "Locked by dashboard owner"
            }
          >
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[11px] text-gray-700 leading-none pl-0.5">
                {def.label}
              </span>
              <div className="flex items-center gap-1.5 h-[28px] px-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200/50 whitespace-nowrap cursor-not-allowed">
                <LockSimpleIcon size={11} className="text-gray-500" />
                {label}
              </div>
            </div>
          </Tooltip>
        );
      })}

      {/* Editable filters */}
      <ScrollableFilterBar
        fields={fields}
        values={values}
        onFilterChange={handleBarChange}
      />

      {/* Apply / Clear cluster */}
      {(canApply || activeCount > 0) && (
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          {canApply && (
            <button
              onClick={onApply}
              disabled={isApplying}
              className="inline-flex items-center gap-1.5 h-[28px] px-2.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {isApplying && (
                <SpinnerGapIcon size={11} className="animate-spin" />
              )}
              Apply
            </button>
          )}
          {activeCount > 0 && !isApplying && (
            <button
              onClick={onClearAll}
              className="text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

function renderLockedValue(
  filter: ActiveFilter,
  def: DashboardFilterDefinition,
): string {
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
