import {
  useRef,
  useLayoutEffect,
  useEffect,
  useState,
  useMemo,
  memo,
} from "react";
import { createPortal } from "react-dom";
import {
  FunnelIcon,
  PlusIcon,
  TrashIcon,
  PaintBrushHouseholdIcon,
} from "@phosphor-icons/react";
import { MultiSelectDropdown, Select } from "@vonlabs/design-components";
import type { DashboardFilterDefinition } from "../../../types/dashboard";
import type {
  ActiveFilter,
  PendingRow,
} from "../../../hooks/useDashboardFilters";

// ── Operator labels (fallback when valid_operators missing) ────

const OPERATOR_LABELS: Record<string, string> = {
  equals: "Is",
  not_equals: "Is not",
  contains: "Contains",
  not_contains: "Does not contain",
  starts_with: "Starts with",
  ends_with: "Ends with",
  in: "One of",
  not_in: "Not one of",
  on: "Is",
  before: "Before",
  after: "After",
  on_or_before: "On or before",
  on_or_after: "On or after",
  greater_than: "Greater than",
  greater_than_or_equal: "At least",
  less_than: "Less than",
  less_than_or_equal: "At most",
  between: "Between",
  not_between: "Not between",
  is_blank: "Is blank",
  is_not_blank: "Is not blank",
};

const NO_VALUE_OPERATORS = new Set(["is_blank", "is_not_blank"]);
const LIST_OPERATORS = new Set(["in", "not_in"]);
const BETWEEN_OPERATORS = new Set(["between", "not_between"]);

/** Fallback operators by frontend filter type */
const FALLBACK_OPERATORS: Record<string, string[]> = {
  picklist: [
    "in",
    "not_in",
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "is_blank",
    "is_not_blank",
  ],
  "multi-select": [
    "in",
    "not_in",
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "is_blank",
    "is_not_blank",
  ],
  select: [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "is_blank",
    "is_not_blank",
  ],
  "date-range": [
    "on",
    "before",
    "after",
    "on_or_before",
    "on_or_after",
    "between",
    "not_between",
    "is_blank",
    "is_not_blank",
  ],
  range: [
    "equals",
    "not_equals",
    "greater_than",
    "greater_than_or_equal",
    "less_than",
    "less_than_or_equal",
    "between",
    "not_between",
    "is_blank",
    "is_not_blank",
  ],
  search: [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "is_blank",
    "is_not_blank",
  ],
};

function getOperatorOptions(def: DashboardFilterDefinition) {
  if (def.valid_operators && def.valid_operators.length > 0) {
    return def.valid_operators.map((op) => ({
      value: op.value,
      label: op.label,
    }));
  }
  const ops = FALLBACK_OPERATORS[def.type] ?? [
    "equals",
    "not_equals",
    "is_blank",
    "is_not_blank",
  ];
  return ops.map((op) => ({
    value: op,
    label: OPERATOR_LABELS[op] ?? op,
  }));
}

function getDefaultOperator(def: DashboardFilterDefinition): string {
  const ops = getOperatorOptions(def);
  return ops[0]?.value ?? "equals";
}

// ── Value input per operator/type ──────────────────────────────

interface ValueInputProps {
  definition: DashboardFilterDefinition;
  operator: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

const ValueInput: React.FC<ValueInputProps> = ({
  definition,
  operator,
  value,
  onChange,
}) => {
  if (NO_VALUE_OPERATORS.has(operator)) return null;

  const type = definition.type;

  // Between: two inputs
  if (BETWEEN_OPERATORS.has(operator)) {
    if (type === "date-range") {
      const arr = Array.isArray(value) ? (value as string[]) : ["", ""];
      return (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            type="date"
            value={arr[0] ?? ""}
            onChange={(e) => onChange([e.target.value, arr[1] ?? ""])}
            className="flex-1 min-w-0 px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
          />
          <span className="text-xs text-gray-600 flex-shrink-0">to</span>
          <input
            type="date"
            value={arr[1] ?? ""}
            onChange={(e) => onChange([arr[0] ?? "", e.target.value])}
            className="flex-1 min-w-0 px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      );
    }
    const arr = Array.isArray(value)
      ? (value as number[])
      : [undefined, undefined];
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <input
          type="number"
          value={arr[0] ?? ""}
          onChange={(e) => {
            const n = e.target.value ? Number(e.target.value) : undefined;
            onChange([n, arr[1]]);
          }}
          placeholder="Min"
          className="flex-1 min-w-0 px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-500 focus:outline-none focus:border-gray-300 transition-colors"
        />
        <span className="text-xs text-gray-600 flex-shrink-0">to</span>
        <input
          type="number"
          value={arr[1] ?? ""}
          onChange={(e) => {
            const n = e.target.value ? Number(e.target.value) : undefined;
            onChange([arr[0], n]);
          }}
          placeholder="Max"
          className="flex-1 min-w-0 px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-500 focus:outline-none focus:border-gray-300 transition-colors"
        />
      </div>
    );
  }

  // List operators on picklist: multi-select dropdown
  if (
    LIST_OPERATORS.has(operator) &&
    (type === "picklist" || type === "multi-select") &&
    definition.options?.length
  ) {
    const selected = Array.isArray(value)
      ? (value as string[])
      : value
        ? [String(value)]
        : [];
    return (
      <div className="flex-1 min-w-0">
        <MultiSelectDropdown
          options={definition.options.map((o) => ({ value: o, label: o }))}
          value={selected}
          onChange={(values) =>
            onChange(values.length > 0 ? values : undefined)
          }
          placeholder="Select..."
          usePortal
        />
      </div>
    );
  }

  // Equals/not_equals on picklist with options: single select
  if (
    (operator === "equals" || operator === "not_equals") &&
    (type === "picklist" || type === "multi-select" || type === "select") &&
    definition.options?.length
  ) {
    return (
      <div className="flex-1 min-w-0">
        <Select
          options={definition.options.map((o) => ({ value: o, label: o }))}
          value={typeof value === "string" ? value : ""}
          onChange={(val) => onChange(val || undefined)}
          placeholder="Select..."
          usePortal
        />
      </div>
    );
  }

  // Date input
  if (type === "date-range") {
    return (
      <div className="flex-1 min-w-0">
        <input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
        />
      </div>
    );
  }

  // Number input
  if (type === "range") {
    return (
      <div className="flex-1 min-w-0">
        <input
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : undefined)
          }
          placeholder="Enter a value"
          className="w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-500 focus:outline-none focus:border-gray-300 transition-colors"
        />
      </div>
    );
  }

  // Text input (default)
  return (
    <div className="flex-1 min-w-0">
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder="Enter a value"
        className="w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-500 focus:outline-none focus:border-gray-300 transition-colors"
      />
    </div>
  );
};

// ── Active filter row ──────────────────────────────────────────

interface ActiveFilterRowProps {
  filterId: string;
  filter: ActiveFilter;
  definition: DashboardFilterDefinition;
  allDefinitions: DashboardFilterDefinition[];
  usedFieldIds: Set<string>;
  onFieldChange: (oldFieldId: string, newFieldId: string) => void;
  onOperatorChange: (operator: string) => void;
  onValueChange: (value: unknown) => void;
  onIncludeBlankChange: (includeBlank: boolean) => void;
  onRemove: () => void;
}

const ActiveFilterRow: React.FC<ActiveFilterRowProps> = memo(
  ({
    filterId,
    filter,
    definition,
    allDefinitions,
    usedFieldIds,
    onFieldChange,
    onOperatorChange,
    onValueChange,
    onIncludeBlankChange,
    onRemove,
  }) => {
    // Field options: current field + unused fields
    const fieldOptions = allDefinitions
      .filter((d) => d.id === filterId || !usedFieldIds.has(d.id))
      .map((d) => ({ value: d.id, label: d.label }));

    const operatorOptions = getOperatorOptions(definition);
    const isNoValue = NO_VALUE_OPERATORS.has(filter.operator);

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* Field dropdown */}
          <div className="w-40 flex-shrink-0">
            <Select
              options={fieldOptions}
              value={filterId}
              onChange={(newFieldId) => {
                if (newFieldId && newFieldId !== filterId) {
                  onFieldChange(filterId, newFieldId);
                }
              }}
              placeholder="Field"
              usePortal
            />
          </div>

          {/* Operator dropdown */}
          <div className="flex-shrink-0" style={{ width: "108px" }}>
            <Select
              options={operatorOptions}
              value={filter.operator}
              onChange={(op) => {
                if (op) onOperatorChange(op);
              }}
              placeholder="Operator"
              usePortal
            />
          </div>

          {/* Value input */}
          <ValueInput
            definition={definition}
            operator={filter.operator}
            value={filter.value}
            onChange={onValueChange}
          />

          {/* Spacer when value input is hidden */}
          {isNoValue && <div className="flex-1" />}

          {/* Delete button — always visible, secondary style */}
          <button
            type="button"
            onClick={onRemove}
            title="Remove condition"
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
          >
            <TrashIcon size={14} />
          </button>
        </div>

        {/* Include blanks toggle — left-aligned, with separator below */}
        {!isNoValue && (
          <>
            <div className="flex items-center gap-2 pl-0.5">
              <button
                type="button"
                role="switch"
                aria-checked={!!filter.include_blank}
                onClick={() => onIncludeBlankChange(!filter.include_blank)}
                className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                  filter.include_blank ? "bg-gray-900" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out mt-0.5 ${
                    filter.include_blank
                      ? "translate-x-3.5 ml-px"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-xs text-gray-700">Include blanks</span>
            </div>
            <div className="border-t border-gray-100" />
          </>
        )}
      </div>
    );
  },
);

// ── Pending (empty) filter row ─────────────────────────────────

interface PendingFilterRowProps {
  allDefinitions: DashboardFilterDefinition[];
  usedFieldIds: Set<string>;
  onCommit: (filterId: string, defaultOperator: string) => void;
  onRemove: () => void;
  showRemove: boolean;
}

const PendingFilterRow: React.FC<PendingFilterRowProps> = ({
  allDefinitions,
  usedFieldIds,
  onCommit,
  onRemove,
  showRemove,
}) => {
  const fieldOptions = allDefinitions
    .filter((d) => !usedFieldIds.has(d.id))
    .map((d) => ({ value: d.id, label: d.label }));

  return (
    <div className="flex items-center gap-2">
      {/* Field dropdown */}
      <div className="w-40 flex-shrink-0">
        <Select
          options={fieldOptions}
          value=""
          onChange={(fieldId) => {
            if (!fieldId) return;
            const def = allDefinitions.find((d) => d.id === fieldId);
            if (!def) return;
            onCommit(fieldId, getDefaultOperator(def));
          }}
          placeholder="Field"
          usePortal
        />
      </div>

      {/* Operator placeholder */}
      <div className="flex-shrink-0" style={{ width: "108px" }}>
        <div className="px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg">
          is
        </div>
      </div>

      {/* Value placeholder */}
      <div className="flex-1 min-w-0">
        <div className="px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg">
          Enter a value
        </div>
      </div>

      {/* Delete button — always visible, disabled when can't remove */}
      <button
        type="button"
        onClick={showRemove ? onRemove : undefined}
        disabled={!showRemove}
        title="Remove"
        className={`flex-shrink-0 p-1.5 rounded-lg bg-white border border-gray-200 transition-colors duration-150 ${
          showRemove
            ? "text-gray-700 hover:bg-gray-50 cursor-pointer"
            : "text-gray-700 opacity-50 cursor-not-allowed"
        }`}
      >
        <TrashIcon size={14} />
      </button>
    </div>
  );
};

// ── Main Popover ────────────────────────────────────────────────

interface DashboardFilterPopoverProps {
  definitions: DashboardFilterDefinition[];
  filterState: Record<string, ActiveFilter>;
  pendingRows: PendingRow[];
  activeCount: number;
  canApply: boolean;
  isApplying: boolean;
  onFilterChange: (
    filterId: string,
    operator: string,
    value?: unknown,
    includeBlank?: boolean,
  ) => void;
  onRemoveFilter: (filterId: string) => void;
  onAddFilter: () => void;
  onRemovePendingRow: (tempId: string) => void;
  onCommitPendingRow: (
    pendingId: string,
    filterId: string,
    defaultOperator: string,
  ) => void;
  onApply: () => void;
  onClearAll: () => void;
}

const DashboardFilterPopover: React.FC<DashboardFilterPopoverProps> = ({
  definitions,
  filterState,
  pendingRows,
  activeCount,
  canApply,
  isApplying,
  onFilterChange,
  onRemoveFilter,
  onAddFilter,
  onRemovePendingRow,
  onCommitPendingRow,
  onApply,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Position the popover below the button, clamping to viewport
  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = popoverRef.current?.offsetWidth ?? 520;
    const left = Math.max(
      16,
      Math.min(rect.left, window.innerWidth - popoverWidth - 16),
    );
    setPosition({
      top: rect.bottom + 6,
      left,
    });
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (popoverRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;

      // Ignore clicks inside portal-rendered dropdowns
      const closest = target.closest?.(
        "[data-dropdown-portal], [data-multiselect-portal]",
      );
      if (closest) return;
      if (
        target.closest("[role='listbox']") ||
        target.closest("[role='option']")
      ) {
        return;
      }

      let el: HTMLElement | null = target;
      while (el && el !== document.body) {
        const pos = window.getComputedStyle(el).position;
        if (pos === "fixed" && el.parentElement === document.body) {
          return;
        }
        el = el.parentElement;
      }

      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const defById = useMemo(
    () => new Map(definitions.map((d) => [d.id, d])),
    [definitions],
  );
  const usedFieldIds = useMemo(
    () => new Set(Object.keys(filterState)),
    [filterState],
  );

  if (definitions.length === 0) return null;

  const activeFilterEntries = Object.entries(filterState);
  const unusedFieldCount = definitions.filter(
    (d) => !usedFieldIds.has(d.id),
  ).length;
  // Hide "+ Add condition" when remaining unused fields equals pending empty rows
  const canAddMore = unusedFieldCount > pendingRows.length;
  const totalRows = activeFilterEntries.length + pendingRows.length;

  // Show one pending row if no filters and no pending rows exist
  const showDefaultPending =
    activeFilterEntries.length === 0 && pendingRows.length === 0;

  const handleFieldChange = (oldFieldId: string, newFieldId: string) => {
    const newDef = defById.get(newFieldId);
    if (!newDef) return;
    // Remove old filter, add new one with default operator
    onRemoveFilter(oldFieldId);
    onFilterChange(newFieldId, getDefaultOperator(newDef), undefined);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 h-[34px] px-3 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <FunnelIcon size={14} />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-gray-800 bg-gray-100 rounded-md">
            {activeCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[520px] max-w-[640px]"
            style={{ top: position.top, left: position.left }}
          >
            <div
              className={`flex flex-col gap-2.5 transition-opacity ${isApplying ? "opacity-50 pointer-events-none" : ""}`}
            >
              {/* Active filter rows */}
              {activeFilterEntries.map(([filterId, filter]) => {
                const def = defById.get(filterId);
                if (!def) return null;
                return (
                  <ActiveFilterRow
                    key={filterId}
                    filterId={filterId}
                    filter={filter}
                    definition={def}
                    allDefinitions={definitions}
                    usedFieldIds={usedFieldIds}
                    onFieldChange={handleFieldChange}
                    onOperatorChange={(op) => {
                      // Reset value when operator type changes
                      const wasNoValue = NO_VALUE_OPERATORS.has(
                        filter.operator,
                      );
                      const isNoValue = NO_VALUE_OPERATORS.has(op);
                      const wasBetween = BETWEEN_OPERATORS.has(filter.operator);
                      const isBetween = BETWEEN_OPERATORS.has(op);
                      const wasList = LIST_OPERATORS.has(filter.operator);
                      const isList = LIST_OPERATORS.has(op);

                      const incompatible =
                        wasNoValue !== isNoValue ||
                        wasBetween !== isBetween ||
                        wasList !== isList;

                      onFilterChange(
                        filterId,
                        op,
                        incompatible ? undefined : filter.value,
                        isNoValue ? undefined : filter.include_blank,
                      );
                    }}
                    onValueChange={(val) =>
                      onFilterChange(
                        filterId,
                        filter.operator,
                        val,
                        filter.include_blank,
                      )
                    }
                    onIncludeBlankChange={(includeBlank) =>
                      onFilterChange(
                        filterId,
                        filter.operator,
                        filter.value,
                        includeBlank,
                      )
                    }
                    onRemove={() => onRemoveFilter(filterId)}
                  />
                );
              })}

              {/* Pending (empty) rows */}
              {pendingRows.map((row) => (
                <PendingFilterRow
                  key={row.tempId}
                  allDefinitions={definitions}
                  usedFieldIds={usedFieldIds}
                  onCommit={(fieldId, defaultOp) =>
                    onCommitPendingRow(row.tempId, fieldId, defaultOp)
                  }
                  onRemove={() => onRemovePendingRow(row.tempId)}
                  showRemove={totalRows > 1 || activeFilterEntries.length > 0}
                />
              ))}

              {/* Default empty row when no filters exist */}
              {showDefaultPending && (
                <PendingFilterRow
                  allDefinitions={definitions}
                  usedFieldIds={usedFieldIds}
                  onCommit={(fieldId, defaultOp) =>
                    onFilterChange(fieldId, defaultOp, undefined)
                  }
                  onRemove={() => {}}
                  showRemove={false}
                />
              )}
            </div>

            {/* Footer: + Add condition | Clear all | Apply */}
            <div className="flex items-center mt-3">
              <div
                className={`flex items-center gap-2 flex-1 transition-opacity ${isApplying ? "opacity-50 pointer-events-none" : ""}`}
              >
                {canAddMore && (
                  <button
                    type="button"
                    onClick={onAddFilter}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <PlusIcon size={14} />
                    <span>Add condition</span>
                  </button>
                )}
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <PaintBrushHouseholdIcon size={14} />
                    <span>Clear all</span>
                  </button>
                )}
              </div>

              {/* Apply button — matches SaveButton style */}
              <button
                type="button"
                onClick={onApply}
                disabled={!canApply || isApplying}
                className={`flex items-center gap-1.5 h-[34px] px-3 text-sm font-medium rounded-xl border transition-colors ${
                  isApplying
                    ? "border-gray-900 bg-gray-900 text-white cursor-not-allowed opacity-80"
                    : canApply
                      ? "border-gray-900 bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
                      : "border-gray-200 bg-gray-100 text-gray-400 cursor-default"
                }`}
              >
                {isApplying ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export { DashboardFilterPopover };
