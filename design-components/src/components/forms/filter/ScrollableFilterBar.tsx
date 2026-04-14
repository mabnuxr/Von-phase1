/**
 * ScrollableFilterBar — horizontal pill bar with overflow "+" dropdown.
 *
 * Renders filter fields as individual pill dropdowns. When content overflows
 * the available width, excess pills move behind a "+N" button that opens a
 * dropdown list of the overflow filter names. Selecting one promotes it into
 * the visible set and auto-opens its popover.
 *
 * When `pinnedCount` / `onOverflowSelect` are not provided, falls back to the
 * original horizontal-scroll behaviour with gradient fades and caret buttons.
 */

import React, { useRef, useState, useCallback, useLayoutEffect, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  CaretLeftIcon,
  CaretRightIcon,
  InfoIcon,
  LockSimpleIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import { Tooltip } from '../../Tooltip';
import { SplitFilterDropdown } from './SplitFilterDropdown';

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
   * Number of fields at the start of the `fields` array that are always
   * visible and never overflow. When provided together with
   * `onOverflowSelect`, enables the responsive overflow "+" behaviour.
   */
  pinnedCount?: number;
  /**
   * Called when the user selects a filter from the overflow "+" dropdown.
   * The parent is responsible for promoting that filter into the visible set.
   */
  onOverflowSelect?: (fieldId: string) => void;
  /**
   * When set, the matching SplitFilterDropdown opens on mount (one-shot).
   * Used to auto-open the popover for a filter just promoted from overflow.
   */
  autoOpenFieldId?: string;
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
  onOverflowSelect,
  autoOpenFieldId,
  onDismiss,
}) => {
  const useOverflowMode = pinnedCount != null && onOverflowSelect != null;

  // Find the parent row element for budget calculation (cached in ref)
  const rowElRef = useRef<HTMLElement | null>(null);
  const getRowEl = useCallback(() => {
    if (rowElRef.current) return rowElRef.current;
    const container = containerRef.current;
    if (!container) return null;
    rowElRef.current = (container.closest('[class*="justify-between"]') ??
      container.parentElement ??
      container) as HTMLElement;
    return rowElRef.current;
  }, []);

  // ── Refs shared between overflow and scroll modes ───────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Overflow measurement ────────────────────────────────────────
  // Determines which non-applied filters to show vs. put behind "+"
  const [visibleSet, setVisibleSet] = useState<Set<string>>(() => new Set());
  // Dynamic max-width for the scroll area — 60% of the actual row width
  const [scrollAreaMaxWidth, setScrollAreaMaxWidth] = useState<number>(0);

  const measureOverflow = useCallback(() => {
    if (!useOverflowMode) return;
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const rowEl = getRowEl() ?? container;
    const rowWidth = rowEl.clientWidth;
    const budget = rowWidth * 0.6;
    setScrollAreaMaxWidth(budget);
    const plusButtonWidth = 42;
    const gap = 6; // gap-1.5 = 6px

    const children = Array.from(measure.children) as HTMLElement[];
    const pinned = pinnedCount ?? 0;

    // Phase 1: mandatory (pinned) + applied always visible — measure their width
    let usedWidth = 0;
    let count = 0;
    const visible = new Set<string>();

    for (let i = 0; i < children.length; i++) {
      const field = fields[i];
      const isPinned = i < pinned;
      const isApplied = field.id in values;

      if (isPinned || isApplied) {
        usedWidth += children[i].offsetWidth + (count > 0 ? gap : 0);
        count++;
        visible.add(field.id);
      }
    }

    // Phase 2: fill remaining non-applied into the 60% budget.
    // Mandatory+applied always show even if they exceed the budget.
    // Non-applied only appear if there's room within the 60% allocation.
    const nonAppliedBudget = Math.max(budget, usedWidth);
    let hasOverflow = false;

    for (let i = 0; i < children.length; i++) {
      const field = fields[i];
      if (visible.has(field.id)) continue; // already mandatory/applied

      const childWidth = children[i].offsetWidth;
      const nextWidth = usedWidth + childWidth + (count > 0 ? gap : 0);
      // Reserve "+" button space when checking fit
      if (nextWidth + plusButtonWidth <= nonAppliedBudget) {
        usedWidth = nextWidth;
        count++;
        visible.add(field.id);
      } else {
        hasOverflow = true;
        break;
      }
    }

    // If all fit, no "+" button needed — include everything
    if (!hasOverflow) {
      for (const f of fields) visible.add(f.id);
    }

    // Skip state update if the visible set hasn't changed (avoids no-op re-renders on resize)
    setVisibleSet((prev) => {
      if (prev.size === visible.size && [...visible].every((id) => prev.has(id))) return prev;
      return visible;
    });
  }, [useOverflowMode, fields, pinnedCount, values, getRowEl]);

  useLayoutEffect(() => {
    measureOverflow();
  }, [measureOverflow]);

  useEffect(() => {
    if (!useOverflowMode) return;
    const container = containerRef.current;
    if (!container) return;
    const rowEl = getRowEl() ?? container;
    const observer = new ResizeObserver(measureOverflow);
    observer.observe(rowEl);
    observer.observe(container);
    return () => observer.disconnect();
  }, [useOverflowMode, measureOverflow, getRowEl]);

  const visibleFields = useMemo(
    () => (useOverflowMode ? fields.filter((f) => visibleSet.has(f.id)) : fields),
    [useOverflowMode, fields, visibleSet]
  );
  const overflowFields = useMemo(
    () => (useOverflowMode ? fields.filter((f) => !visibleSet.has(f.id)) : []),
    [useOverflowMode, fields, visibleSet]
  );

  // ── Overflow dropdown state ─────────────────────────────────────
  const [overflowOpen, setOverflowOpen] = useState(false);
  const plusRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const repositionDropdown = useCallback(() => {
    if (!plusRef.current) return;
    const rect = plusRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      zIndex: 9100,
    });
  }, []);

  useLayoutEffect(() => {
    if (!overflowOpen) return;
    repositionDropdown();
  }, [overflowOpen, repositionDropdown]);

  // Reposition dropdown on scroll/resize while open
  useEffect(() => {
    if (!overflowOpen) return;
    window.addEventListener('resize', repositionDropdown);
    window.addEventListener('scroll', repositionDropdown, true);
    return () => {
      window.removeEventListener('resize', repositionDropdown);
      window.removeEventListener('scroll', repositionDropdown, true);
    };
  }, [overflowOpen, repositionDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!overflowOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        plusRef.current?.contains(e.target as Node)
      )
        return;
      setOverflowOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [overflowOpen]);

  // ── Horizontal scroll (shared by both modes) ───────────────────
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', checkScroll);
    };
  }, [checkScroll, visibleFields.length]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 200;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  // Deferred auto-open: polls until the promoted pill is in the DOM,
  // scrolls to end, waits for scroll to finish, then opens the popover.
  const [deferredOpenId, setDeferredOpenId] = useState<string | undefined>();
  const lastAutoOpenRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!autoOpenFieldId || autoOpenFieldId === lastAutoOpenRef.current) return;
    lastAutoOpenRef.current = autoOpenFieldId;

    let lastScrollWidth = 0;
    let rafId: number;

    const poll = setInterval(() => {
      const el = scrollRef.current;
      if (!el || el.children.length === 0) return;

      // If scrollWidth changed (new pill appeared or layout shifted),
      // re-trigger instant scroll to the new end.
      if (el.scrollWidth !== lastScrollWidth) {
        lastScrollWidth = el.scrollWidth;
        el.scrollTo({ left: el.scrollWidth, behavior: 'instant' });
        return;
      }

      // scrollWidth stable + scroll is at end → open the popover
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      if (atEnd) {
        clearInterval(poll);
        setDeferredOpenId(autoOpenFieldId);
        rafId = requestAnimationFrame(() => setDeferredOpenId(undefined));
      }
    }, 50);

    // Safety: give up after 2s
    const safety = setTimeout(() => clearInterval(poll), 2000);

    return () => {
      clearInterval(poll);
      clearTimeout(safety);
      cancelAnimationFrame(rafId);
    };
  }, [autoOpenFieldId]);

  // ── Shared render helpers ───────────────────────────────────────

  const renderFilterValue = (
    field: FilterFieldConfig,
    fv: FilterValue | undefined
  ): React.ReactNode => {
    if (!fv) return 'All';
    const opLabel = getOperatorFullLabel(fv.operator, field);

    // NoValue operators (is_blank, is_not_blank, custom noValue like My Records)
    if (!fv.value && fv.value !== '') return opLabel;

    // N-parameterized operator: substitute N in label ("Last N Days" + "7" → "Last 7 Days")
    const opDef = field.customOperators?.find((o) => o.value === fv.operator);
    if (opDef?.numberInput && fv.value && typeof fv.value === 'string') {
      return opLabel.replace(/\bN\b/, fv.value);
    }

    // Calendar-mode operator: show formatted date without operator prefix
    if (opDef?.calendarMode && fv.value && typeof fv.value === 'string') {
      const display = formatDynamicValue(fv.value, undefined);
      if (display) return display;
    }

    // Between range display
    if (fv.operator === 'between' && Array.isArray(fv.value) && fv.value.length === 2) {
      const [min, max] = fv.value;
      if (min && max) return `Between: ${min} – ${max}`;
      if (min) return `From: ${min}`;
      if (max) return `To: ${max}`;
      return 'Between';
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

    // Single value — run through the dynamic/calendar formatter so wire
    // tokens like "NEXT_N_DAYS:45" render as "Next 45 days" instead of
    // the raw serialised token.
    if (fv.value && typeof fv.value === 'string') {
      const allDynOpts = field.optionGroups
        ? field.optionGroups.flatMap((g) => g.dynamicOptions ?? [])
        : field.dynamicOptions;
      const display = formatDynamicValue(fv.value, allDynOpts) ?? fv.value;
      return `${opLabel}: ${display}`;
    }
    return 'All';
  };

  const renderPill = (field: FilterFieldConfig, isAutoOpen: boolean = false) => {
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
        defaultOpen={isAutoOpen}
      >
        <div
          className={`flex flex-col gap-1 shrink-0 ${fieldLocked ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <span
            className={`flex items-center gap-1 text-[11px] leading-none pl-0.5 ${fieldLocked ? 'text-gray-500' : 'text-gray-700'}`}
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
                : 'bg-white border-gray-200/50 text-gray-900 shadow-xs hover:bg-gray-50 cursor-pointer'
            } ${!fv ? 'min-w-[80px]' : ''}`}
          >
            {fieldLocked && <LockSimpleIcon size={11} className="text-gray-500 shrink-0" />}
            <span className="flex items-center gap-1">{renderFilterValue(field, fv)}</span>
            <CaretRightIcon
              size={12}
              className={`rotate-90 shrink-0 ${fieldLocked ? 'text-gray-300' : 'text-gray-400'}`}
            />
          </button>
        </div>
      </SplitFilterDropdown>
    );
  };

  // ── Overflow mode render ────────────────────────────────────────
  if (useOverflowMode) {
    return (
      <div ref={containerRef} className="flex items-center gap-1.5 min-w-0">
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
                  className={`flex items-center justify-between gap-2 h-[28px] px-2 text-xs rounded-lg border whitespace-nowrap ${
                    !fv ? 'min-w-[80px]' : ''
                  }`}
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

        {/* Scrollable filter area — capped at 60% of the parent row */}
        <div
          className="flex items-end gap-1 min-w-0"
          style={{ maxWidth: scrollAreaMaxWidth || undefined }}
        >
          {/* Left caret — h-[28px] matches chip height for perfect alignment */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
            >
              <CaretLeftIcon size={12} weight="bold" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap min-w-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {visibleFields.map((field) => renderPill(field, field.id === deferredOpenId))}
          </div>

          {/* Right caret — h-[28px] matches chip height for perfect alignment */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
            >
              <CaretRightIcon size={12} weight="bold" />
            </button>
          )}
        </div>

        {/* "+" overflow button — outside the 60% scroll area */}
        {overflowFields.length > 0 && (
          <button
            ref={plusRef}
            onClick={() => setOverflowOpen((o) => !o)}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer shrink-0 self-end"
            title="More filters"
          >
            <PlusIcon size={14} />
          </button>
        )}

        {/* Overflow dropdown */}
        {overflowOpen &&
          createPortal(
            <div
              ref={dropdownRef}
              style={dropdownStyle}
              className="bg-white rounded-lg border border-gray-200 shadow-lg py-1 min-w-[180px] max-h-[280px] overflow-auto"
            >
              {overflowFields.map((field) => {
                const fv = values[field.id];
                const hasValue = !!fv;
                return (
                  <button
                    key={field.id}
                    onClick={() => {
                      onOverflowSelect(field.id);
                      setOverflowOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                  >
                    <span>{field.label}</span>
                    {hasValue && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                  </button>
                );
              })}
            </div>,
            document.body
          )}
      </div>
    );
  }

  // ── Legacy scroll mode render ───────────────────────────────────
  return (
    <div className="relative flex items-center gap-0 min-w-0 max-w-full">
      {/* Left caret + fade */}
      {canScrollLeft && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <CaretLeftIcon size={12} weight="bold" />
          </button>
        </>
      )}

      {/* Scrollable pills */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {fields.map((field) => renderPill(field))}
      </div>

      {/* Right caret + fade */}
      {canScrollRight && (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <CaretRightIcon size={12} weight="bold" />
          </button>
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
  // Replace the standalone `N` placeholder in the backend template (e.g.
  // "Next N days" → "Next 45 days"). `\b` prevents accidental matches
  // inside other words (none today, but cheap to guard against).
  return opt.label.replace(/\bN\b/, nStr);
}
