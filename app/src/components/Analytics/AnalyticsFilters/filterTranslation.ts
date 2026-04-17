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
import { isEmptyFilterValue } from "@vonlabs/design-components";
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

// ── Ownership user ID ↔ name helpers ────────────────────────────────

/** Resolve a SFDC user ID to a display name using the definition's ownership_options. */
function ownershipIdToName(id: string, def: DashboardFilterDefinition): string {
  const opt = def.ownership_options?.find((u) => u.id === id);
  return opt?.name ?? id;
}

/** Reverse a display name to a SFDC user ID using the definition's ownership_options. */
function ownershipNameToId(
  name: string,
  def: DashboardFilterDefinition,
): string {
  const opt = def.ownership_options?.find((u) => u.name === name);
  if (opt) return opt.id;
  // Backward compat: label might be a token label (e.g. "My Records" → "MY_RECORDS")
  const token = LABEL_TO_TOKEN[name];
  if (token) return token;
  return name;
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
  // Custom Date / Custom Range — always first in the option list.
  tier1Options.push(CUSTOM_DATE_LABEL, CUSTOM_RANGE_LABEL);
  tier1Applicability[CUSTOM_DATE_LABEL] = SINGLE_DATE_OPERATORS;
  tier1Applicability[CUSTOM_RANGE_LABEL] = RANGE_DATE_OPERATORS;
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

  // ── Token-as-operator model ──────────────────────────────────────
  //
  // Date dynamic and ownership dynamic filters promote their dynamic
  // tokens from *values* into top-level *operators*.
  //
  // Date filters: Relative (tokens, Custom Date, N-parameterized)
  //               + Manual (before, after, between, etc.)
  //
  // Ownership filters: Scope tokens (My Records, My Team's Records, etc.)
  //                    + Manual (Is / Is not with user picklist)

  const isDateDynamic =
    type === "date" && def.dynamic && !!def.available_presets?.length;
  const isOwnershipDynamic =
    def.semantic_type === "ownership" &&
    def.dynamic &&
    !!def.available_presets?.length;

  if (isDateDynamic) {
    const ops: NonNullable<FilterFieldConfig["customOperators"]> = [];
    const presets = def.available_presets ?? [];
    const dynOpts = def.available_dynamic_options ?? [];

    // ── Relative section ────────────────────────────────────────────

    // Custom Date — always first
    ops.push({
      value: "custom_date",
      label: CUSTOM_DATE_LABEL,
      calendarMode: "single" as const,
      separatorBefore: "Relative",
    });

    // Tier 1 presets (flat, no sub-title)
    for (const token of DATE_GROUP_PRESETS.__TIER1__) {
      if (presets.includes(token)) {
        ops.push({ value: token, label: tokenLabel(token), noValue: true });
      }
    }

    // Named-group presets + N-parameterized with category dividers
    for (const [title, groupPresets] of Object.entries(DATE_GROUP_PRESETS)) {
      if (title === "__TIER1__") continue;
      const prefixes = DATE_GROUP_DYNAMIC_PREFIXES[title] ?? [];
      const groupDynamic = dynOpts.filter((o) => prefixes.includes(o.id));
      const hasPresets = groupPresets.some((t) => presets.includes(t));
      if (!hasPresets && groupDynamic.length === 0) continue;

      let first = true;
      for (const token of groupPresets) {
        if (!presets.includes(token)) continue;
        ops.push({
          value: token,
          label: tokenLabel(token),
          noValue: true,
          ...(first && { separatorBefore: title }),
        });
        first = false;
      }
      for (const opt of groupDynamic) {
        ops.push({
          value: opt.id,
          label: opt.label,
          numberInput: { defaultN: opt.default_n, unit: opt.unit },
          ...(first && { separatorBefore: title }),
        });
        first = false;
      }
    }

    // ── Manual section ──────────────────────────────────────────────
    // All valid_operators EXCEPT "equals" (the "Is" operator being
    // promoted). Between/Not Between get calendarMode: 'range'.
    let firstManual = true;
    for (const op of def.valid_operators ?? []) {
      if (REMOVED_OPS.has(op.value)) continue;
      const isBetweenFamily =
        op.value === "between" || op.value === "not_between";
      ops.push({
        value: op.value,
        label: op.label,
        ...(NO_VALUE_OPERATORS.has(op.value) && { noValue: true }),
        ...(isBetweenFamily && { calendarMode: "range" as const }),
        ...(firstManual && { separatorBefore: "Manual" }),
      });
      firstManual = false;
    }

    config.customOperators = ops;

    // Keep optionGroups + calendarOptions for manual operators (before,
    // after, etc.) that still show the token picklist in the right panel.
    const groups = buildDateOptionGroups(def);
    if (groups.length > 0) {
      config.optionGroups = groups;
      config.calendarOptions = {
        singleDateLabel: CUSTOM_DATE_LABEL,
        dateRangeLabel: CUSTOM_RANGE_LABEL,
      };
    }
  } else if (isOwnershipDynamic) {
    // ── Ownership token-as-operator model ──────────────────────────
    // Scope tokens (MY_RECORDS, etc.) become noValue operators.
    // "Is" / "Is not" are manual operators that open a user picklist.
    const ops: NonNullable<FilterFieldConfig["customOperators"]> = [];
    const presets = def.available_presets ?? [];

    // All ownership tokens — enabled if in available_presets, disabled otherwise.
    // Disabled tokens are greyed out so viewers know they exist but are
    // restricted by the dashboard's shared data scope.
    const ALL_OWNERSHIP_TOKENS = [
      "MY_RECORDS",
      "MY_TEAMS_RECORDS",
      "MY_MANAGERS_TEAM",
      "ALL_RECORDS",
    ];
    const enabledSet = new Set(presets);
    for (const token of ALL_OWNERSHIP_TOKENS) {
      ops.push({
        value: token,
        label: tokenLabel(token),
        noValue: true,
        ...(!enabledSet.has(token) && { disabled: true }),
      });
    }

    // Manual operators — all picklist operators for individual user selection.
    // Only add if valid_operators includes them (backend scopes these for viewers).
    const OWNERSHIP_MANUAL_OPS = new Set([
      "in",
      "not_in",
      "equals",
      "not_equals",
    ]);
    const manualOps = (def.valid_operators ?? []).filter((op) =>
      OWNERSHIP_MANUAL_OPS.has(op.value),
    );
    if (manualOps.length > 0) {
      let firstManual = true;
      for (const op of manualOps) {
        ops.push({
          value: op.value,
          label: op.label,
          ...(firstManual && { separatorBefore: "Manual" }),
        });
        firstManual = false;
      }
    }

    config.customOperators = ops;

    // User picklist options from ownership_options (SFDC users resolved to names).
    // These are shown in the right panel when Is / Is not is selected.
    if (def.ownership_options?.length) {
      config.options = def.ownership_options.map((u) => u.name);
    }
  } else {
    // Standard (non-token-as-operator) picklist options
    if (type === "picklist") {
      const rawOptions =
        def.dynamic && def.available_presets?.length
          ? def.available_presets
          : def.options;
      if (rawOptions?.length) {
        config.options = rawOptions.map((opt) => tokenLabel(opt));
      }
    }

    // Standard date filter with option groups (non-dynamic or legacy)
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

    // Standard operator set from backend
    if (def.valid_operators?.length) {
      config.customOperators = def.valid_operators.map((op) => ({
        value: op.value,
        label: op.label,
        ...(NO_VALUE_OPERATORS.has(op.value) && { noValue: true }),
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

// ── Token-as-operator helpers ──────────────────────────────────────
//
// In the token-as-operator model, backend state like
// `{ operator: "equals", value: "THIS_QUARTER" }` becomes
// `{ operator: "THIS_QUARTER" }` in the UI. The translation functions
// below handle both the new model (date/ownership dynamic filters) and
// the legacy model (everything else) transparently.

/** Backend operators whose token values get promoted to UI operators.
 *  "equals" is the removed "Is" operator. "between"/"not_between" with
 *  token values also get promoted since those operators now only accept
 *  calendar dates in the UI. */
const PROMOTE_TOKEN_OPS = new Set(["equals", "between", "not_between"]);

/** Default backend operator for demoted tokens (backend resolves range/point appropriately). */
const DEFAULT_BACKEND_OP = "equals";

/** Backend operators removed from the UI (their tokens are promoted to operators). */
const REMOVED_OPS = new Set([DEFAULT_BACKEND_OP]);

function isTokenAsOperatorFilter(def: DashboardFilterDefinition): boolean {
  const type = mapFieldType(def.type);
  // Date dynamic filters and ownership dynamic filters use the
  // token-as-operator model: tokens are promoted to operators in the UI
  // and demoted back to {operator: "equals", value: TOKEN} for the backend.
  if (type === "date" && !!def.dynamic && !!def.available_presets?.length)
    return true;
  if (
    def.semantic_type === "ownership" &&
    !!def.dynamic &&
    !!def.available_presets?.length
  )
    return true;
  return false;
}

// ── State <-> bar value translation ─────────────────────────────────

export function toFilterBarValue(
  filter: ActiveFilter,
  def: DashboardFilterDefinition,
): FilterBarValue {
  const v = filter.value;
  const op = filter.operator;

  // ── Token-as-operator promotion ──────────────────────────────────
  // Only promote when:
  //  1. This is a token-as-operator filter (date dynamic / ownership)
  //  2. The backend operator is one whose tokens we promote (equals,
  //     between, not_between). Other operators (before, after, etc.)
  //     keep their values via the legacy path.
  if (isTokenAsOperatorFilter(def) && PROMOTE_TOKEN_OPS.has(op)) {
    // Between/not_between with a 2-element date array → custom_range:
    if (
      (op === "between" || op === "not_between") &&
      Array.isArray(v) &&
      v.length === 2
    ) {
      const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
      const [a, b] = v;
      if (
        typeof a === "string" &&
        typeof b === "string" &&
        ISO_DATE.test(a) &&
        ISO_DATE.test(b)
      ) {
        return {
          operator: op,
          value: `custom_range:${a}_${b}`,
          ...(filter.include_blank && { includeBlank: true }),
        };
      }
    }

    if (typeof v === "string") {
      // Between/not_between with a calendar value → keep operator + value
      if (
        (op === "between" || op === "not_between") &&
        isCalendarSerialised(v)
      ) {
        return {
          operator: op,
          value: v,
          ...(filter.include_blank && { includeBlank: true }),
        };
      }
      // N-parameterized: "LAST_N_DAYS:7" → operator: LAST_N_DAYS, value: "7"
      const nMatch = v.match(DYNAMIC_N_RE);
      if (nMatch) {
        return {
          operator: nMatch[1],
          value: nMatch[2],
          ...(filter.include_blank && { includeBlank: true }),
        };
      }
      // Calendar-serialised custom_date → operator: "custom_date"
      if (v.startsWith("custom_date:")) {
        return {
          operator: "custom_date",
          value: v,
          ...(filter.include_blank && { includeBlank: true }),
        };
      }
      // Bare ISO date → wrap as custom_date
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        return {
          operator: "custom_date",
          value: `custom_date:${v}`,
          ...(filter.include_blank && { includeBlank: true }),
        };
      }
      // Known preset token → promote to operator (no value)
      if (TOKEN_LABELS[v] || def.available_presets?.includes(v)) {
        return {
          operator: v,
          ...(filter.include_blank && { includeBlank: true }),
        };
      }
    }

    // No value → keep operator as-is (between with empty value, etc.)
    if (v === undefined || v === null) {
      return {
        operator: op,
        ...(filter.include_blank && { includeBlank: true }),
      };
    }
  }

  // ── Legacy path: standard operator + value ───────────────────────
  // Used for non-token-as-operator filters AND for manual operators
  // (before, after, on_or_before, etc.) on token-as-operator filters.
  let barValue: string | string[] | undefined;
  if (v === undefined || v === null) {
    barValue = undefined;
  } else if (Array.isArray(v)) {
    const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
    if (
      def.type === "date" &&
      v.length === 2 &&
      typeof v[0] === "string" &&
      typeof v[1] === "string" &&
      ISO_DATE.test(v[0]) &&
      ISO_DATE.test(v[1])
    ) {
      barValue = `custom_range:${v[0]}_${v[1]}`;
    } else {
      const isOwnership = def.semantic_type === "ownership";
      barValue = v.map((x) => {
        const s = String(x);
        if (isCalendarSerialised(s)) return s;
        // Ownership: resolve SFDC IDs to display names
        if (isOwnership) return ownershipIdToName(s, def);
        return def.dynamic ? tokenLabel(s) : s;
      });
    }
  } else if (typeof v === "string") {
    if (isCalendarSerialised(v)) barValue = v;
    else if (def.type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(v))
      barValue = `custom_date:${v}`;
    else if (def.semantic_type === "ownership")
      barValue = ownershipIdToName(v, def);
    else barValue = def.dynamic ? tokenLabel(v) : v;
  } else {
    barValue = String(v);
  }
  return {
    operator: op,
    ...(barValue !== undefined && { value: barValue }),
    ...(filter.include_blank && { includeBlank: true }),
  };
}

/**
 * Coerce string-valued numbers to native JS numbers (recursively for arrays).
 * Used only for number-typed filters — the HTML `<input type="number">` emits
 * a string via `.value`, but the backend validator rejects non-numeric JSON
 * on numeric operators (>, <, between, etc.). Non-parseable values are left
 * untouched so the caller / validator can surface the original error.
 */
function coerceNumericFilterValue(v: unknown): unknown {
  if (v === null || v === undefined) return v;
  if (Array.isArray(v)) return v.map(coerceNumericFilterValue);
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return v;
}

export function fromFilterBarValue(
  barValue: FilterBarValue,
  def: DashboardFilterDefinition,
): { operator: string; value?: unknown; includeBlank?: boolean } {
  const op = barValue.operator;
  const v = barValue.value;

  // ── Token-as-operator demotion ───────────────────────────────────
  // Only demote when the UI operator is NOT a real backend operator.
  // Real backend operators (before, after, between, in, etc.) pass
  // through with value de-label-ization via the legacy path.
  if (isTokenAsOperatorFilter(def)) {
    const backendOps = new Set((def.valid_operators ?? []).map((o) => o.value));

    // Real backend operators → legacy value handling
    if (backendOps.has(op)) {
      // fall through to legacy path below
    }
    // "custom_date" UI-only operator → backend "equals" + calendar value
    else if (op === "custom_date") {
      return {
        operator: DEFAULT_BACKEND_OP,
        ...(v !== undefined && { value: v }),
        ...(barValue.includeBlank && { includeBlank: true }),
      };
    }
    // N-parameterized operator (value is a number string) → "equals" + "TOKEN:N"
    else if (typeof v === "string" && /^\d+$/.test(v)) {
      return {
        operator: DEFAULT_BACKEND_OP,
        value: `${op}:${v}`,
        ...(barValue.includeBlank && { includeBlank: true }),
      };
    }
    // Preset date token as operator (noValue) → "equals" + TOKEN
    else {
      return {
        operator: DEFAULT_BACKEND_OP,
        value: op,
        ...(barValue.includeBlank && { includeBlank: true }),
      };
    }
  }

  // ── Legacy path ──────────────────────────────────────────────────
  const isOwnership = def.semantic_type === "ownership";
  let rawValue: unknown;
  if (v === undefined) {
    rawValue = undefined;
  } else if (Array.isArray(v)) {
    if (isOwnership) {
      // Ownership: reverse display names to SFDC user IDs
      rawValue = v.map((x) => ownershipNameToId(x, def));
    } else {
      rawValue = def.dynamic
        ? v.map((x) => (isCalendarSerialised(x) ? x : reverseToken(x)))
        : v;
    }
  } else if (typeof v === "string") {
    if (isCalendarSerialised(v)) rawValue = v;
    else if (isOwnership) rawValue = ownershipNameToId(v, def);
    else rawValue = def.dynamic ? reverseToken(v) : v;
  } else {
    rawValue = v;
  }

  // Number-typed filters emit strings from `<input type="number">`; the
  // backend validator rejects non-numeric JSON on >, <, between, etc.
  // Coerce to native numbers (single + arrays for between/not_between).
  if (def.type === "number") {
    rawValue = coerceNumericFilterValue(rawValue);
  }

  return {
    operator: op,
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
      year: "numeric",
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
  fallback = "Select a filter",
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
  // Operator picked but value is empty/unset — show the operator label
  // alone so the chip reflects the in-progress choice (otherwise we'd
  // fall back to the placeholder and the chip would look uninitialised).
  if (isEmptyFilterValue(v)) return opLabel;

  // Token-as-operator filters: show the token label directly (no operator prefix)
  // when the backend operator is a promoted one (equals, between, not_between).
  // Manual operators (before, after, etc.) use standard "operator: value" rendering.
  if (
    isTokenAsOperatorFilter(def) &&
    PROMOTE_TOKEN_OPS.has(filter.operator) &&
    typeof v === "string"
  ) {
    // N-parameterized: "LAST_N_DAYS:7" → "Last 7 Days"
    const dynLabel = formatDynamicNValue(v, def);
    if (dynLabel) return dynLabel;
    // Calendar value: "custom_date:..." → "Jan 1, 2024"
    const calLabel = formatCalendarSerialised(v);
    if (calLabel) return calLabel;
    // Known preset: "THIS_QUARTER" → "This Quarter"
    if (TOKEN_LABELS[v]) return tokenLabel(v);
    // Bare ISO date
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const d = new Date(v + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  const isOwnership = def.semantic_type === "ownership";
  const formatOne = (x: unknown): string => {
    const s = String(x);
    // Ownership: resolve SFDC IDs to display names
    if (isOwnership) return ownershipIdToName(s, def);
    return (
      formatCalendarSerialised(s) ??
      formatDynamicNValue(s, def) ??
      (def.dynamic ? tokenLabel(s) : s)
    );
  };
  // For token-as-operator between/not_between with date array, show formatted range.
  // Skip for ownership filters — a 2-element array is "2 users", not a date range.
  if (
    isTokenAsOperatorFilter(def) &&
    !isOwnership &&
    Array.isArray(v) &&
    v.length === 2
  ) {
    const labeled = v.map(formatOne);
    return `${opLabel}: ${labeled.join(" – ")}`;
  }
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
