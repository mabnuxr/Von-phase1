/**
 * SplitFilterDropdown — two-panel dropdown with operator selection on the left
 * and value selection on the right.
 *
 * Left panel: radio-style operator list grouped by category.
 * Right panel: searchable multi-select checklist (for picklist/text),
 *              or text/number/date input (for scalar types).
 *
 * Renders as a portal-based popover anchored to the trigger (children).
 */

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  CheckIcon,
  LockSimpleIcon,
  CaretLeftIcon,
  CaretRightIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import './filter-calendar.css';
import type { FilterFieldConfig, FilterValue } from './ScrollableFilterBar';

// ============================================================================
// Operator Definitions by Field Type
// ============================================================================

interface OperatorDef {
  value: string;
  label: string;
  /** Operators that don't need a value input */
  noValue?: boolean;
  /** Operator directly opens a calendar panel (no option picklist) */
  calendarMode?: 'single' | 'range';
  /** Operator takes an inline number value (for parameterized tokens like Last N Days) */
  numberInput?: { defaultN: number; unit: string };
  /** Render a titled separator line before this operator in the left panel */
  separatorBefore?: string;
  /** Show operator greyed out and non-selectable (e.g. out-of-scope ownership tokens) */
  disabled?: boolean;
}

const DEFAULT_OPERATORS: OperatorDef[] = [
  { value: 'equals', label: 'Equal To' },
  { value: 'not_equals', label: 'Not Equal To' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'greater_than_or_equal', label: 'Greater Than or Equal To' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'less_than_or_equal', label: 'Less Than or Equal To' },
  { value: 'between', label: 'Select Range' },
  { value: 'is_not_blank', label: 'Is Not Blank', noValue: true },
  { value: 'is_blank', label: 'Is Blank', noValue: true },
  { value: 'in_this_quarter', label: 'In This Quarter', noValue: true },
  { value: 'in_next_quarter', label: 'In Next Quarter', noValue: true },
];

function getOperators(field: FilterFieldConfig): OperatorDef[] {
  if (field.customOperators) return field.customOperators;
  return DEFAULT_OPERATORS;
}

function getDefaultOperator(field: FilterFieldConfig): string {
  if (field.defaultOperator) return field.defaultOperator;
  if (field.customOperators?.length) return field.customOperators[0].value;
  return 'equals';
}

// ============================================================================
// Multi-select operators that accept arrays
// ============================================================================

const MULTI_VALUE_OPERATORS = new Set(['in', 'not_in']);
const RANGE_OPERATORS = new Set(['between', 'not_between']);

/**
 * Build the operator-shape-appropriate empty `FilterValue` for an
 * operator. Returns `null` for calendar-mode operators — those are
 * UI-only and the caller handles them via `setDraftOperator` instead of
 * firing `onChange`. Used both by `handleOperatorChange` (when seeding
 * a fresh operator) and by the seed-on-open effect.
 */
function emptyValueForOperator(opDef: OperatorDef | undefined): FilterValue | null {
  if (!opDef) return { operator: 'equals', value: '' };
  if (opDef.calendarMode) return null;
  if (opDef.noValue) return { operator: opDef.value };
  if (opDef.numberInput) {
    return { operator: opDef.value, value: String(opDef.numberInput.defaultN) };
  }
  if (RANGE_OPERATORS.has(opDef.value)) return { operator: opDef.value, value: ['', ''] };
  if (MULTI_VALUE_OPERATORS.has(opDef.value)) return { operator: opDef.value, value: [] };
  return { operator: opDef.value, value: '' };
}
// Operators that accept a free-text value (substring match) — the right
// panel shows a text input instead of the picklist options even when the
// field has a static `options` list.
const TEXT_INPUT_OPERATORS = new Set(['contains', 'not_contains', 'starts_with', 'ends_with']);

// ============================================================================
// Dynamic option helpers — values stored as "dynamic_id:n" e.g. "last_n_days:7"
// ============================================================================

function parseDynamicValue(v: string): { id: string; n: number } | null {
  // Dynamic option ids are uppercase (e.g. "NEXT_N_DAYS:7") on the wire;
  // we also accept lowercase for legacy/storybook fixtures.
  const match = v.match(/^([A-Za-z_]+):(\d+)$/);
  if (!match) return null;
  return { id: match[1], n: parseInt(match[2], 10) };
}

// ============================================================================
// Calendar value helpers — "custom_date:YYYY-MM-DD" / "custom_range:YYYY-MM-DD_YYYY-MM-DD"
// ============================================================================

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseCustomDateValue(v: string): Date | null {
  const match = v.match(/^custom_date:(\d{4}-\d{2}-\d{2})$/);
  if (!match) return null;
  return new Date(match[1] + 'T00:00:00');
}

function parseCustomRangeValue(v: string): DateRange | null {
  const match = v.match(/^custom_range:(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/);
  if (!match) return null;
  return {
    from: new Date(match[1] + 'T00:00:00'),
    to: new Date(match[2] + 'T00:00:00'),
  };
}

/** Check if a calendar option label is "selected" — either directly or via an encoded value */
function isCalendarOptionSelected(
  option: string,
  currentValues: string[],
  calCfg?: { singleDateLabel?: string; dateRangeLabel?: string }
): boolean {
  if (!calCfg) return currentValues.includes(option);
  if (option === calCfg.singleDateLabel) {
    return currentValues.some((v) => v === option || v.startsWith('custom_date:'));
  }
  if (option === calCfg.dateRangeLabel) {
    return currentValues.some((v) => v === option || v.startsWith('custom_range:'));
  }
  return currentValues.includes(option);
}

function makeDynamicValue(id: string, n: number): string {
  return `${id}:${n}`;
}

// ============================================================================
// Props
// ============================================================================

export interface SplitFilterDropdownProps {
  field: FilterFieldConfig;
  value: FilterValue | null;
  onChange: (value: FilterValue | null) => void;
  children: React.ReactNode;
  /** When true, dropdown opens read-only — user can view but not interact */
  locked?: boolean;
  /**
   * Owner-only lock toggle. When provided, the popover footer shows a
   * Lock / Unlock button that calls this handler. Stays interactive even
   * when `locked` is true so the owner can always unlock from within.
   */
  onToggleLock?: () => void;
  /**
   * When `onToggleLock` is provided and the filter is not yet locked, the
   * Lock button is disabled unless `canLock` is true — mirrors Apply's rule
   * that a filter must have a complete value before it can be committed.
   * Ignored when the filter is already locked (Unlock is always enabled).
   * Defaults to true for back-compat.
   */
  canLock?: boolean;
  /**
   * When provided, clicking the popover's Apply button commits pending
   * changes via this handler (in addition to closing the popover). With
   * no handler, Apply just closes.
   */
  onApply?: () => void;
  /**
   * True while a PATCH is in flight (Apply or Lock commit). Used to show
   * a spinner + disabled state on the Apply and Lock buttons so the user
   * gets feedback before the server response resets the lock/value state.
   */
  isApplying?: boolean;
  /**
   * True when there are pending filter changes that could be committed.
   * When false, Apply is disabled (nothing to commit).
   * Defaults to true for back-compat (storybook / unconnected usages).
   */
  canApply?: boolean;
  /**
   * Called when the Clear button is clicked. When provided, takes
   * precedence over the default behavior (local `onChange(null)`) and
   * is expected to commit the clear to the server immediately. The
   * popover still closes after Clear.
   */
  onClear?: () => void;
  /**
   * Called when the popover closes WITHOUT Apply (outside click, chip
   * toggle, Escape). Lets the parent revert unapplied local state so
   * stale changes don't leak into the next Apply of a different filter.
   */
  onDismiss?: () => void;
  /** When true, the popover opens on mount (one-shot). Used by the
   *  overflow "+" button to auto-open a newly promoted filter. */
  defaultOpen?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const SplitFilterDropdown: React.FC<SplitFilterDropdownProps> = ({
  field,
  value,
  onChange,
  children,
  locked = false,
  onToggleLock,
  canLock = true,
  onApply,
  isApplying = false,
  canApply = true,
  onClear,
  onDismiss,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedOperatorRef = useRef<HTMLButtonElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [search, setSearch] = useState('');
  // Track numeric inputs for dynamic options keyed by dynamic option id
  const [dynamicInputs, setDynamicInputs] = useState<Record<string, number>>({});
  /**
   * Transient draft string per dynamic option — lets the user clear the
   * input entirely while typing (parseInt would snap empty → 1 otherwise).
   * Holds whatever the user typed; the committed number in `dynamicInputs`
   * (and the emitted filter value) only updates when the draft parses to
   * a valid positive integer. Cleared on popover close.
   */
  const [dynamicInputDrafts, setDynamicInputDrafts] = useState<Record<string, string>>({});
  /**
   * Per-operator value memory — retained while the popover is open so
   * switching Is → Is blank → Is brings back the value the user had on
   * Is. Cleared on close (see useEffect below).
   */
  const [operatorMemory, setOperatorMemory] = useState<Record<string, FilterValue>>({});

  const operators = useMemo(() => getOperators(field), [field]);
  /**
   * Draft operator — tracks a calendarMode operator the user clicked
   * before picking dates. We can't fire onChange yet (the round-trip
   * would mangle the UI-only operator), so we hold it locally until the
   * calendar handler fires with a value. Cleared on popover close.
   */
  const [draftOperator, setDraftOperator] = useState<string | null>(null);
  const currentOperator = draftOperator ?? value?.operator ?? getDefaultOperator(field);
  const currentValues = value?.value
    ? Array.isArray(value.value)
      ? value.value
      : [value.value]
    : [];
  const isMulti = MULTI_VALUE_OPERATORS.has(currentOperator);
  const isRange = RANGE_OPERATORS.has(currentOperator);
  const useTextInput = TEXT_INPUT_OPERATORS.has(currentOperator);
  const operatorDef = operators.find((o) => o.value === currentOperator);
  const isNoValue = operatorDef?.noValue ?? false;

  // Which dynamic options are currently selected (by id)
  const selectedDynamicIds = useMemo(() => {
    const ids = new Set<string>();
    for (const v of currentValues) {
      const parsed = parseDynamicValue(v);
      if (parsed) ids.add(parsed.id);
    }
    return ids;
  }, [currentValues]);

  // Calendar state
  const calCfg = field.calendarOptions;
  const activeCalendarMode = useMemo<'single' | 'range' | null>(() => {
    // Operator-driven calendar: the operator itself opens a calendar panel
    if (operatorDef?.calendarMode) return operatorDef.calendarMode;
    // Option-driven calendar: a calendar option is selected in the value list
    if (!calCfg) return null;
    for (const v of currentValues) {
      if (v === calCfg.singleDateLabel || v.startsWith('custom_date:')) return 'single';
      if (v === calCfg.dateRangeLabel || v.startsWith('custom_range:')) return 'range';
    }
    return null;
  }, [calCfg, currentValues, operatorDef?.calendarMode]);

  const [calendarDate, setCalendarDate] = useState<Date | undefined>();
  const [calendarRange, setCalendarRange] = useState<DateRange | undefined>();

  // Initialize calendar from existing values on open
  const initCalendar = useCallback(() => {
    let foundDate: Date | undefined;
    let foundRange: DateRange | undefined;
    for (const v of currentValues) {
      const d = parseCustomDateValue(v);
      if (d) foundDate = d;
      const r = parseCustomRangeValue(v);
      if (r) foundRange = r;
    }
    setCalendarDate(foundDate);
    setCalendarRange(foundRange);
  }, [currentValues]);

  // Resolve all options and dynamic options (flat or from optionGroups)
  const allOptions = useMemo(() => {
    if (field.optionGroups) {
      return field.optionGroups.flatMap((g) => g.options ?? []);
    }
    return field.options ?? [];
  }, [field.optionGroups, field.options]);

  const allDynamicOptions = useMemo(() => {
    if (field.optionGroups) {
      return field.optionGroups.flatMap((g) => g.dynamicOptions ?? []);
    }
    return field.dynamicOptions ?? [];
  }, [field.optionGroups, field.dynamicOptions]);

  // Initialize dynamicInputs from current values on open
  const initDynamicInputs = useCallback(() => {
    if (allDynamicOptions.length === 0) return;
    const inputs: Record<string, number> = {};
    for (const v of currentValues) {
      const parsed = parseDynamicValue(v);
      if (parsed) inputs[parsed.id] = parsed.n;
    }
    // Fill defaults for un-selected ones
    for (const opt of allDynamicOptions) {
      if (!(opt.id in inputs)) {
        inputs[opt.id] = opt.defaultN ?? 7;
      }
    }
    setDynamicInputs(inputs);
  }, [allDynamicOptions, currentValues]);

  // Compute position from trigger rect
  const isOperatorDrivenCalendar = operatorDef?.calendarMode != null;
  const hasNumberInputOp = operatorDef?.numberInput != null;
  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const hasCalendar = activeCalendarMode !== null;
    // When the calendar is operator-driven (no option picklist), the base is
    // just the narrow operator column. Otherwise use the full two-panel width.
    const baseWidth =
      isOperatorDrivenCalendar || hasNumberInputOp
        ? 260
        : field.type === 'picklist' || field.options?.length
          ? 640
          : 500;
    const popoverWidth = hasCalendar
      ? activeCalendarMode === 'range'
        ? baseWidth + 540
        : baseWidth + 280
      : baseWidth;
    const popoverHeight = 310;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const left = Math.max(8, Math.min(rect.left, viewportWidth - popoverWidth - 8));
    const spaceBelow = viewportHeight - rect.bottom;
    const top = spaceBelow >= popoverHeight + 8 ? rect.bottom + 6 : rect.top - popoverHeight - 6;
    setPopoverStyle({
      position: 'fixed',
      top,
      left,
      zIndex: 10000,
    });
  }, [
    field.type,
    field.options?.length,
    activeCalendarMode,
    isOperatorDrivenCalendar,
    hasNumberInputOp,
  ]);

  // A locked filter without an `onToggleLock` handler belongs to a
  // non-owner viewer — they can see the pinned value on the chip but
  // have no interaction to perform inside the popover, so don't let
  // them open it.
  const viewOnly = locked && !onToggleLock;

  const handleToggle = useCallback(() => {
    if (viewOnly) return;
    if (isOpen) {
      setIsOpen(false);
      setSearch('');
      if (onDismiss) onDismiss();
    } else {
      computePosition();
      initDynamicInputs();
      initCalendar();
      setIsOpen(true);
    }
  }, [viewOnly, isOpen, computePosition, initDynamicInputs, initCalendar, onDismiss]);

  // Auto-open when defaultOpen transitions to true. Only watches
  // `defaultOpen` — NOT the callbacks, because computePosition depends
  // on activeCalendarMode, and re-running this effect when the calendar
  // mode changes collapses the calendar picker mid-interaction.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (!defaultOpen) {
      autoOpened.current = false;
      return;
    }
    if (autoOpened.current || isOpen) return;
    autoOpened.current = true;
    const id = requestAnimationFrame(() => {
      computePosition();
      initDynamicInputs();
      initCalendar();
      setIsOpen(true);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOpen]);

  // Clear per-operator value memory on every close so each session starts
  // fresh (the user's expectation: memory persists while the popover is
  // open, forgets once it closes).
  useEffect(() => {
    if (!isOpen) {
      setOperatorMemory({});
      setDynamicInputDrafts({});
      setDraftOperator(null);
    }
  }, [isOpen]);

  // On open, bring the currently-selected operator into view so users
  // don't have to hunt for it when it lives near the bottom of the list
  // (e.g. "Is not blank" on a date filter).
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      selectedOperatorRef.current?.scrollIntoView({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  // On open, seed the popover's default operator into the filter value
  // when the filter is empty — so the chip label matches the operator
  // the popover has visually highlighted in its left panel. The seeded
  // value is incomplete (empty string / empty array), so `canApply` stays
  // false until the user provides a real value. Closing without Apply
  // reverts via `onDismiss` → the hook's revert path.
  useEffect(() => {
    if (!isOpen || value != null) return;
    const opDef = operators.find((o) => o.value === getDefaultOperator(field));
    if (opDef?.calendarMode) {
      setDraftOperator(opDef.value);
      return;
    }
    const empty = emptyValueForOperator(opDef);
    if (empty) onChange(empty);
    // Intentionally only watch `isOpen` — we seed once per opening and
    // don't want to resurrect the default after the user picks another
    // operator (which would flip `value` from null to non-null anyway).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on outside click
  useLayoutEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
        if (onDismiss) onDismiss();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onDismiss]);

  const handleOperatorChange = (op: string) => {
    // Clear draft operator when switching away from a calendarMode operator
    if (draftOperator) setDraftOperator(null);

    // Save whatever value the user had on the operator they're leaving, so
    // switching back brings it into view again (until the popover closes).
    if (value && currentOperator !== op) {
      setOperatorMemory((prev) => ({ ...prev, [currentOperator]: value }));
    }

    // If we've seen a value on this operator during this session, restore it.
    const remembered = operatorMemory[op];
    if (remembered) {
      onChange({ ...remembered, operator: op });
      return;
    }

    // First time switching to this operator in this session — apply the
    // shape-appropriate empty state.
    const opDef = operators.find((o) => o.value === op);
    if (opDef?.calendarMode) {
      // Calendar-driven operator: hold locally until the user picks a date.
      // Firing onChange here would round-trip through fromFilterBarValue →
      // toFilterBarValue which mangles UI-only operators like "custom_date".
      setDraftOperator(op);
      setCalendarDate(undefined);
      setCalendarRange(undefined);
      return;
    }
    // Carry a pre-existing scalar value over — covers the common case of
    // switching between `equals` / `not_equals` without re-picking. Skip
    // for operator shapes (noValue / numberInput / range / multi) where
    // the existing scalar wouldn't fit.
    const isPlainScalar =
      !opDef?.noValue &&
      !opDef?.numberInput &&
      !RANGE_OPERATORS.has(op) &&
      !MULTI_VALUE_OPERATORS.has(op);
    if (isPlainScalar && value && !Array.isArray(value.value)) {
      onChange({ ...value, operator: op });
      return;
    }
    const empty = emptyValueForOperator(opDef);
    if (empty) onChange(empty);
  };

  const handleToggleOption = (option: string) => {
    const isSingleCal = calCfg?.singleDateLabel === option;
    const isRangeCal = calCfg?.dateRangeLabel === option;
    const isCalendarOption = isSingleCal || isRangeCal;

    // Calendar option in non-multi mode (single-value OR range operator):
    // replace the current value. A "Custom Date" / "Custom Range" pick is
    // always a fresh choice — never concatenated with whatever range
    // placeholder (`['', '']`) or prior token was there.
    if (!isMulti && isCalendarOption) {
      const wasActive = currentValues.some((v) =>
        isSingleCal
          ? v === option || v.startsWith('custom_date:')
          : v === option || v.startsWith('custom_range:')
      );
      if (wasActive) {
        if (isSingleCal) setCalendarDate(undefined);
        if (isRangeCal) setCalendarRange(undefined);
        onChange(null);
      } else {
        setCalendarDate(undefined);
        setCalendarRange(undefined);
        onChange({ operator: currentOperator, value: option });
      }
      return;
    }

    // Single-value operators (equals / not_equals / etc. — i.e. !isMulti)
    // use radio semantics on a non-calendar option: clicking a different
    // option replaces the current value; clicking the already-selected
    // option clears it.
    if (!isMulti && !isCalendarOption) {
      const isCurrent = currentValues.length === 1 && currentValues[0] === option;
      onChange(isCurrent ? null : { operator: currentOperator, value: option });
      return;
    }

    // Multi-select (in / not_in): accumulate in an array.
    // Build current set, removing any encoded calendar values for this type
    const current = new Set(
      currentValues.filter((v) => {
        if (isSingleCal) return !v.startsWith('custom_date:') && v !== calCfg?.singleDateLabel;
        if (isRangeCal) return !v.startsWith('custom_range:') && v !== calCfg?.dateRangeLabel;
        return v !== option;
      })
    );

    // If unchecking a calendar option, also clear its calendar state
    const wasActive = currentValues.some((v) =>
      isSingleCal
        ? v === option || v.startsWith('custom_date:')
        : isRangeCal
          ? v === option || v.startsWith('custom_range:')
          : v === option
    );

    if (!wasActive) {
      // Checking: if this is a calendar option, add the label as placeholder
      // If checking single cal, remove any range cal values and vice versa
      if (isSingleCal) {
        // Remove range calendar values
        for (const v of [...current]) {
          if (v === calCfg?.dateRangeLabel || v.startsWith('custom_range:')) current.delete(v);
        }
        setCalendarRange(undefined);
        setCalendarDate(undefined);
      } else if (isRangeCal) {
        // Remove single calendar values
        for (const v of [...current]) {
          if (v === calCfg?.singleDateLabel || v.startsWith('custom_date:')) current.delete(v);
        }
        setCalendarDate(undefined);
        setCalendarRange(undefined);
      }
      current.add(option);
    } else {
      // Unchecking
      if (isSingleCal) setCalendarDate(undefined);
      if (isRangeCal) setCalendarRange(undefined);
    }

    const arr = Array.from(current);
    if (arr.length === 0) {
      onChange(null);
    } else {
      onChange({ operator: currentOperator, value: arr });
    }
  };

  // Calendar date selection handlers
  const handleCalendarDateSelect = (date: Date | undefined) => {
    setCalendarDate(date);
    if (!date) return;
    const encoded = `custom_date:${formatDateISO(date)}`;
    if (!isMulti) {
      onChange({ operator: currentOperator, value: encoded });
      setDraftOperator(null);
      return;
    }
    // Multi-select: replace any prior single-date entry in the array.
    const next = currentValues
      .filter((v) => v !== calCfg?.singleDateLabel && !v.startsWith('custom_date:'))
      .concat(encoded);
    onChange({ operator: currentOperator, value: next });
    setDraftOperator(null);
  };

  const handleCalendarRangeSelect = (range: DateRange | undefined) => {
    setCalendarRange(range);
    if (!range?.from) return;
    // react-day-picker v9 sets from === to on the first click.
    // Treat same-date from/to as a partial selection (first click only)
    // so the calendar stays open for the user to pick the end date.
    if (!range.to || formatDateISO(range.from) === formatDateISO(range.to)) {
      return;
    }
    const encoded = `custom_range:${formatDateISO(range.from)}_${formatDateISO(range.to)}`;
    if (!isMulti) {
      onChange({ operator: currentOperator, value: encoded });
      setDraftOperator(null);
      return;
    }
    const next = currentValues
      .filter((v) => v !== calCfg?.dateRangeLabel && !v.startsWith('custom_range:'))
      .concat(encoded);
    onChange({ operator: currentOperator, value: next });
    setDraftOperator(null);
  };

  // Recompute position when calendar mode changes
  useLayoutEffect(() => {
    if (isOpen) computePosition();
  }, [activeCalendarMode, isOpen, computePosition]);

  const handleTextValueChange = (val: string) => {
    if (!val) {
      onChange(null);
    } else {
      onChange({ operator: currentOperator, value: val });
    }
  };

  const handleRangeChange = (index: 0 | 1, val: string) => {
    const current = Array.isArray(value?.value) ? [...value.value] : ['', ''];
    current[index] = val;
    if (!current[0] && !current[1]) {
      onChange(null);
    } else {
      onChange({ operator: currentOperator, value: current });
    }
  };

  const handleToggleDynamicOption = (optId: string) => {
    const n = dynamicInputs[optId] ?? allDynamicOptions.find((o) => o.id === optId)?.defaultN ?? 7;
    const dynValue = makeDynamicValue(optId, n);

    // Non-multi (single-value / range operator): replace the whole value.
    // The backend dynamic resolver accepts a single token string on range
    // operators and expands it to [start, end] at query time.
    if (!isMulti) {
      if (selectedDynamicIds.has(optId)) {
        onChange(null);
      } else {
        onChange({ operator: currentOperator, value: dynValue });
      }
      return;
    }

    // Multi-select: toggle this dynamic value within the array.
    if (selectedDynamicIds.has(optId)) {
      const next = currentValues.filter((v) => {
        const p = parseDynamicValue(v);
        return !p || p.id !== optId;
      });
      if (next.length === 0) {
        onChange(null);
      } else {
        onChange({ operator: currentOperator, value: next });
      }
    } else {
      const next = [...currentValues, dynValue];
      onChange({ operator: currentOperator, value: next });
    }
  };

  const handleDynamicInputChange = (optId: string, raw: string) => {
    // Always record the draft so the user can type freely (including
    // transient empty state during editing).
    setDynamicInputDrafts((prev) => ({ ...prev, [optId]: raw }));

    const parsed = parseInt(raw, 10);
    const isValid = raw !== '' && !isNaN(parsed) && parsed >= 1;
    if (!isValid) {
      // Don't touch `dynamicInputs` or the emitted filter value — keep the
      // last valid N so nothing commits until the user types a real number.
      return;
    }
    setDynamicInputs((prev) => ({ ...prev, [optId]: parsed }));
    if (selectedDynamicIds.has(optId)) {
      const newDynValue = makeDynamicValue(optId, parsed);
      if (!isMulti) {
        onChange({ operator: currentOperator, value: newDynValue });
        return;
      }
      const next = currentValues.map((v) => {
        const p = parseDynamicValue(v);
        if (p && p.id === optId) return newDynValue;
        return v;
      });
      onChange({ operator: currentOperator, value: next });
    }
  };

  // True when any *selected* dynamic option has an empty / invalid draft.
  // Used to disable Apply / Lock — the filter value is stale in this state
  // and committing it would be confusing.
  const hasInvalidDynamicInput = useMemo(() => {
    for (const id of selectedDynamicIds) {
      const draft = dynamicInputDrafts[id];
      if (draft === undefined) continue;
      const parsed = parseInt(draft, 10);
      if (draft === '' || isNaN(parsed) || parsed < 1) return true;
    }
    return false;
  }, [selectedDynamicIds, dynamicInputDrafts]);

  const handleClear = () => {
    // If the adapter wires `onClear`, delegate — it's responsible for
    // committing the clear to the server. Otherwise fall back to
    // local-only clear (storybook / unconnected usage).
    if (onClear) onClear();
    else onChange(null);
    // Wipe per-operator memory synchronously so the popover can't show
    // a remembered value from another operator during the close animation
    // or on an immediate reopen.
    setOperatorMemory({});
    setIsOpen(false);
    setSearch('');
  };

  // Operator-aware applicability — lookup an option/dynamic-option against
  // the per-group whitelist. Absence of a whitelist entry means "always
  // applicable"; presence restricts to listed operators.
  const isOptionApplicable = useCallback(
    (group: { optionApplicability?: Record<string, string[]> } | undefined, option: string) => {
      const allow = group?.optionApplicability?.[option];
      return !allow || allow.includes(currentOperator);
    },
    [currentOperator]
  );
  const isDynamicOptionApplicable = useCallback(
    (group: { dynamicOptionApplicability?: Record<string, string[]> } | undefined, id: string) => {
      const allow = group?.dynamicOptionApplicability?.[id];
      return !allow || allow.includes(currentOperator);
    },
    [currentOperator]
  );

  const filteredOptions = useMemo(() => {
    if (allOptions.length === 0) return [];
    // Flat `options` (no group) have no applicability map — only search
    // filtering applies in this path.
    if (!search) return allOptions;
    const q = search.toLowerCase();
    return allOptions.filter((o) => o.toLowerCase().includes(q));
  }, [allOptions, search]);

  // Build filtered groups for grouped rendering
  const filteredGroups = useMemo(() => {
    if (!field.optionGroups) return null;
    const q = search.toLowerCase();
    return field.optionGroups
      .map((g) => ({
        ...g,
        options: g.options?.filter(
          (o) => isOptionApplicable(g, o) && (!search || o.toLowerCase().includes(q))
        ),
        // Dynamic options don't search-filter but are subject to applicability.
        dynamicOptions: g.dynamicOptions?.filter((d) => isDynamicOptionApplicable(g, d.id)),
      }))
      .filter(
        (g) =>
          (g.options && g.options.length > 0) || (g.dynamicOptions && g.dynamicOptions.length > 0)
      );
  }, [field.optionGroups, search, isOptionApplicable, isDynamicOptionApplicable]);

  // `hasOptions` / `hasDynamicOptions` drive which right-panel section
  // renders. When grouped, derive from the post-applicability view so an
  // operator whose applicable set is empty falls back to the single input.
  const hasOptions = useMemo(() => {
    if (field.optionGroups) {
      return (filteredGroups ?? []).some((g) => g.options && g.options.length > 0);
    }
    return allOptions.length > 0;
  }, [field.optionGroups, filteredGroups, allOptions]);
  const hasDynamicOptions = useMemo(() => {
    if (field.optionGroups) {
      return (filteredGroups ?? []).some((g) => g.dynamicOptions && g.dynamicOptions.length > 0);
    }
    return allDynamicOptions.length > 0;
  }, [field.optionGroups, filteredGroups, allDynamicOptions]);
  // N-parameterized operator with invalid/empty number input — disables Apply/Lock.
  const hasInvalidNumberInput = operatorDef?.numberInput
    ? (() => {
        const nv = value?.value;
        if (!nv || typeof nv !== 'string') return true;
        const n = parseInt(nv, 10);
        return nv === '' || isNaN(n) || n < 1;
      })()
    : false;

  // Calendar-mode operators show the calendar directly (no option list needed)
  const showRightPanel = !isNoValue && !operatorDef?.calendarMode;

  // Render the selection indicator for an option row. Single-value operators
  // (equals / not_equals / etc.) use a radio dot so the UI signals
  // "pick one"; multi-value operators (in / not_in) use a checkbox square.
  const renderSelectionIndicator = (isSelected: boolean) => {
    if (isMulti) {
      return (
        <div
          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? locked
                ? 'bg-gray-400 border-gray-400'
                : 'bg-gray-900 border-gray-900'
              : locked
                ? 'bg-gray-100 border-gray-300'
                : 'bg-white border-gray-300'
          }`}
        >
          {isSelected && <CheckIcon size={10} weight="bold" className="text-white" />}
        </div>
      );
    }
    return (
      <div
        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isSelected ? (locked ? 'bg-gray-400' : 'bg-gray-900') : 'border-[1.5px] border-gray-300'
        }`}
      >
        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    );
  };

  return (
    <>
      <div ref={triggerRef} onClick={handleToggle} className="inline-flex">
        {children}
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={popoverStyle}
              className={`rounded-xl border border-gray-100 shadow-lg flex flex-col ${locked || isApplying ? 'bg-gray-50' : 'bg-white'}`}
              // Stop mousedown from bubbling to document. When this
              // dropdown is nested inside another popover (e.g. the
              // per-widget filters popover), the parent's document-level
              // outside-click handler would otherwise treat clicks here
              // as "outside" and close the parent.
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Locked banner — shown whenever the filter is locked OR a
                  PATCH is in flight. During `isApplying` we dim the whole
                  body so the user can't interact with operators/options
                  until the request settles. */}
              {locked && (
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                  <LockSimpleIcon size={12} className="text-gray-700 shrink-0" />
                  <span className="text-xs text-gray-700">
                    Filters are locked by the admin, can't be edited.
                  </span>
                </div>
              )}
              {/* Body: multi-column split */}
              <div
                className={`flex min-h-0 ${locked || isApplying ? 'pointer-events-none opacity-70' : ''} ${activeCalendarMode ? 'h-[280px]' : 'h-[240px]'}`}
              >
                {/* Left panel — Operators: fixed width when right panel or calendar is
                    visible, full width when it's the sole column (all noValue operators). */}
                <div
                  className={`flex flex-col ${showRightPanel || activeCalendarMode ? 'w-[200px] shrink-0 border-r border-gray-100' : 'flex-1'}`}
                >
                  <div className="flex-1 overflow-y-auto py-1 pl-1 pr-2">
                    {operators.map((op, i) => (
                      <React.Fragment key={op.value}>
                        {op.separatorBefore && (
                          <div className="px-2.5 pt-1.5 pb-0.5">
                            {i > 0 && <div className="border-t border-gray-100 mb-1.5" />}
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                              {op.separatorBefore}
                            </span>
                          </div>
                        )}
                        <button
                          ref={currentOperator === op.value ? selectedOperatorRef : null}
                          onClick={op.disabled ? undefined : () => handleOperatorChange(op.value)}
                          disabled={op.disabled}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl border text-left transition-colors ${
                            op.disabled
                              ? 'border-transparent text-gray-300 cursor-not-allowed'
                              : locked
                                ? currentOperator === op.value
                                  ? 'bg-gray-100 border-gray-100 text-gray-700 font-medium cursor-default'
                                  : 'border-transparent text-gray-700 cursor-default'
                                : currentOperator === op.value
                                  ? 'bg-gray-50 border-gray-100 text-gray-900 font-medium cursor-pointer'
                                  : 'border-transparent text-gray-800 hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                              op.disabled
                                ? 'border-[1.5px] border-gray-200'
                                : currentOperator === op.value
                                  ? locked
                                    ? 'bg-gray-400'
                                    : 'bg-gray-900'
                                  : locked
                                    ? 'border-[1.5px] border-gray-300'
                                    : 'border-[1.5px] border-gray-300'
                            }`}
                          >
                            {currentOperator === op.value && !op.disabled && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          {op.label}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Right panel — Values: fixed search, scrollable list */}
                {showRightPanel && (
                  <div className="flex-1 min-w-[320px] flex flex-col min-h-0">
                    {/* Number input for N-parameterized operators (e.g. Last N Days) */}
                    {operatorDef?.numberInput ? (
                      <div className="px-3 py-4 flex flex-col gap-2">
                        <label className="text-[11px] text-gray-700">
                          Enter number of {operatorDef.numberInput.unit}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={
                              typeof value?.value === 'string'
                                ? value.value
                                : String(operatorDef.numberInput.defaultN)
                            }
                            onChange={
                              locked
                                ? undefined
                                : (e) => {
                                    onChange({ operator: currentOperator, value: e.target.value });
                                  }
                            }
                            readOnly={locked}
                            className={`w-20 px-2.5 py-1.5 text-xs border rounded-lg text-center focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              locked
                                ? 'text-gray-700 bg-gray-100 border-gray-200 caret-transparent cursor-default'
                                : 'text-gray-900 bg-white border-gray-200 focus:border-gray-300'
                            }`}
                            autoFocus={!locked}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-gray-700">
                            {operatorDef.numberInput.unit}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Inline search — fixed at top (hidden for text-input operators) */}
                        {hasOptions && !useTextInput && (
                          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0">
                            <MagnifyingGlassIcon
                              size={13}
                              className={`shrink-0 ${locked ? 'text-gray-400' : 'text-gray-700'}`}
                            />
                            <input
                              type="text"
                              value={search}
                              onChange={locked ? undefined : (e) => setSearch(e.target.value)}
                              placeholder="Search..."
                              readOnly={locked}
                              className={`flex-1 bg-transparent text-xs outline-none ${locked ? 'text-gray-700 placeholder:text-gray-500 cursor-default caret-transparent' : 'text-gray-900 placeholder:text-gray-700'}`}
                              autoFocus={!locked}
                            />
                          </div>
                        )}

                        {/* Option list (picklist) — scrollable. Hidden for text-
                        input operators (contains/starts_with/etc.) even when
                        the field has a picklist `options` list, since those
                        operators take a free-text substring instead. */}
                        {(hasOptions || hasDynamicOptions) && !useTextInput && (
                          <div className="flex-1 overflow-y-auto py-1 pl-1 pr-2">
                            {/* Grouped rendering */}
                            {filteredGroups ? (
                              <>
                                {filteredGroups.map((group, gi) => {
                                  const groupOptions = group.options ?? [];
                                  const groupDynamic = group.dynamicOptions ?? [];
                                  if (groupOptions.length === 0 && groupDynamic.length === 0)
                                    return null;
                                  return (
                                    <React.Fragment key={gi}>
                                      {/* Section title with separator */}
                                      {group.title && (
                                        <div className="px-3 pt-2 pb-1">
                                          {gi > 0 && (
                                            <div className="border-t border-gray-100 mb-2" />
                                          )}
                                          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                            {group.title}
                                          </span>
                                        </div>
                                      )}
                                      {/* Static options */}
                                      {groupOptions.map((option) => {
                                        const isSelected = isCalendarOptionSelected(
                                          option,
                                          currentValues,
                                          calCfg
                                        );
                                        return (
                                          <button
                                            key={option}
                                            onClick={() => handleToggleOption(option)}
                                            className={`w-full flex items-center gap-2 border border-transparent rounded-xl px-3 py-1.5 text-xs text-left transition-colors ${locked ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}
                                          >
                                            {renderSelectionIndicator(isSelected)}
                                            <span
                                              className={
                                                locked
                                                  ? 'text-gray-700'
                                                  : isSelected
                                                    ? 'text-gray-900 font-medium'
                                                    : 'text-gray-800'
                                              }
                                            >
                                              {option}
                                            </span>
                                          </button>
                                        );
                                      })}
                                      {/* Dynamic options */}
                                      {groupDynamic.map((opt) => {
                                        const isSelected = selectedDynamicIds.has(opt.id);
                                        const draft = dynamicInputDrafts[opt.id];
                                        const n =
                                          draft !== undefined
                                            ? draft
                                            : String(dynamicInputs[opt.id] ?? opt.defaultN ?? 7);
                                        return (
                                          <div key={opt.id}>
                                            <button
                                              onClick={() => handleToggleDynamicOption(opt.id)}
                                              className={`w-full flex items-center gap-2 border border-transparent rounded-xl px-3 py-1.5 text-xs text-left transition-colors ${locked ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}
                                            >
                                              {renderSelectionIndicator(isSelected)}
                                              <span
                                                className={
                                                  locked
                                                    ? 'text-gray-700'
                                                    : isSelected
                                                      ? 'text-gray-900 font-medium'
                                                      : 'text-gray-800'
                                                }
                                              >
                                                {opt.label}
                                              </span>
                                            </button>
                                            {isSelected && (
                                              <div className="flex items-center gap-1.5 pl-[30px] pr-3 pb-1.5">
                                                <input
                                                  type="number"
                                                  min={1}
                                                  value={n}
                                                  onChange={
                                                    locked
                                                      ? undefined
                                                      : (e) =>
                                                          handleDynamicInputChange(
                                                            opt.id,
                                                            e.target.value
                                                          )
                                                  }
                                                  readOnly={locked}
                                                  className={`w-14 px-2 py-1 text-xs border rounded-lg text-center focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                    locked
                                                      ? 'text-gray-700 bg-gray-100 border-gray-200 caret-transparent cursor-default'
                                                      : 'text-gray-900 bg-white border-gray-200 focus:border-gray-300'
                                                  }`}
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                                {opt.unit && (
                                                  <span className="text-xs text-gray-700">
                                                    {opt.unit}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </React.Fragment>
                                  );
                                })}
                                {filteredGroups.length === 0 && (
                                  <div className="px-3 py-3 text-xs text-gray-400 text-center">
                                    No matches
                                  </div>
                                )}
                              </>
                            ) : (
                              /* Flat rendering (backward-compatible) */
                              <>
                                {filteredOptions.map((option) => {
                                  const isSelected = isCalendarOptionSelected(
                                    option,
                                    currentValues,
                                    calCfg
                                  );
                                  return (
                                    <button
                                      key={option}
                                      onClick={() => handleToggleOption(option)}
                                      className={`w-full flex items-center gap-2 border border-transparent rounded-xl px-3 py-1.5 text-xs text-left transition-colors ${locked ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}
                                    >
                                      {renderSelectionIndicator(isSelected)}
                                      <span
                                        className={
                                          locked
                                            ? 'text-gray-700'
                                            : isSelected
                                              ? 'text-gray-900 font-medium'
                                              : 'text-gray-800'
                                        }
                                      >
                                        {option}
                                      </span>
                                    </button>
                                  );
                                })}
                                {filteredOptions.length === 0 && !hasDynamicOptions && (
                                  <div className="px-3 py-3 text-xs text-gray-400 text-center">
                                    No matches
                                  </div>
                                )}
                                {/* Dynamic options with inline number inputs */}
                                {hasDynamicOptions && !field.optionGroups && (
                                  <>
                                    {field.dynamicOptions!.map((opt) => {
                                      const isSelected = selectedDynamicIds.has(opt.id);
                                      const draft = dynamicInputDrafts[opt.id];
                                      const n =
                                        draft !== undefined
                                          ? draft
                                          : String(dynamicInputs[opt.id] ?? opt.defaultN ?? 7);
                                      return (
                                        <div key={opt.id}>
                                          <button
                                            onClick={() => handleToggleDynamicOption(opt.id)}
                                            className={`w-full flex items-center gap-2 border border-transparent rounded-xl px-3 py-1.5 text-xs text-left transition-colors ${locked ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}
                                          >
                                            {renderSelectionIndicator(isSelected)}
                                            <span
                                              className={
                                                locked
                                                  ? 'text-gray-700'
                                                  : isSelected
                                                    ? 'text-gray-900 font-medium'
                                                    : 'text-gray-800'
                                              }
                                            >
                                              {opt.label}
                                            </span>
                                          </button>
                                          {isSelected && (
                                            <div className="flex items-center gap-1.5 pl-[30px] pr-3 pb-1.5">
                                              <input
                                                type="number"
                                                min={1}
                                                value={n}
                                                onChange={
                                                  locked
                                                    ? undefined
                                                    : (e) =>
                                                        handleDynamicInputChange(
                                                          opt.id,
                                                          e.target.value
                                                        )
                                                }
                                                readOnly={locked}
                                                className={`w-14 px-2 py-1 text-xs border rounded-lg text-center focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                  locked
                                                    ? 'text-gray-700 bg-gray-100 border-gray-200 caret-transparent cursor-default'
                                                    : 'text-gray-900 bg-white border-gray-200 focus:border-gray-300'
                                                }`}
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                              {opt.unit && (
                                                <span className="text-xs text-gray-700">
                                                  {opt.unit}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Between range input (number or date) — not applicable
                        when the operator is a text-input one. */}
                        {!hasOptions && isRange && !useTextInput && (
                          <div className="px-3 py-2.5 flex flex-col gap-1">
                            <div>
                              <label className="text-[11px] text-gray-700 mb-1 block">From</label>
                              <input
                                type={field.type === 'number' ? 'number' : 'date'}
                                value={Array.isArray(value?.value) ? (value.value[0] ?? '') : ''}
                                onChange={
                                  locked ? undefined : (e) => handleRangeChange(0, e.target.value)
                                }
                                readOnly={locked}
                                placeholder="From"
                                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none transition-colors ${
                                  locked
                                    ? 'text-gray-700 bg-gray-100 border-gray-200 caret-transparent cursor-default'
                                    : 'text-gray-900 bg-white border-gray-200 placeholder:text-gray-400 focus:border-gray-300'
                                }`}
                                autoFocus={!locked}
                              />
                            </div>
                            <div className="text-center text-xs text-gray-700">to</div>
                            <div className="-mt-3">
                              <label className="text-[11px] text-gray-700 mb-1 block">To</label>
                              <input
                                type={field.type === 'number' ? 'number' : 'date'}
                                value={Array.isArray(value?.value) ? (value.value[1] ?? '') : ''}
                                onChange={
                                  locked ? undefined : (e) => handleRangeChange(1, e.target.value)
                                }
                                readOnly={locked}
                                placeholder="To"
                                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none transition-colors ${
                                  locked
                                    ? 'text-gray-700 bg-gray-100 border-gray-200 caret-transparent cursor-default'
                                    : 'text-gray-900 bg-white border-gray-200 placeholder:text-gray-400 focus:border-gray-300'
                                }`}
                              />
                            </div>
                          </div>
                        )}

                        {/* Text / number / date single input.
                        Also used for text-input operators (contains /
                        not_contains / starts_with / ends_with) even when
                        the field has a picklist `options` list — those
                        operators expect a free-text substring. */}
                        {(!hasOptions || useTextInput) && !isRange && (
                          <div className="px-3 py-2.5">
                            <input
                              type={
                                useTextInput
                                  ? 'text'
                                  : field.type === 'number'
                                    ? 'number'
                                    : field.type === 'date'
                                      ? 'date'
                                      : 'text'
                              }
                              value={typeof value?.value === 'string' ? value.value : ''}
                              onChange={
                                locked ? undefined : (e) => handleTextValueChange(e.target.value)
                              }
                              readOnly={locked}
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                              className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none transition-colors ${
                                locked
                                  ? 'text-gray-700 bg-gray-100 border-gray-200 caret-transparent cursor-default'
                                  : 'text-gray-900 bg-white border-gray-200 placeholder:text-gray-400 focus:border-gray-300'
                              }`}
                              autoFocus={!locked}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* No right panel for no-value operators — left panel stands alone */}

                {/* Calendar panel — appears when Custom Date or Custom Range is checked.
                    `boundary` on the field definition is honoured by disabling dates
                    outside the extraction range and clamping the month-picker bounds. */}
                {activeCalendarMode &&
                  !locked &&
                  (() => {
                    const parseBoundaryDate = (iso?: string): Date | undefined => {
                      if (!iso) return undefined;
                      const d = new Date(iso + 'T00:00:00');
                      return isNaN(d.getTime()) ? undefined : d;
                    };
                    const minDate = parseBoundaryDate(field.boundary?.minDate);
                    const maxDate = parseBoundaryDate(field.boundary?.maxDate);
                    // Widen the month picker by a year on each side of the bound
                    // so edge dates are reachable via the dropdown nav.
                    const boundaryStartMonth = minDate
                      ? new Date(minDate.getFullYear(), minDate.getMonth(), 1)
                      : new Date(2020, 0);
                    const boundaryEndMonth = maxDate
                      ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
                      : new Date(2030, 11);
                    const disabledMatcher =
                      minDate || maxDate
                        ? [
                            ...(minDate ? [{ before: minDate }] : []),
                            ...(maxDate ? [{ after: maxDate }] : []),
                          ]
                        : undefined;
                    const calendarComponents = {
                      Chevron: ({
                        orientation,
                      }: {
                        orientation?: 'left' | 'right' | 'up' | 'down';
                      }) =>
                        orientation === 'left' ? (
                          <CaretLeftIcon size={12} weight="bold" />
                        ) : (
                          <CaretRightIcon size={12} weight="bold" />
                        ),
                    };
                    return (
                      <div className="border-l border-gray-100 flex flex-col min-h-0 shrink-0">
                        <div className="px-3 py-1.5 shrink-0 border-b border-gray-100 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-700">
                            {activeCalendarMode === 'single' ? 'Select date' : 'Select date range'}
                          </span>
                          {(minDate || maxDate) && (
                            <span className="text-[10px] text-gray-500">
                              Within extraction boundary
                            </span>
                          )}
                        </div>
                        <div className="flex-1 overflow-auto flex items-start justify-center px-2 pb-1.5">
                          {activeCalendarMode === 'single' ? (
                            <DayPicker
                              className="filter-calendar"
                              mode="single"
                              selected={calendarDate}
                              onSelect={handleCalendarDateSelect}
                              captionLayout="dropdown"
                              startMonth={boundaryStartMonth}
                              endMonth={boundaryEndMonth}
                              disabled={disabledMatcher}
                              showOutsideDays
                              fixedWeeks
                              components={calendarComponents}
                            />
                          ) : (
                            <DayPicker
                              className="filter-calendar"
                              mode="range"
                              selected={calendarRange}
                              onSelect={handleCalendarRangeSelect}
                              numberOfMonths={2}
                              captionLayout="dropdown"
                              startMonth={boundaryStartMonth}
                              endMonth={boundaryEndMonth}
                              disabled={disabledMatcher}
                              showOutsideDays
                              fixedWeeks
                              components={calendarComponents}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })()}
              </div>

              {/* Footer — spans full width across both columns.
                  Layout: include-blanks (left) · flex · Clear · Lock · Apply.
                  The Lock button mirrors Apply's validity rule (requires
                  `canLock`) and stays interactive when `locked` is true so
                  the owner can always unlock from within. */}
              <div className="px-2.5 py-2 border-t border-gray-100 flex items-center gap-2">
                {!isNoValue && (
                  <button
                    onClick={
                      locked || isApplying
                        ? undefined
                        : () => {
                            if (value) {
                              onChange({
                                ...value,
                                includeBlank: !value.includeBlank || undefined,
                              });
                            }
                          }
                    }
                    disabled={locked || isApplying}
                    className={`flex items-center gap-1.5 bg-transparent border-none p-0 ${locked || isApplying ? 'cursor-default pointer-events-none opacity-60' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        value?.includeBlank
                          ? locked || isApplying
                            ? 'bg-gray-400 border-gray-400'
                            : 'bg-gray-900 border-gray-900'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {value?.includeBlank && (
                        <CheckIcon size={10} weight="bold" className="text-white" />
                      )}
                    </div>
                    <span
                      className={`text-xs ${locked || isApplying ? 'text-gray-700' : 'text-gray-800'}`}
                    >
                      Include blanks
                    </span>
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={handleClear}
                  disabled={locked || isApplying}
                  className={`text-xs transition-colors ${locked || isApplying ? 'text-gray-700 cursor-default opacity-60' : 'text-gray-800 hover:text-gray-900 cursor-pointer'}`}
                >
                  Reset
                </button>
                {onToggleLock &&
                  (() => {
                    // Lock button disabled when not yet locked and the filter
                    // isn't fully valid, OR while a PATCH is in flight (so
                    // users get feedback instead of a click-with-no-response),
                    // OR when any selected dynamic option has an empty /
                    // invalid `N` draft (committing would send a stale value).
                    const lockDisabled =
                      isApplying ||
                      (!locked && !canLock) ||
                      hasInvalidDynamicInput ||
                      hasInvalidNumberInput;
                    return (
                      <button
                        onClick={lockDisabled ? undefined : onToggleLock}
                        disabled={lockDisabled}
                        title={
                          isApplying
                            ? 'Applying…'
                            : locked
                              ? 'Unlock filter'
                              : canLock
                                ? 'Lock filter'
                                : 'Select a value before locking'
                        }
                        className={`inline-flex items-center gap-1.5 h-[26px] px-2.5 text-xs font-medium rounded-lg border transition-colors ${
                          isApplying
                            ? locked
                              ? 'bg-gray-700 border-gray-700 text-white cursor-wait'
                              : 'bg-white border-gray-200 text-gray-500 cursor-wait'
                            : locked
                              ? 'bg-gray-900 border-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                              : !canLock
                                ? 'bg-white border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        {isApplying ? (
                          <SpinnerGapIcon size={12} className="animate-spin" />
                        ) : (
                          <LockSimpleIcon size={12} weight={locked ? 'bold' : 'regular'} />
                        )}
                        {locked ? 'Unlock' : 'Lock'}
                      </button>
                    );
                  })()}
                {(() => {
                  // Apply button: when `onApply` is provided, it commits
                  // pending changes via the outer Apply and closes the
                  // popover. Without it, just closes (storybook fallback).
                  // Apply mirrors v1 behavior: only enabled when there are
                  // pending changes to commit (`canApply`) AND the filter
                  // isn't locked / a PATCH isn't already in flight. Also
                  // disabled whenever a selected dynamic option has an
                  // empty / invalid `N` draft — the user is mid-edit and
                  // committing would send a stale value.
                  // Also disable when a calendar is shown but no date is picked yet.
                  // Operator-driven: operator requires a calendar value but none selected.
                  // Option-driven: calendar label placeholder without actual date.
                  const hasUnresolvedCalendar = operatorDef?.calendarMode
                    ? !value?.value || value.value === ''
                    : calCfg
                      ? currentValues.some(
                          (v) =>
                            (v === calCfg.singleDateLabel && !v.startsWith('custom_date:')) ||
                            (v === calCfg.dateRangeLabel && !v.startsWith('custom_range:'))
                        )
                      : false;
                  const applyDisabled =
                    locked ||
                    isApplying ||
                    !canApply ||
                    hasInvalidDynamicInput ||
                    hasInvalidNumberInput ||
                    hasUnresolvedCalendar;
                  return (
                    <button
                      onClick={() => {
                        if (applyDisabled) return;
                        if (onApply) onApply();
                        setIsOpen(false);
                        setSearch('');
                      }}
                      disabled={applyDisabled}
                      className={`inline-flex items-center gap-1.5 h-[26px] px-3 text-xs font-medium rounded-lg transition-colors ${
                        applyDisabled
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'text-white bg-gray-900 hover:bg-gray-800 cursor-pointer'
                      }`}
                    >
                      {isApplying && <SpinnerGapIcon size={11} className="animate-spin" />}
                      Apply
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
