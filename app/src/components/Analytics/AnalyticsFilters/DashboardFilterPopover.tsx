import { useRef, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FunnelIcon, XIcon } from "@phosphor-icons/react";
import { MultiSelectDropdown, Select } from "@vonlabs/design-components";
import type { DashboardFilterDefinition } from "../../../types/dashboard";

// ── Value display helpers ───────────────────────────────────────

function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return (value as string[]).join(", ");
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if ("start" in obj || "end" in obj) {
      const { start, end } = obj as { start?: string; end?: string };
      if (start && end) return `${start} – ${end}`;
      return start ?? end ?? "";
    }
    if ("min" in obj || "max" in obj) {
      const { min, max } = obj as { min?: number; max?: number };
      if (min != null && max != null) return `${min} – ${max}`;
      return String(min ?? max ?? "");
    }
  }
  return String(value);
}

// ── Filter value input per type ─────────────────────────────────

interface FilterValueInputProps {
  definition: DashboardFilterDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

const FilterValueInput: React.FC<FilterValueInputProps> = ({
  definition,
  value,
  onChange,
}) => {
  const type = definition.type;

  if (
    (type === "picklist" || type === "multi-select") &&
    definition.options?.length
  ) {
    const selected = Array.isArray(value)
      ? (value as string[])
      : value
        ? [String(value)]
        : [];
    return (
      <MultiSelectDropdown
        options={definition.options.map((o) => ({ value: o, label: o }))}
        value={selected}
        onChange={(values) => onChange(values.length > 0 ? values : null)}
        placeholder="Select..."
        usePortal
      />
    );
  }

  if (type === "select" && definition.options?.length) {
    return (
      <Select
        options={definition.options.map((o) => ({ value: o, label: o }))}
        value={typeof value === "string" ? value : ""}
        onChange={(val) => onChange(val || null)}
        placeholder="Select..."
        usePortal
      />
    );
  }

  if (type === "date-range") {
    const dateVal =
      typeof value === "object" && value !== null
        ? (value as { start?: string; end?: string })
        : { start: "", end: "" };
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={dateVal.start ?? ""}
          onChange={(e) =>
            onChange(
              e.target.value || dateVal.end
                ? { ...dateVal, start: e.target.value || undefined }
                : null,
            )
          }
          className="flex-1 min-w-0 px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 transition-colors"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={dateVal.end ?? ""}
          onChange={(e) =>
            onChange(
              dateVal.start || e.target.value
                ? { ...dateVal, end: e.target.value || undefined }
                : null,
            )
          }
          className="flex-1 min-w-0 px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 transition-colors"
        />
      </div>
    );
  }

  if (type === "range") {
    const rangeVal =
      typeof value === "object" && value !== null
        ? (value as { min?: number; max?: number })
        : { min: undefined, max: undefined };
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={rangeVal.min ?? ""}
          onChange={(e) => {
            const num = e.target.value ? Number(e.target.value) : undefined;
            const next = { ...rangeVal, min: num };
            onChange(next.min != null || next.max != null ? next : null);
          }}
          placeholder="Min"
          className="flex-1 min-w-0 px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="number"
          value={rangeVal.max ?? ""}
          onChange={(e) => {
            const num = e.target.value ? Number(e.target.value) : undefined;
            const next = { ...rangeVal, max: num };
            onChange(next.min != null || next.max != null ? next : null);
          }}
          placeholder="Max"
          className="flex-1 min-w-0 px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
        />
      </div>
    );
  }

  // text / search / fallback
  return (
    <input
      type="text"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder="Value"
      className="w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
    />
  );
};

// ── Single filter row ───────────────────────────────────────────

interface FilterRowProps {
  definition: DashboardFilterDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  onClear: () => void;
}

const FilterRow: React.FC<FilterRowProps> = ({
  definition,
  value,
  onChange,
  onClear,
}) => {
  const hasValue =
    value !== null &&
    value !== undefined &&
    value !== "" &&
    !(Array.isArray(value) && value.length === 0);

  return (
    <div className="flex items-center gap-2">
      {/* Field label */}
      <div className="flex-shrink-0 w-[140px]">
        <div className="px-2.5 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg truncate">
          {definition.label}
        </div>
      </div>

      {/* "is" connector */}
      <span className="flex-shrink-0 text-sm text-gray-400">is</span>

      {/* Value input */}
      <div className="flex-1 min-w-0">
        <FilterValueInput
          definition={definition}
          value={value}
          onChange={onChange}
        />
      </div>

      {/* Clear button */}
      <button
        onClick={hasValue ? onClear : undefined}
        className={`flex-shrink-0 p-1 rounded-md transition-colors ${
          hasValue
            ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            : "text-gray-200 cursor-default"
        }`}
      >
        <XIcon size={14} />
      </button>
    </div>
  );
};

// ── Main Popover ────────────────────────────────────────────────

interface DashboardFilterPopoverProps {
  definitions: DashboardFilterDefinition[];
  filterState: Record<string, unknown>;
  activeCount: number;
  onFilterChange: (column: string, value: unknown) => void;
  onClearFilter: (column: string) => void;
}

const DashboardFilterPopover: React.FC<DashboardFilterPopoverProps> = ({
  definitions,
  filterState,
  activeCount,
  onFilterChange,
  onClearFilter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Position the popover below the button
  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 6,
      left: rect.left,
    });
  }, [isOpen]);

  // Close on outside click — but ignore clicks on portal-rendered dropdowns
  // that belong to child Select/MultiSelectDropdown components.
  useLayoutEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Ignore if inside the popover itself
      if (popoverRef.current?.contains(target)) return;
      // Ignore if on the trigger button
      if (buttonRef.current?.contains(target)) return;

      // Ignore clicks inside any portal-rendered dropdown list that lives
      // outside the popover DOM but is logically part of it.  Both Dropdown
      // and MultiSelectDropdown render their menus in portals with a
      // predictable structure (fixed-position divs at document.body level).
      // Walk up from the target — if we hit an element with
      // [data-radix-popper] or a fixed-position container that is a sibling
      // portal, skip close.  Simplest: check if the target is inside any
      // fixed-positioned overlay rendered after our popover.
      const closest = target.closest?.(
        "[data-dropdown-portal], [data-multiselect-portal]",
      );
      if (closest) return;

      // Also check: if the click is on a recently-added portal element
      // (dropdown menus rendered via createPortal to body), the target
      // won't be inside our popover.  Check if any ancestor has role=listbox
      // or is a dropdown menu container.
      if (
        target.closest("[role='listbox']") ||
        target.closest("[role='option']")
      ) {
        return;
      }

      // For framer-motion portal overlays and other generic portal children,
      // check if the target is a direct child portal of body that appeared
      // after our popover.
      let el: HTMLElement | null = target;
      while (el && el !== document.body) {
        const pos = window.getComputedStyle(el).position;
        if (pos === "fixed" && el.parentElement === document.body) {
          // This is a portal-rendered overlay at body level — likely a
          // dropdown from inside our popover. Don't close.
          return;
        }
        el = el.parentElement;
      }

      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (definitions.length === 0) return null;

  return (
    <>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 h-[34px] px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
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
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[420px] max-w-[560px]"
            style={{ top: position.top, left: position.left }}
          >
            <div className="flex flex-col gap-2.5">
              {definitions.map((def) => (
                <FilterRow
                  key={def.id}
                  definition={def}
                  value={filterState[def.id] ?? null}
                  onChange={(value) => onFilterChange(def.id, value)}
                  onClear={() => onClearFilter(def.id)}
                />
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export { DashboardFilterPopover, formatDisplayValue };
