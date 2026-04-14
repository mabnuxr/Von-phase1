/**
 * Shared translation helpers between the backend filter shape
 * (`DashboardFilterDefinition` / `ActiveFilter`) and the design-system
 * filter-bar shape (`FilterFieldConfig` / `FilterBarValue`).
 */
import type {
  FilterFieldConfig,
  FilterBarValue,
  FieldType,
  OptionGroup,
} from "@vonlabs/design-components";
import type {
  DashboardFilterDefinition,
  DashboardFilterType,
} from "../../../types/dashboard";
import type { ActiveFilter } from "../../../hooks/useDashboardFilters";

// ── Token labels — non-parameterized tokens only ────────────────────
//
// Backend sends uppercase tokens (THIS_QUARTER, MY_RECORDS); the bar
// displays the camel/Title-Case label. `reverseToken` translates back
// on payload construction.

export const TOKEN_LABELS: Record<string, string> = {
  // Day tokens
  TODAY: "Today",
  YESTERDAY: "Yesterday",
  TOMORROW: "Tomorrow",
  // Week tokens
  THIS_WEEK: "This Week",
  LAST_WEEK: "Last Week",
  NEXT_WEEK: "Next Week",
  // Month tokens
  THIS_MONTH: "This Month",
  LAST_MONTH: "Last Month",
  NEXT_MONTH: "Next Month",
  // Quarter tokens
  THIS_QUARTER: "This Quarter",
  LAST_QUARTER: "Last Quarter",
  NEXT_QUARTER: "Next Quarter",
  // Fiscal quarter tokens
  THIS_FISCAL_QUARTER: "This Fiscal Quarter",
  LAST_FISCAL_QUARTER: "Last Fiscal Quarter",
  NEXT_FISCAL_QUARTER: "Next Fiscal Quarter",
  // Year tokens
  THIS_YEAR: "This Year",
  LAST_YEAR: "Last Year",
  NEXT_YEAR: "Next Year",
  // Fiscal year tokens
  THIS_FISCAL_YEAR: "This Fiscal Year",
  LAST_FISCAL_YEAR: "Last Fiscal Year",
  NEXT_FISCAL_YEAR: "Next Fiscal Year",
  // *-to-date tokens
  QUARTER_TO_DATE: "Quarter-to-Date",
  YEAR_TO_DATE: "Year-to-Date",
  FISCAL_YEAR_TO_DATE: "Fiscal Year-to-Date",
  // Rolling N-day tokens (non-parameterized shortcuts)
  LAST_7_DAYS: "Last 7 Days",
  LAST_30_DAYS: "Last 30 Days",
  LAST_60_DAYS: "Last 60 Days",
  LAST_90_DAYS: "Last 90 Days",
  LAST_180_DAYS: "Last 180 Days",
  LAST_365_DAYS: "Last 365 Days",
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

// ── Parameterized token formatting ──────────────────────────────────
//
// Dynamic N-tokens are serialised on the wire as "ID:N" (e.g.
// "NEXT_N_DAYS:7"). The backend sends human templates in
// `available_dynamic_options[].label` like "Next N days" with a
// literal `N` placeholder. Format by substituting the number in.

const DYNAMIC_N_RE = /^([A-Za-z_]+):(\d+)$/;

/**
 * Format a wire-format dynamic N-token ("NEXT_N_DAYS:7") to a display
 * string using the filter definition's labels. Falls back to a
 * title-cased version of the id when no definition is passed (e.g.
 * "Next 7 days" ← best-effort from "NEXT_N_DAYS:7").
 */
export function formatDynamicNValue(
  value: string,
  def?: { available_dynamic_options?: { id: string; label: string }[] },
): string | null {
  const m = value.match(DYNAMIC_N_RE);
  if (!m) return null;
  const [, id, nStr] = m;
  const opt = def?.available_dynamic_options?.find((o) => o.id === id);
  if (opt) {
    // Replace the literal word "N" in the backend template with the number.
    return opt.label.replace(/\bN\b/, nStr);
  }
  // Best-effort fallback: "NEXT_N_DAYS" → "Next 7 days"
  const words = id.toLowerCase().split("_");
  return words
    .map((w) => (w === "n" ? nStr : w))
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}

// ── Calendar-value round-trip ───────────────────────────────────────
//
// The design-system SplitFilterDropdown serialises calendar picks as
// `custom_date:YYYY-MM-DD` and `custom_range:YYYY-MM-DD_YYYY-MM-DD`.
// These pass through the translation layer unchanged — the backend
// dynamic resolver is not expected to interpret them; instead the
// client treats them as literal dates at PATCH time (see below).

const CUSTOM_DATE_RE = /^custom_date:(\d{4}-\d{2}-\d{2})$/;
const CUSTOM_RANGE_RE =
  /^custom_range:(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/;

function isCalendarSerialised(v: string): boolean {
  return CUSTOM_DATE_RE.test(v) || CUSTOM_RANGE_RE.test(v);
}

// ── Structural type mapping ─────────────────────────────────────────

export function mapFieldType(type: DashboardFilterType): FieldType {
  switch (type) {
    case "picklist":
    case "select":
    case "multi-select":
      return "picklist";
    case "date":
    case "date-range":
      return "date";
    case "number":
    case "range":
      return "number";
    case "text":
    case "search":
    default:
      return "text";
  }
}

// ── Date filter option groups (spec §3.2.2 Tier 1 + Tier 2) ─────────
//
// The dashboard filter spec calls for full SFDC parity on time-based
// dynamic filters. The backend's `available_presets` enumerates the
// non-parameterized tokens it can resolve; `available_dynamic_options`
// carries the N-parameterized ones. Backend is the source of truth —
// we only render what it advertises, grouped into spec tiers here
// (until the backend starts grouping them) so the dropdown shows
// titled sections like "Days", "Weeks", etc.

/** Subset of `available_presets` that belongs in a named group. */
const DATE_GROUP_PRESETS: Record<string, string[]> = {
  // Tier 1 (flat, no title)
  __TIER1__: [
    "TODAY",
    "THIS_WEEK",
    "THIS_MONTH",
    "THIS_QUARTER",
    "THIS_FISCAL_QUARTER",
    "THIS_YEAR",
    "THIS_FISCAL_YEAR",
    "LAST_QUARTER",
    "QUARTER_TO_DATE",
    "YEAR_TO_DATE",
    "LAST_7_DAYS",
    "LAST_30_DAYS",
    "LAST_90_DAYS",
  ],
  Days: ["YESTERDAY", "TOMORROW"],
  Weeks: ["LAST_WEEK", "NEXT_WEEK"],
  Months: ["LAST_MONTH", "NEXT_MONTH"],
  Quarters: ["NEXT_QUARTER"],
  "Fiscal Quarters": ["LAST_FISCAL_QUARTER", "NEXT_FISCAL_QUARTER"],
  Years: ["LAST_YEAR", "NEXT_YEAR"],
  "Fiscal Years": ["LAST_FISCAL_YEAR", "NEXT_FISCAL_YEAR"],
};

/** Bucket of dynamic options (`available_dynamic_options`) per group. */
const DATE_GROUP_DYNAMIC_PREFIXES: Record<string, string[]> = {
  Days: ["LAST_N_DAYS", "NEXT_N_DAYS", "N_DAYS_AGO"],
  Weeks: ["LAST_N_WEEKS", "NEXT_N_WEEKS", "N_WEEKS_AGO"],
  Months: ["LAST_N_MONTHS", "NEXT_N_MONTHS", "N_MONTHS_AGO"],
  Quarters: ["LAST_N_QUARTERS", "NEXT_N_QUARTERS", "N_QUARTERS_AGO"],
  "Fiscal Quarters": [
    "LAST_N_FISCAL_QUARTERS",
    "NEXT_N_FISCAL_QUARTERS",
    "N_FISCAL_QUARTERS_AGO",
  ],
  Years: ["LAST_N_YEARS", "NEXT_N_YEARS", "N_YEARS_AGO"],
  "Fiscal Years": [
    "LAST_N_FISCAL_YEARS",
    "NEXT_N_FISCAL_YEARS",
    "N_FISCAL_YEARS_AGO",
  ],
};

const CUSTOM_DATE_LABEL = "Custom Date";
const CUSTOM_RANGE_LABEL = "Custom Range";

// ── Operator-aware applicability for date tokens ────────────────────
//
// Date operators split into two families:
//   - Single-date operators (equals/on/not_equals/before/after/
//     on_or_before/on_or_after) take a single date. Point tokens
//     (TODAY, YESTERDAY, N_DAYS_AGO) and Custom Date all resolve to
//     one date. Range tokens (THIS_QUARTER, LAST_N_DAYS, …) resolve
//     to a boundary of the range (backend's dynamic_resolver picks
//     start vs end per operator).
//   - Range operators (between/not_between) take two dates. Range
//     tokens expand to [start, end]; Custom Range supplies two dates
//     directly. Point tokens and Custom Date don't fit — hide them.

const SINGLE_DATE_OPERATORS = [
  "equals",
  "on",
  "not_equals",
  "before",
  "after",
  "on_or_before",
  "on_or_after",
];
const RANGE_DATE_OPERATORS = ["between", "not_between"];

/** Tokens that resolve to a single point in time (not a range). */
const POINT_TOKENS = new Set(["TODAY", "YESTERDAY", "TOMORROW"]);
/** Dynamic-option ids that resolve to a single point. */
const POINT_DYNAMIC_IDS = new Set(["N_DAYS_AGO"]);

function buildDateOptionGroups(def: DashboardFilterDefinition): OptionGroup[] {
  const presets = new Set(def.available_presets ?? []);
  const dynOpts = def.available_dynamic_options ?? [];

  const groups: OptionGroup[] = [];

  // Tier 1 — no title, always first
  const tier1Options: string[] = [];
  const tier1Applicability: Record<string, string[]> = {};
  for (const token of DATE_GROUP_PRESETS.__TIER1__) {
    if (!presets.has(token)) continue;
    const label = tokenLabel(token);
    tier1Options.push(label);
    if (POINT_TOKENS.has(token)) {
      tier1Applicability[label] = SINGLE_DATE_OPERATORS;
    }
    // Range tokens stay visible on all date operators — no entry means
    // "always applicable".
  }
  // Custom Date / Custom Range trigger the calendar panel. Each is only
  // meaningful for one operator family.
  tier1Options.push(CUSTOM_DATE_LABEL, CUSTOM_RANGE_LABEL);
  tier1Applicability[CUSTOM_DATE_LABEL] = SINGLE_DATE_OPERATORS;
  tier1Applicability[CUSTOM_RANGE_LABEL] = RANGE_DATE_OPERATORS;
  if (tier1Options.length > 0) {
    groups.push({
      options: tier1Options,
      optionApplicability: tier1Applicability,
    });
  }

  // Titled tiers — only include a tier if it has at least one option the
  // backend actually supports.
  for (const [title, groupPresets] of Object.entries(DATE_GROUP_PRESETS)) {
    if (title === "__TIER1__") continue;
    const titledOptions: string[] = [];
    const optApplicability: Record<string, string[]> = {};
    for (const t of groupPresets) {
      if (!presets.has(t)) continue;
      const label = tokenLabel(t);
      titledOptions.push(label);
      if (POINT_TOKENS.has(t)) {
        optApplicability[label] = SINGLE_DATE_OPERATORS;
      }
    }
    const prefixes = DATE_GROUP_DYNAMIC_PREFIXES[title] ?? [];
    const titledDynamic = dynOpts
      .filter((opt) => prefixes.includes(opt.id))
      .map((opt) => ({
        id: opt.id,
        label: opt.label,
        defaultN: opt.default_n,
        unit: opt.unit,
      }));
    const dynApplicability: Record<string, string[]> = {};
    for (const d of titledDynamic) {
      if (POINT_DYNAMIC_IDS.has(d.id)) {
        dynApplicability[d.id] = SINGLE_DATE_OPERATORS;
      }
    }
    if (titledOptions.length === 0 && titledDynamic.length === 0) continue;
    groups.push({
      title,
      ...(titledOptions.length > 0 && { options: titledOptions }),
      ...(titledDynamic.length > 0 && { dynamicOptions: titledDynamic }),
      ...(Object.keys(optApplicability).length > 0 && {
        optionApplicability: optApplicability,
      }),
      ...(Object.keys(dynApplicability).length > 0 && {
        dynamicOptionApplicability: dynApplicability,
      }),
    });
  }

  return groups;
}

// ── Definition → FilterFieldConfig ──────────────────────────────────

export interface MapDefinitionOptions {
  /** Active filter value — lets us surface `resolved_value` in the tooltip. */
  currentFilter?: ActiveFilter;
  /** Render as locked (read-only) — typically `def.is_locked` for non-owners. */
  locked?: boolean;
  /** Owner-only: clicking the in-popover lock toggle flips server-side state. */
  onToggleLock?: () => void;
  /**
   * Whether the Lock button can be clicked right now. Ignored when the
   * filter is already locked (Unlock is always allowed). Passed through to
   * `FilterFieldConfig.canLock` so the design-system button knows to
   * disable itself when the filter has no value yet.
   */
  canLock?: boolean;
}

export function mapDefinition(
  def: DashboardFilterDefinition,
  { currentFilter, locked, onToggleLock, canLock }: MapDefinitionOptions = {},
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

  // Date filter: use grouped presets (Tier 1 + Tier 2) + calendar panels
  // for Custom Date / Custom Range. The dropdown auto-renders the calendar
  // when the matching option is checked.
  if (type === "date" && def.dynamic) {
    const groups = buildDateOptionGroups(def);
    if (groups.length > 0) {
      config.optionGroups = groups;
      config.calendarOptions = {
        singleDateLabel: CUSTOM_DATE_LABEL,
        dateRangeLabel: CUSTOM_RANGE_LABEL,
      };
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
    // Backend sends `{value, label}` only — infer the `noValue` flag for
    // the operators that don't take a value (is_blank / is_not_blank) so
    // the dropdown can hide the right panel.
    config.customOperators = def.valid_operators.map((op) => ({
      value: op.value,
      label: op.label,
      ...(NO_VALUE_OPERATORS.has(op.value) && { noValue: true }),
    }));
  }

  // Boundary on the calendar: derive min/max ISO dates from the extraction
  // boundary. Covers `on_or_after` (min) and `on_or_before` (max) — the
  // typical shapes the agent emits. Other shapes fall through unclamped.
  if (type === "date" && def.boundary) {
    const op = def.boundary.operator;
    const raw = def.boundary.value;
    if (typeof raw === "string") {
      if (op === "on_or_after") config.boundary = { minDate: raw };
      else if (op === "on_or_before") config.boundary = { maxDate: raw };
    } else if (Array.isArray(raw) && raw.length === 2) {
      const [a, b] = raw as unknown[];
      if (typeof a === "string" && typeof b === "string") {
        config.boundary = { minDate: a, maxDate: b };
      }
    }
  }

  // Per-filter lock state (our design — not Aniket's bar-wide lock).
  if (locked) config.locked = true;
  if (onToggleLock) config.onToggleLock = onToggleLock;
  if (canLock !== undefined) config.canLock = canLock;

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
    // Only translate tokens on dynamic filters — mirrors the scalar branch
    // below and the reverse function `fromFilterBarValue`. Without this
    // guard, a non-dynamic picklist whose value happens to equal a token
    // label key (e.g. "TODAY", "MY_RECORDS") would be mangled on the way
    // into the bar and not reverse-translated on the way back, corrupting
    // the value sent to the server.
    barValue = v.map((x) => {
      const s = String(x);
      if (isCalendarSerialised(s)) return s;
      return def.dynamic ? (tokenLabel(s) ?? s) : s;
    });
  } else if (typeof v === "string") {
    if (isCalendarSerialised(v)) barValue = v;
    else barValue = def.dynamic ? (tokenLabel(v) ?? v) : v;
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
    rawValue = def.dynamic
      ? v.map((x) => {
          if (CUSTOM_DATE_RE.test(x)) return x.replace("custom_date:", "");
          if (isCalendarSerialised(x)) return x; // shouldn't happen in arrays, but safe
          return reverseToken(x);
        })
      : v;
  } else if (typeof v === "string") {
    // Convert calendar-serialised tokens to the format the backend expects:
    // custom_date:YYYY-MM-DD → bare date string
    // custom_range:YYYY-MM-DD_YYYY-MM-DD → [start, end] array
    const rangeMatch = v.match(CUSTOM_RANGE_RE);
    if (rangeMatch) rawValue = [rangeMatch[1], rangeMatch[2]];
    else if (CUSTOM_DATE_RE.test(v)) rawValue = v.replace("custom_date:", "");
    else rawValue = def.dynamic ? reverseToken(v) : v;
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

/** Format a `custom_date:…` / `custom_range:…` token as a human label. */
function formatCalendarSerialised(v: string): string | null {
  const singleMatch = v.match(CUSTOM_DATE_RE);
  if (singleMatch) {
    const d = new Date(singleMatch[1] + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const rangeMatch = v.match(CUSTOM_RANGE_RE);
  if (rangeMatch) {
    const from = new Date(rangeMatch[1] + "T00:00:00");
    const to = new Date(rangeMatch[2] + "T00:00:00");
    const fromStr = from.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const toStr = to.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${fromStr} – ${toStr}`;
  }
  return null;
}

/** Operators that don't take a value — the chip shows the operator label. */
const NO_VALUE_OPERATORS = new Set(["is_blank", "is_not_blank"]);

export function renderFilterValue(
  filter: ActiveFilter | undefined,
  def: DashboardFilterDefinition,
  fallback = "All",
): string {
  if (!filter) return fallback;
  const v = filter.value;
  const opDef = def.valid_operators?.find((o) => o.value === filter.operator);
  const opLabel = opDef?.label ?? filter.operator;
  // No-value operators (is_blank / is_not_blank) — show the operator
  // label on the chip rather than "All", matching the dashboard filter bar.
  if (NO_VALUE_OPERATORS.has(filter.operator)) {
    return opLabel;
  }
  if (v === undefined || v === null || v === "") return fallback;
  const formatOne = (x: unknown): string => {
    const s = String(x);
    return (
      formatCalendarSerialised(s) ??
      formatDynamicNValue(s, def) ??
      (def.dynamic ? tokenLabel(s) : s)
    );
  };
  // Value present — render as "operator: value" so the widget chip shows
  // the same shape as the dashboard filter bar ("Is: Next 7 days",
  // "One of: A, B, +3", "Between: 2025-01-01 – 2025-12-31", …).
  if (Array.isArray(v)) {
    if (v.length === 0) return fallback;
    const labeled = v.map(formatOne);
    const body =
      labeled.length > 2
        ? `${labeled.slice(0, 2).join(", ")} +${labeled.length - 2}`
        : labeled.join(", ");
    return `${opLabel}: ${body}`;
  }
  if (typeof v === "string") {
    return `${opLabel}: ${formatOne(v)}`;
  }
  return `${opLabel}: ${String(v)}`;
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
