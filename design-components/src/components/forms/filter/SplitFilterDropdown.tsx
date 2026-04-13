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

import React, { useState, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
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
  return 'equals';
}

// ============================================================================
// Multi-select operators that accept arrays
// ============================================================================

const MULTI_VALUE_OPERATORS = new Set(['in', 'not_in']);
const RANGE_OPERATORS = new Set(['between']);

// ============================================================================
// Dynamic option helpers — values stored as "dynamic_id:n" e.g. "last_n_days:7"
// ============================================================================

function parseDynamicValue(v: string): { id: string; n: number } | null {
  const match = v.match(/^([a-z_]+):(\d+)$/);
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [search, setSearch] = useState('');
  // Track numeric inputs for dynamic options keyed by dynamic option id
  const [dynamicInputs, setDynamicInputs] = useState<Record<string, number>>({});

  const operators = useMemo(() => getOperators(field), [field]);
  const currentOperator = value?.operator ?? getDefaultOperator(field);
  const currentValues = value?.value
    ? Array.isArray(value.value)
      ? value.value
      : [value.value]
    : [];
  const isMulti = MULTI_VALUE_OPERATORS.has(currentOperator);
  const isRange = RANGE_OPERATORS.has(currentOperator);
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
    if (!calCfg) return null;
    for (const v of currentValues) {
      if (v === calCfg.singleDateLabel || v.startsWith('custom_date:')) return 'single';
      if (v === calCfg.dateRangeLabel || v.startsWith('custom_range:')) return 'range';
    }
    return null;
  }, [calCfg, currentValues]);

  const [calendarDate, setCalendarDate] = useState<Date | undefined>();
  const [calendarRange, setCalendarRange] = useState<DateRange | undefined>();

  // Initialize calendar from existing values on open
  const initCalendar = useCallback(() => {
    if (!calCfg) return;
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
  }, [calCfg, currentValues]);

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
  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const hasCalendar = activeCalendarMode !== null;
    const baseWidth = field.type === 'picklist' || field.options?.length ? 420 : 340;
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
  }, [field.type, field.options?.length, activeCalendarMode]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setSearch('');
    } else {
      computePosition();
      initDynamicInputs();
      initCalendar();
      setIsOpen(true);
    }
  }, [isOpen, computePosition, initDynamicInputs, initCalendar]);

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
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleOperatorChange = (op: string) => {
    const opDef = operators.find((o) => o.value === op);
    if (opDef?.noValue) {
      onChange({ operator: op });
    } else if (RANGE_OPERATORS.has(op)) {
      onChange({ operator: op, value: ['', ''] });
    } else if (MULTI_VALUE_OPERATORS.has(op)) {
      onChange({ operator: op, value: [] });
    } else if (value && !Array.isArray(value.value)) {
      onChange({ ...value, operator: op });
    } else {
      onChange({ operator: op, value: '' });
    }
  };

  const handleToggleOption = (option: string) => {
    const isSingleCal = calCfg?.singleDateLabel === option;
    const isRangeCal = calCfg?.dateRangeLabel === option;

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
      onChange({ operator: currentOperator, value: isMulti ? arr : arr[0] });
    }
  };

  // Calendar date selection handlers
  const handleCalendarDateSelect = (date: Date | undefined) => {
    setCalendarDate(date);
    if (!date) return;
    const encoded = `custom_date:${formatDateISO(date)}`;
    // Replace the placeholder "Custom Date" label with the encoded value
    const next = currentValues
      .filter((v) => v !== calCfg?.singleDateLabel && !v.startsWith('custom_date:'))
      .concat(encoded);
    onChange({ operator: currentOperator, value: isMulti ? next : next[0] });
  };

  const handleCalendarRangeSelect = (range: DateRange | undefined) => {
    setCalendarRange(range);
    if (!range?.from) return;
    if (!range.to) {
      // Only from selected so far — keep the placeholder
      const next = currentValues.filter((v) => !v.startsWith('custom_range:'));
      if (!next.includes(calCfg?.dateRangeLabel ?? ''))
        next.push(calCfg?.dateRangeLabel ?? 'Custom Range');
      onChange({ operator: currentOperator, value: isMulti ? next : next[0] });
      return;
    }
    const encoded = `custom_range:${formatDateISO(range.from)}_${formatDateISO(range.to)}`;
    const next = currentValues
      .filter((v) => v !== calCfg?.dateRangeLabel && !v.startsWith('custom_range:'))
      .concat(encoded);
    onChange({ operator: currentOperator, value: isMulti ? next : next[0] });
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
    const n =
      dynamicInputs[optId] ?? field.dynamicOptions?.find((o) => o.id === optId)?.defaultN ?? 7;
    const dynValue = makeDynamicValue(optId, n);

    if (selectedDynamicIds.has(optId)) {
      // Deselect: remove this dynamic value
      const next = currentValues.filter((v) => {
        const p = parseDynamicValue(v);
        return !p || p.id !== optId;
      });
      if (next.length === 0) {
        onChange(null);
      } else {
        onChange({ operator: currentOperator, value: isMulti ? next : next[0] });
      }
    } else {
      // Select: add this dynamic value
      const next = [...currentValues, dynValue];
      onChange({ operator: currentOperator, value: isMulti ? next : next[0] });
    }
  };

  const handleDynamicInputChange = (optId: string, n: number) => {
    setDynamicInputs((prev) => ({ ...prev, [optId]: n }));
    // If this dynamic option is currently selected, update its value in the filter
    if (selectedDynamicIds.has(optId)) {
      const newDynValue = makeDynamicValue(optId, n);
      const next = currentValues.map((v) => {
        const p = parseDynamicValue(v);
        if (p && p.id === optId) return newDynValue;
        return v;
      });
      onChange({ operator: currentOperator, value: isMulti ? next : next[0] });
    }
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
    setSearch('');
  };

  const filteredOptions = useMemo(() => {
    if (allOptions.length === 0) return [];
    if (!search) return allOptions;
    const q = search.toLowerCase();
    return allOptions.filter((o) => o.toLowerCase().includes(q));
  }, [allOptions, search]);

  // Build filtered groups for grouped rendering
  const filteredGroups = useMemo(() => {
    if (!field.optionGroups) return null;
    if (!search) return field.optionGroups;
    const q = search.toLowerCase();
    return field.optionGroups
      .map((g) => ({
        ...g,
        options: g.options?.filter((o) => o.toLowerCase().includes(q)),
        // Always keep dynamic options visible (they don't filter by search)
        dynamicOptions: g.dynamicOptions,
      }))
      .filter(
        (g) =>
          (g.options && g.options.length > 0) || (g.dynamicOptions && g.dynamicOptions.length > 0)
      );
  }, [field.optionGroups, search]);

  const hasOptions = allOptions.length > 0;
  const hasDynamicOptions = allDynamicOptions.length > 0;
  const showRightPanel = !isNoValue;

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
              className={`rounded-xl border border-gray-100 shadow-lg flex flex-col ${locked ? 'bg-gray-50' : 'bg-white'}`}
            >
              {/* Locked banner */}
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
                className={`flex min-h-0 ${locked ? 'pointer-events-none' : ''} ${activeCalendarMode ? 'h-[280px]' : 'h-[240px]'}`}
              >
                {/* Left panel — Operators: fixed width with right panel, full width without */}
                <div
                  className={`flex flex-col ${showRightPanel ? 'w-[148px] shrink-0 border-r border-gray-100' : 'flex-1'}`}
                >
                  <div className="px-2.5 py-1 shrink-0 border-b border-gray-100">
                    <span
                      className={`text-xs font-medium ${locked ? 'text-gray-700' : 'text-gray-700'}`}
                    >
                      Operator
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto py-1 pl-1 pr-2">
                    {operators.map((op) => (
                      <button
                        key={op.value}
                        onClick={() => handleOperatorChange(op.value)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl border text-left transition-colors ${
                          locked
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
                            currentOperator === op.value
                              ? locked
                                ? 'bg-gray-400'
                                : 'bg-gray-900'
                              : locked
                                ? 'border-[1.5px] border-gray-300'
                                : 'border-[1.5px] border-gray-300'
                          }`}
                        >
                          {currentOperator === op.value && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right panel — Values: fixed search, scrollable list */}
                {showRightPanel && (
                  <div className="flex-1 min-w-[180px] flex flex-col min-h-0">
                    {/* Inline search — fixed at top */}
                    {hasOptions && (
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

                    {/* Option list (picklist) — scrollable */}
                    {(hasOptions || hasDynamicOptions) && (
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
                                      {gi > 0 && <div className="border-t border-gray-100 mb-2" />}
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
                                          {isSelected && (
                                            <CheckIcon
                                              size={10}
                                              weight="bold"
                                              className="text-white"
                                            />
                                          )}
                                        </div>
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
                                    const n = dynamicInputs[opt.id] ?? opt.defaultN ?? 7;
                                    return (
                                      <div key={opt.id}>
                                        <button
                                          onClick={() => handleToggleDynamicOption(opt.id)}
                                          className={`w-full flex items-center gap-2 border border-transparent rounded-xl px-3 py-1.5 text-xs text-left transition-colors ${locked ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}
                                        >
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
                                            {isSelected && (
                                              <CheckIcon
                                                size={10}
                                                weight="bold"
                                                className="text-white"
                                              />
                                            )}
                                          </div>
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
                                                        Math.max(1, parseInt(e.target.value) || 1)
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
                                    {isSelected && (
                                      <CheckIcon size={10} weight="bold" className="text-white" />
                                    )}
                                  </div>
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
                                  const n = dynamicInputs[opt.id] ?? opt.defaultN ?? 7;
                                  return (
                                    <div key={opt.id}>
                                      <button
                                        onClick={() => handleToggleDynamicOption(opt.id)}
                                        className={`w-full flex items-center gap-2 border border-transparent rounded-xl px-3 py-1.5 text-xs text-left transition-colors ${locked ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}
                                      >
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
                                          {isSelected && (
                                            <CheckIcon
                                              size={10}
                                              weight="bold"
                                              className="text-white"
                                            />
                                          )}
                                        </div>
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
                                                      Math.max(1, parseInt(e.target.value) || 1)
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

                    {/* Between range input (number or date) */}
                    {!hasOptions && isRange && (
                      <div className="px-3 py-2.5 flex flex-col gap-1">
                        <div>
                          <label className="text-[11px] text-gray-700 mb-1 block">Min</label>
                          <input
                            type={field.type === 'number' ? 'number' : 'date'}
                            value={Array.isArray(value?.value) ? (value.value[0] ?? '') : ''}
                            onChange={
                              locked ? undefined : (e) => handleRangeChange(0, e.target.value)
                            }
                            readOnly={locked}
                            placeholder="Min"
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
                          <label className="text-[11px] text-gray-700 mb-1 block">Max</label>
                          <input
                            type={field.type === 'number' ? 'number' : 'date'}
                            value={Array.isArray(value?.value) ? (value.value[1] ?? '') : ''}
                            onChange={
                              locked ? undefined : (e) => handleRangeChange(1, e.target.value)
                            }
                            readOnly={locked}
                            placeholder="Max"
                            className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none transition-colors ${
                              locked
                                ? 'text-gray-700 bg-gray-100 border-gray-200 caret-transparent cursor-default'
                                : 'text-gray-900 bg-white border-gray-200 placeholder:text-gray-400 focus:border-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Text/number/date single input (non-picklist, non-range) */}
                    {!hasOptions && !isRange && (
                      <div className="px-3 py-2.5">
                        <input
                          type={
                            field.type === 'number'
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
                        <div className="px-3 py-1 shrink-0 border-b border-gray-100 flex items-center justify-between gap-2">
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
                      locked
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
                    disabled={locked}
                    className={`flex items-center gap-1.5 bg-transparent border-none p-0 ${locked ? 'cursor-default pointer-events-none opacity-60' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        value?.includeBlank
                          ? locked
                            ? 'bg-gray-400 border-gray-400'
                            : 'bg-gray-900 border-gray-900'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {value?.includeBlank && (
                        <CheckIcon size={10} weight="bold" className="text-white" />
                      )}
                    </div>
                    <span className={`text-xs ${locked ? 'text-gray-700' : 'text-gray-800'}`}>
                      Include blanks
                    </span>
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={handleClear}
                  disabled={locked}
                  className={`text-xs transition-colors ${locked ? 'text-gray-700 cursor-default opacity-60' : 'text-gray-800 hover:text-gray-900 cursor-pointer'}`}
                >
                  Clear
                </button>
                {onToggleLock &&
                  (() => {
                    // Lock button disabled when not yet locked and the filter
                    // isn't fully valid, OR while a PATCH is in flight (so
                    // users get feedback instead of a click-with-no-response).
                    const lockDisabled = isApplying || (!locked && !canLock);
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
                        className={`inline-flex items-center gap-1 h-[26px] pl-1.5 pr-2 text-xs font-medium rounded-lg border transition-colors ${
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
                  const applyDisabled = locked || isApplying;
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
