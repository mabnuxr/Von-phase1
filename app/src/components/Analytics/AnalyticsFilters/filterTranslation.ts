/**
 * Shared translation helpers between the backend filter shape
 * (`DashboardFilterDefinition` / `ActiveFilter`) and the design-system
 * filter-bar shape (`FilterFieldConfig` / `FilterBarValue`).
 *
 * Extracted from `DashboardFilterBarV2` and `PanelFilterPopover` so the
 * token-label round-trip, operator mapping, and value rendering stay in
 * one place.
 */
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

// ── Token labels (dynamic date + ownership tokens) ──────────────────

export const TOKEN_LABELS: Record<string, string> = {
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

const LABEL_TO_TOKEN: Record<string, string> = Object.fromEntries(
  Object.entries(TOKEN_LABELS).map(([token, label]) => [label, token]),
);

export const tokenLabel = (value: string): string =>
  TOKEN_LABELS[value] ?? value;

export const reverseToken = (label: string): string =>
  LABEL_TO_TOKEN[label] ?? label;

// ── Structural type mapping ─────────────────────────────────────────

export function mapFieldType(type: DashboardFilterType): FieldType {
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

// ── Definition → FilterFieldConfig ──────────────────────────────────

export interface MapDefinitionOptions {
  /** Active filter value — lets us surface `resolved_value` in the tooltip. */
  currentFilter?: ActiveFilter;
}

export function mapDefinition(
  def: DashboardFilterDefinition,
  { currentFilter }: MapDefinitionOptions = {},
): FilterFieldConfig {
  const type = mapFieldType(def.type);
  const config: FilterFieldConfig = { id: def.id, label: def.label, type };

  // Picklist options: dynamic filters prefer available_presets over static options.
  if (type === "picklist") {
    const rawOptions =
      def.dynamic && def.available_presets?.length
        ? def.available_presets
        : def.options;
    if (rawOptions?.length) {
      config.options = rawOptions.map((opt) => tokenLabel(opt));
    }
  }

  // Date filter Relative-mode options — non-parameterized presets become
  // `options`; parameterized tokens (LAST_N_DAYS, …) become `dynamicOptions`
  // so the dropdown renders an inline N input.
  if (type === "date" && def.dynamic) {
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

  // Tooltip: combine boundary description + resolved-value hint for dynamic tokens.
  const tooltipParts: string[] = [];
  if (def.boundary_description) tooltipParts.push(def.boundary_description);
  if (def.dynamic && currentFilter?.resolved_value !== undefined) {
    const resolved = formatResolved(currentFilter.resolved_value);
    if (resolved) tooltipParts.push(`Resolves to: ${resolved}`);
  }
  if (tooltipParts.length > 0) config.tooltip = tooltipParts.join(" · ");

  // Operator set — backend is the source of truth. Semantic restrictions
  // (e.g. ownership → equals/not_equals/in/not_in only) are server-side.
  if (def.valid_operators?.length) {
    config.customOperators = def.valid_operators.map((op) => ({
      value: op.value,
      label: op.label,
    }));
  }

  return config;
}

// ── State <-> bar value translation ─────────────────────────────────

export function toFilterBarValue(
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

export function fromFilterBarValue(
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

// ── Read-only value rendering ───────────────────────────────────────

/**
 * Format an active filter's value as a short display string (used by
 * both the locked-filter chip in the main bar and the per-panel popover
 * when a dashboard-locked filter is shown read-only).
 */
export function renderFilterValue(
  filter: ActiveFilter | undefined,
  def: DashboardFilterDefinition,
  fallback = "All",
): string {
  if (!filter) return fallback;
  const v = filter.value;
  if (v === undefined || v === null || v === "") return fallback;
  if (Array.isArray(v)) {
    if (v.length === 0) return fallback;
    const labeled = v.map((x) =>
      def.dynamic ? tokenLabel(String(x)) : String(x),
    );
    if (labeled.length > 2) {
      return `${labeled.slice(0, 2).join(", ")} +${labeled.length - 2}`;
    }
    return labeled.join(", ");
  }
  if (typeof v === "string") return def.dynamic ? tokenLabel(v) : v;
  return String(v);
}

// ── Resolved-value formatter (for dynamic-token tooltip) ────────────

export function formatResolved(resolved: unknown): string | null {
  if (resolved === undefined || resolved === null) return null;
  if (Array.isArray(resolved)) {
    const [a, b] = resolved as unknown[];
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
