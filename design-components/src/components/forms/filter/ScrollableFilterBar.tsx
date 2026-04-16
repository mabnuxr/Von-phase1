/**
 * ScrollableFilterBar — dashboard filter bar with inline chips plus a
 * "More +N" popover for overflow filters.
 *
 * The first `pinnedCount` (or INLINE_FIELD_COUNT, whichever is larger)
 * filters stay inline. Additional filters move into a More popover,
 * where each list item opens the existing split dropdown editor to the right.
 */

import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CaretDownIcon,
  CaretRightIcon,
  InfoIcon,
  LockSimpleIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import { Tooltip } from '../../Tooltip';
import { SplitFilterDropdown } from './SplitFilterDropdown';
import { isEmptyFilterValue } from './filterValueUtils';

// ============================================================================
// Types
// ============================================================================

export type FieldType = 'text' | 'picklist' | 'number' | 'date';

export interface DynamicOptionConfig {
  /** Unique key, e.g. "last_n_days" */
  id: string;
  /** Display label shown in the list, e.g. "Last N days" */
  label: string;
  /** Placeholder for the number input */
  placeholder?: string;
  /** Default numeric value */
  defaultN?: number;
  /** Suffix shown after the input, e.g. "days", "weeks" */
  unit?: string;
}

export interface CustomOperatorDef {
  value: string;
  label: string;
  /** Operators that don't need a value input (hides the right panel) */
  noValue?: boolean;
  /** Operator directly opens a calendar panel (no option picklist) */
  calendarMode?: 'single' | 'range';
  /** Operator takes an inline number value (for parameterized tokens like Last N Days) */
  numberInput?: { defaultN: number; unit: string };
  /** Render a titled separator line before this operator in the left panel */
  separatorBefore?: string;
  /** Show operator greyed out and non-selectable */
  disabled?: boolean;
}

export interface OptionGroup {
  /** Section title rendered above the group */
  title?: string;
  /** Static checkbox options */
  options?: string[];
  /** Options that require a numeric input */
  dynamicOptions?: DynamicOptionConfig[];
  /**
   * Per-option operator whitelist (keyed by option label). When present,
   * the option is only shown if the current operator is in the list.
   * Options not in this map are always visible.
   */
  optionApplicability?: Record<string, string[]>;
  /**
   * Per-dynamic-option operator whitelist (keyed by dynamic-option `id`,
   * e.g. "LAST_N_DAYS"). Same semantics as `optionApplicability`.
   */
  dynamicOptionApplicability?: Record<string, string[]>;
}

export interface CalendarOptionConfig {
  /** Option label that triggers a single-date calendar picker */
  singleDateLabel?: string;
  /** Option label that triggers a date-range calendar picker */
  dateRangeLabel?: string;
}

export interface FilterFieldConfig {
  id: string;
  label: string;
  type: FieldType;
  /** Available options for picklist fields */
  options?: string[];
  /** Options that require a numeric input (shown below static options) */
  dynamicOptions?: DynamicOptionConfig[];
  /** Grouped option sections with titles — when present, overrides flat options/dynamicOptions */
  optionGroups?: OptionGroup[];
  /** Options that expand a calendar picker when selected */
  calendarOptions?: CalendarOptionConfig;
  /** Tooltip text shown when hovering the info icon next to the label */
  tooltip?: string;
  /** Custom operator definitions — overrides the default operators for this field's type */
  customOperators?: CustomOperatorDef[];
  /** Override the default operator for this field */
  defaultOperator?: string;
  /** Per-filter locked state — dropdown opens read-only, chip gets a locked look. */
  locked?: boolean;
  /** Owner-only toggle. When provided, the popover footer shows a lock button; clicking it calls this handler. */
  onToggleLock?: () => void;
  /**
   * When `onToggleLock` is provided and the filter is not yet locked, the
   * Lock button is disabled unless `canLock` is true — mirrors Apply's rule
   * that a filter must have a complete value before it can be committed.
   * Ignored when the filter is already locked (Unlock is always enabled).
   */
  canLock?: boolean;
  /**
   * Hard extraction boundary applied to single-date / range calendar pickers.
   * Dates falling outside the range are disabled. Passed through to DayPicker
   * via the calendar panel.
   */
  boundary?: {
    /** ISO date string inclusive lower bound (dates before this are disabled) */
    minDate?: string;
    /** ISO date string inclusive upper bound (dates after this are disabled) */
    maxDate?: string;
  };
}

export interface FilterValue {
  operator: string;
  value?: string | string[];
  includeBlank?: boolean;
}

export type FilterBarValue = FilterValue;

export interface ScrollableFilterBarProps {
  fields: FilterFieldConfig[];
  /** Current filter values keyed by field id */
  values: Record<string, FilterValue>;
  onFilterChange: (fieldId: string, value: FilterValue | null) => void;
  /**
   * Commit pending filter changes. When provided, the Apply button inside
   * each filter popover calls this instead of just closing, so users can
   * commit from the popover footer as well as from the outer Apply button.
   */
  onApply?: () => void;
  /**
   * True while a PATCH is in flight (Apply, Clear all, or Lock commit).
   * Threaded to each popover so Apply + Lock buttons show a pending
   * (spinner + disabled) state during the request.
   */
  isApplying?: boolean;
  /**
   * True when there are pending filter changes that could be committed.
   * When false (no changes anywhere), each popover's Apply button is
   * disabled — mirrors the v1 behavior where Apply only lit up with
   * actual edits to commit.
   */
  canApply?: boolean;
  /**
   * Called when Clear is clicked inside a filter popover. Receives the
   * field id. When provided, the popover delegates to this (which should
   * fire a server PATCH to clear the filter) instead of just emitting a
   * local `onFilterChange(id, null)`.
   */
  onClearField?: (fieldId: string) => void;
  /**
   * Minimum number of fields that are always visible inline regardless
   * of the 60% width budget.
   */
  pinnedCount?: number;
  /**
   * Called when a filter popover closes without Apply (dismiss). Receives
   * the field id so the parent can revert unapplied local state.
   */
  onDismiss?: (fieldId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export const ScrollableFilterBar: React.FC<ScrollableFilterBarProps> = ({
  fields,
  values,
  onFilterChange,
  onApply,
  isApplying = false,
  canApply = true,
  onClearField,
  pinnedCount,
  onDismiss,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const morePopoverRef = useRef<HTMLDivElement>(null);
  const [morePopoverStyle, setMorePopoverStyle] = useState<React.CSSProperties>({});

  // ── 60% budget measurement ─────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const rowElRef = useRef<HTMLElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(fields.length);

  const getRowEl = useCallback(() => {
    if (rowElRef.current) return rowElRef.current;
    const container = containerRef.current;
    if (!container) return null;
    rowElRef.current = (container.closest('[class*="justify-between"]') ??
      container.parentElement ??
      container) as HTMLElement;
    return rowElRef.current;
  }, []);

  const measureOverflow = useCallback(() => {
    const measure = measureRef.current;
    const rowEl = getRowEl();
    if (!measure || !rowEl) return;

    const budget = rowEl.clientWidth * 0.5;
    const gap = 6; // gap-1.5 = 6px
    const pinned = pinnedCount ?? 0;

    const children = Array.from(measure.children) as HTMLElement[];
    let usedWidth = 0;
    let count = 0;

    for (let i = 0; i < children.length && i < fields.length; i++) {
      const childWidth = children[i].offsetWidth;
      const nextWidth = usedWidth + childWidth + (count > 0 ? gap : 0);

      // Mandatory (pinned) filters always show, even if they exceed budget
      if (i < pinned) {
        usedWidth = nextWidth;
        count++;
        continue;
      }

      if (nextWidth <= budget) {
        usedWidth = nextWidth;
        count++;
      } else {
        break;
      }
    }

    if (count >= fields.length) count = fields.length;

    setVisibleCount((prev) => (prev === count ? prev : count));
  }, [fields.length, pinnedCount, getRowEl]);

  useLayoutEffect(() => {
    measureOverflow();
  }, [measureOverflow]);

  useEffect(() => {
    const rowEl = getRowEl();
    if (!rowEl) return;
    const observer = new ResizeObserver(measureOverflow);
    observer.observe(rowEl);
    return () => observer.disconnect();
  }, [measureOverflow, getRowEl]);

  const inlineFields = fields.slice(0, visibleCount);
  const hiddenFields = fields.slice(visibleCount);

  // Close More popover if all hidden fields disappear
  useEffect(() => {
    if (isMoreOpen && hiddenFields.length === 0) {
      setIsMoreOpen(false);
    }
  }, [hiddenFields.length, isMoreOpen]);

  // ── More popover positioning ───────────────────────────────────
  const computeMorePopoverPosition = useCallback(() => {
    const trigger = moreButtonRef.current;
    const popover = morePopoverRef.current;
    if (!trigger || !popover) return;

    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const left = Math.max(8, Math.min(triggerRect.left, window.innerWidth - popoverRect.width - 8));
    const preferredTop = triggerRect.bottom + 6;
    const top = Math.max(8, Math.min(preferredTop, window.innerHeight - popoverRect.height - 8));

    setMorePopoverStyle({
      position: 'fixed',
      top,
      left,
      zIndex: 10000,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isMoreOpen) return;
    computeMorePopoverPosition();

    const popover = morePopoverRef.current;
    const observer = new ResizeObserver(computeMorePopoverPosition);
    if (popover) observer.observe(popover);
    window.addEventListener('resize', computeMorePopoverPosition);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', computeMorePopoverPosition);
    };
  }, [isMoreOpen, computeMorePopoverPosition]);

  // Close on outside click
  useEffect(() => {
    if (!isMoreOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        morePopoverRef.current?.contains(target) ||
        moreButtonRef.current?.contains(target) ||
        target.closest('[data-filter-dropdown-root="true"]')
      ) {
        return;
      }
      setIsMoreOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMoreOpen]);

  // ── Render helpers ─────────────────────────────────────────────

  const renderFilterValue = (
    field: FilterFieldConfig,
    fv: FilterValue | undefined
  ): React.ReactNode => {
    if (!fv) return 'Select a filter';
    const opLabel = getOperatorFullLabel(fv.operator, field);

    // Show the operator label by itself when the value is unset or empty
    if (isEmptyFilterValue(fv.value)) return opLabel;

    // N-parameterized operator: substitute N in label
    const opDef = field.customOperators?.find((o) => o.value === fv.operator);
    if (opDef?.numberInput && fv.value && typeof fv.value === 'string') {
      return opLabel.replace(/\bN\b/, fv.value);
    }

    // Calendar-mode operator: show formatted date without operator prefix
    if (opDef?.calendarMode && fv.value && typeof fv.value === 'string') {
      const display = formatDynamicValue(fv.value, undefined);
      if (display) return display;
    }

    // Between / Not between range display
    if (
      (fv.operator === 'between' || fv.operator === 'not_between') &&
      Array.isArray(fv.value) &&
      fv.value.length === 2
    ) {
      const [min, max] = fv.value;
      if (min && max) return `${opLabel}: ${min} – ${max}`;
      if (min) return `${opLabel}: from ${min}`;
      if (max) return `${opLabel}: to ${max}`;
      return opLabel;
    }

    // Multi-value (picklist chips)
    if (Array.isArray(fv.value) && fv.value.length > 0) {
      const allDynOpts = field.optionGroups
        ? field.optionGroups.flatMap((g) => g.dynamicOptions ?? [])
        : field.dynamicOptions;
      const displayValues = fv.value.map((v) => {
        const dynLabel = formatDynamicValue(v, allDynOpts);
        return dynLabel ?? v;
      });
      return (
        <span className="flex items-center gap-1">
          <span>{opLabel}:</span>
          {displayValues.slice(0, 2).map((v, i) => (
            <span
              key={fv.value![i] as string}
              className="inline-flex items-center h-[18px] px-1.5 bg-gray-50 border border-gray-100 text-gray-800 text-xs rounded-full"
            >
              {v}
            </span>
          ))}
          {displayValues.length > 2 && (
            <span className="inline-flex items-center h-[18px] px-1.5 bg-gray-50 border border-gray-100 text-gray-800 text-xs rounded-full">
              +{displayValues.length - 2}
            </span>
          )}
        </span>
      );
    }

    // Single value
    if (fv.value && typeof fv.value === 'string') {
      const allDynOpts = field.optionGroups
        ? field.optionGroups.flatMap((g) => g.dynamicOptions ?? [])
        : field.dynamicOptions;
      const display = formatDynamicValue(fv.value, allDynOpts) ?? fv.value;
      return `${opLabel}: ${display}`;
    }
    return 'Select a filter';
  };

  const renderInlineFilter = (field: FilterFieldConfig) => {
    const fv = values[field.id];
    const fieldLocked = field.locked ?? false;

    return (
      <SplitFilterDropdown
        key={field.id}
        field={field}
        value={fv ?? null}
        onChange={(val) => onFilterChange(field.id, val)}
        locked={fieldLocked}
        onToggleLock={field.onToggleLock}
        canLock={field.canLock}
        onApply={onApply}
        isApplying={isApplying}
        canApply={canApply}
        onClear={onClearField ? () => onClearField(field.id) : undefined}
        onDismiss={onDismiss ? () => onDismiss(field.id) : undefined}
      >
        <div
          className={`flex flex-col gap-1 shrink-0 ${fieldLocked ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <span
            className={`flex items-center gap-1 text-[11px] font-medium leading-none pl-0.5 ${fieldLocked ? 'text-gray-500' : 'text-gray-800'}`}
          >
            {field.label}
            {field.tooltip && (
              <Tooltip content={field.tooltip} placement="top">
                <InfoIcon
                  size={11}
                  className={`shrink-0 transition-colors ${fieldLocked ? 'text-gray-400' : 'text-gray-800 hover:text-gray-600'}`}
                />
              </Tooltip>
            )}
          </span>
          <button
            className={`flex items-center justify-between gap-2 h-[28px] px-2 text-xs rounded-lg border whitespace-nowrap transition-colors ${
              fieldLocked
                ? 'bg-gray-50 border-gray-100 text-gray-700 cursor-default'
                : !fv
                  ? 'bg-white border-gray-200/50 text-gray-500 hover:bg-gray-50 cursor-pointer'
                  : 'bg-white border-gray-200/50 text-gray-900 shadow-xs hover:bg-gray-50 cursor-pointer'
            }`}
            style={{ minWidth: 108 }}
          >
            {fieldLocked && <LockSimpleIcon size={11} className="text-gray-500 shrink-0" />}
            <span className="flex items-center gap-1">{renderFilterValue(field, fv)}</span>
            <CaretRightIcon
              size={12}
              className={`rotate-90 shrink-0 ${fieldLocked || !fv ? 'text-gray-300' : 'text-gray-400'}`}
            />
          </button>
        </div>
      </SplitFilterDropdown>
    );
  };

  return (
    <div ref={containerRef} className="relative flex items-end gap-1.5 min-w-0 max-w-full">
      {/* Hidden measurement row — renders all pills off-screen to measure widths */}
      <div
        ref={measureRef}
        aria-hidden
        className="flex items-center gap-1.5 absolute top-0 left-0 invisible pointer-events-none whitespace-nowrap"
        style={{ height: 0, overflow: 'hidden' }}
      >
        {fields.map((field) => {
          const fv = values[field.id];
          const fieldLocked = field.locked ?? false;
          return (
            <div key={field.id} className="flex flex-col gap-1 shrink-0">
              <span className="flex items-center gap-1 text-[11px] leading-none pl-0.5">
                {field.label}
                {field.tooltip && <InfoIcon size={11} className="shrink-0" />}
              </span>
              <button
                className="flex items-center justify-between gap-2 h-[28px] px-2 text-xs rounded-lg border whitespace-nowrap"
                style={{ minWidth: 108 }}
                tabIndex={-1}
              >
                {fieldLocked && <LockSimpleIcon size={11} className="shrink-0" />}
                <span className="flex items-center gap-1">{renderFilterValue(field, fv)}</span>
                <CaretRightIcon size={12} className="rotate-90 shrink-0" />
              </button>
            </div>
          );
        })}
      </div>

      {inlineFields.map((field) => renderInlineFilter(field))}

      {hiddenFields.length > 0 && (
        <>
          <div className="flex flex-col gap-1 shrink-0">
            {/* Spacer to align with label row above inline chips */}
            <span className="h-[11px]" aria-hidden="true" />
            <button
              ref={moreButtonRef}
              onClick={() => setIsMoreOpen((open) => !open)}
              className={`flex items-center gap-2 h-[28px] px-2 text-xs rounded-lg border transition-colors cursor-pointer ${
                isMoreOpen
                  ? 'bg-gray-50 border-gray-200 text-gray-900'
                  : 'bg-white border-gray-200/50 text-gray-900 shadow-xs hover:bg-gray-50'
              }`}
              style={{ minWidth: 80 }}
            >
              <span className="flex items-center gap-1 whitespace-nowrap">
                <span className="flex items-center gap-px">
                  <PlusIcon size={8} weight="bold" className="shrink-0" />
                  {hiddenFields.length}
                </span>
                <span>filters</span>
                <CaretDownIcon size={10} className="shrink-0 text-gray-400" />
              </span>
            </button>
          </div>

          {isMoreOpen &&
            createPortal(
              <div
                ref={morePopoverRef}
                style={{ ...morePopoverStyle, width: 220 }}
                className="rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-900">More filters</p>
                  <p className="text-[11px] text-gray-500">
                    Open a filter to edit it to the right.
                  </p>
                </div>

                <div className="max-h-[320px] overflow-y-auto p-2">
                  {hiddenFields.map((field) => {
                    const fv = values[field.id];
                    const fieldLocked = field.locked ?? false;
                    return (
                      <SplitFilterDropdown
                        key={field.id}
                        field={field}
                        value={fv ?? null}
                        onChange={(val) => onFilterChange(field.id, val)}
                        triggerClassName="w-full"
                        placement="right-start"
                        locked={fieldLocked}
                        onToggleLock={field.onToggleLock}
                        canLock={field.canLock}
                        onApply={onApply}
                        isApplying={isApplying}
                        canApply={canApply}
                        onClear={onClearField ? () => onClearField(field.id) : undefined}
                        onDismiss={onDismiss ? () => onDismiss(field.id) : undefined}
                      >
                        <div
                          className={`w-full flex flex-col gap-1 rounded-xl p-1 ${fieldLocked ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center justify-between gap-2 pl-0.5">
                            <span
                              className={`flex items-center gap-0.5 text-[11px] font-medium leading-none min-w-0 ${fieldLocked ? 'text-gray-500' : 'text-gray-800'}`}
                            >
                              <span className="truncate">{field.label}</span>
                              {field.tooltip && (
                                <Tooltip content={field.tooltip} placement="top">
                                  <InfoIcon
                                    size={11}
                                    className={`shrink-0 transition-colors ${fieldLocked ? 'text-gray-400' : 'text-gray-800 hover:text-gray-600'}`}
                                  />
                                </Tooltip>
                              )}
                            </span>
                          </div>

                          <button
                            className={`w-full flex items-center justify-between gap-2 h-[28px] px-2 text-xs rounded-lg border whitespace-nowrap transition-colors ${
                              fieldLocked
                                ? 'bg-gray-50 border-gray-100 text-gray-700 cursor-default'
                                : 'bg-white border-gray-200/50 text-gray-900 shadow-xs hover:bg-gray-50 cursor-pointer'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0 overflow-hidden">
                              {renderFilterValue(field, fv)}
                            </span>
                            <CaretRightIcon
                              size={12}
                              className={`shrink-0 ${fieldLocked ? 'text-gray-300' : 'text-gray-400'}`}
                            />
                          </button>
                        </div>
                      </SplitFilterDropdown>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// Helpers
// ============================================================================

/** Full operator label — checks custom operators first, then falls back to built-in map */
function getOperatorFullLabel(op: string, field: FilterFieldConfig): string {
  // Check custom operators first
  if (field.customOperators) {
    const custom = field.customOperators.find((o) => o.value === op);
    if (custom) return custom.label;
  }
  const labels: Record<string, string> = {
    equals: 'Equal To',
    not_equals: 'Not Equal To',
    greater_than: 'Greater Than',
    greater_than_or_equal: 'Greater Than or Equal To',
    less_than: 'Less Than',
    less_than_or_equal: 'Less Than or Equal To',
    between: 'Select Range',
    is_not_blank: 'Is Not Blank',
    is_blank: 'Is Blank',
    in_this_quarter: 'In This Quarter',
    in_next_quarter: 'In Next Quarter',
    // Legacy labels for custom operators
    in: 'Is any of',
    not_in: 'Is none of',
    contains: 'Contains',
    not_contains: 'Does not contain',
    starts_with: 'Starts with',
    ends_with: 'Ends with',
    on: 'On',
    before: 'Before',
    after: 'After',
    on_or_before: 'On or before',
    on_or_after: 'On or after',
    not_between: 'Not between',
  };
  return labels[op] ?? op;
}

/** Resolve a dynamic value like "last_n_days:30" → "Last 30 days" using the field's dynamicOptions config */
function formatDynamicValue(v: string, dynamicOptions?: DynamicOptionConfig[]): string | null {
  // Custom date values: "custom_date:2024-03-15" → "Mar 15, 2024"
  const dateMatch = v.match(/^custom_date:(\d{4}-\d{2}-\d{2})$/);
  if (dateMatch) {
    const d = new Date(dateMatch[1] + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  // Custom range values: "custom_range:2024-03-01_2024-03-31" → "Mar 1 – Mar 31, 2024"
  const rangeMatch = v.match(/^custom_range:(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/);
  if (rangeMatch) {
    const from = new Date(rangeMatch[1] + 'T00:00:00');
    const to = new Date(rangeMatch[2] + 'T00:00:00');
    const fromStr = from.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const toStr = to.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${fromStr} – ${toStr}`;
  }

  if (!dynamicOptions) return null;
  // Accept both uppercase (wire format from the backend, e.g. "NEXT_N_DAYS:7")
  // and lowercase (storybook fixtures).
  const match = v.match(/^([A-Za-z_]+):(\d+)$/);
  if (!match) return null;
  const [, id, nStr] = match;
  const opt = dynamicOptions.find((o) => o.id === id);
  if (!opt) return null;
  return opt.label.replace(/\bN\b/, nStr);
}
