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
import { MagnifyingGlassIcon, CheckIcon } from '@phosphor-icons/react';
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

const TEXT_OPERATORS: OperatorDef[] = [
  { value: 'equals', label: 'Is' },
  { value: 'not_equals', label: 'Is not' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'is_blank', label: 'Is blank', noValue: true },
  { value: 'is_not_blank', label: 'Is not blank', noValue: true },
];

const PICKLIST_OPERATORS: OperatorDef[] = [
  { value: 'in', label: 'Is any of' },
  { value: 'not_in', label: 'Is none of' },
  { value: 'equals', label: 'Is' },
  { value: 'not_equals', label: 'Is not' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'is_blank', label: 'Is blank', noValue: true },
  { value: 'is_not_blank', label: 'Is not blank', noValue: true },
];

const NUMBER_OPERATORS: OperatorDef[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not equals' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'greater_than_or_equal', label: 'At least' },
  { value: 'less_than', label: 'Less than' },
  { value: 'less_than_or_equal', label: 'At most' },
  { value: 'between', label: 'Between' },
  { value: 'is_blank', label: 'Is blank', noValue: true },
  { value: 'is_not_blank', label: 'Is not blank', noValue: true },
];

const DATE_OPERATORS: OperatorDef[] = [
  { value: 'on', label: 'On' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'on_or_before', label: 'On or before' },
  { value: 'on_or_after', label: 'On or after' },
  { value: 'between', label: 'Between' },
  { value: 'is_blank', label: 'Is blank', noValue: true },
  { value: 'is_not_blank', label: 'Is not blank', noValue: true },
];

function getOperators(field: FilterFieldConfig): OperatorDef[] {
  if (field.customOperators) return field.customOperators;
  switch (field.type) {
    case 'picklist':
      return PICKLIST_OPERATORS;
    case 'number':
      return NUMBER_OPERATORS;
    case 'date':
      return DATE_OPERATORS;
    default:
      return TEXT_OPERATORS;
  }
}

function getDefaultOperator(field: FilterFieldConfig): string {
  if (field.defaultOperator) return field.defaultOperator;
  switch (field.type) {
    case 'picklist':
      return 'in';
    case 'number':
      return 'equals';
    case 'date':
      return 'on';
    default:
      return 'contains';
  }
}

// ============================================================================
// Multi-select operators that accept arrays
// ============================================================================

const MULTI_VALUE_OPERATORS = new Set(['in', 'not_in']);
const RANGE_OPERATORS = new Set(['between']);

// ============================================================================
// Dynamic option helpers — values stored as "<ID>:<N>" e.g. "LAST_N_DAYS:7"
// Case-insensitive to accept both the storybook fixture style (lowercase
// ids like "last_n_days") and the backend token style ("LAST_N_DAYS").
// ============================================================================

function parseDynamicValue(v: string): { id: string; n: number } | null {
  const match = v.match(/^([A-Za-z_]+):(\d+)$/);
  if (!match) return null;
  return { id: match[1], n: parseInt(match[2], 10) };
}

function makeDynamicValue(id: string, n: number): string {
  return `${id}:${n}`;
}

/** True when this field should offer a Manual/Relative mode toggle — i.e.
 * a date field with presets to pick from, on a single-date comparison operator. */
function shouldShowDateRelativeMode(
  field: FilterFieldConfig,
  operator: string,
  isRange: boolean,
  isNoValue: boolean
): boolean {
  if (field.type !== 'date') return false;
  if (isRange || isNoValue) return false;
  const hasPresets = !!(field.options?.length || field.dynamicOptions?.length);
  if (!hasPresets) return false;
  // Applies to the comparison operators the spec calls out.
  return (
    operator === 'equals' ||
    operator === 'not_equals' ||
    operator === 'on' ||
    operator === 'before' ||
    operator === 'after' ||
    operator === 'on_or_before' ||
    operator === 'on_or_after'
  );
}

/** Heuristic: does this string value look like a dynamic preset (either
 * a simple token or a parameterized token like "LAST_N_DAYS:30")? */
function isRelativeValue(raw: string | string[] | undefined, field: FilterFieldConfig): boolean {
  if (typeof raw !== 'string' || !raw) return false;
  if (parseDynamicValue(raw)) return true;
  if (field.options?.includes(raw)) return true;
  return false;
}

// ============================================================================
// Props
// ============================================================================

export interface SplitFilterDropdownProps {
  field: FilterFieldConfig;
  value: FilterValue | null;
  onChange: (value: FilterValue | null) => void;
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export const SplitFilterDropdown: React.FC<SplitFilterDropdownProps> = ({
  field,
  value,
  onChange,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [search, setSearch] = useState('');
  // Track numeric inputs for dynamic options keyed by dynamic option id
  const [dynamicInputs, setDynamicInputs] = useState<Record<string, number>>({});
  // Date filter Manual/Relative toggle — only meaningful when shouldShowDateRelativeMode.
  const [dateMode, setDateMode] = useState<'manual' | 'relative'>('manual');

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
  const showDateRelative = shouldShowDateRelativeMode(field, currentOperator, isRange, isNoValue);

  // Which dynamic options are currently selected (by id)
  const selectedDynamicIds = useMemo(() => {
    const ids = new Set<string>();
    for (const v of currentValues) {
      const parsed = parseDynamicValue(v);
      if (parsed) ids.add(parsed.id);
    }
    return ids;
  }, [currentValues]);

  // Initialize dynamicInputs from current values on open
  const initDynamicInputs = useCallback(() => {
    if (!field.dynamicOptions) return;
    const inputs: Record<string, number> = {};
    for (const v of currentValues) {
      const parsed = parseDynamicValue(v);
      if (parsed) inputs[parsed.id] = parsed.n;
    }
    // Fill defaults for un-selected ones
    for (const opt of field.dynamicOptions) {
      if (!(opt.id in inputs)) {
        inputs[opt.id] = opt.defaultN ?? 7;
      }
    }
    setDynamicInputs(inputs);
  }, [field.dynamicOptions, currentValues]);

  // Compute position from trigger rect
  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = field.type === 'picklist' || field.options?.length ? 420 : 340;
    // h-[240px] body + ~28px header + ~36px footer
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
  }, [field.type, field.options?.length]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setSearch('');
    } else {
      computePosition();
      initDynamicInputs();
      // Seed Manual/Relative mode from the current value so reopening the
      // popover remembers what the user last chose.
      if (showDateRelative) {
        setDateMode(isRelativeValue(value?.value, field) ? 'relative' : 'manual');
      }
      setIsOpen(true);
    }
  }, [isOpen, computePosition, initDynamicInputs, showDateRelative, value?.value, field]);

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

  // Single-select handlers used in the Date Relative mode (radio behavior).
  const handleSelectRelativeOption = (option: string) => {
    // Overwrite with the chosen token. Clicking the already-selected option clears it.
    const currentSingle = typeof value?.value === 'string' ? value.value : '';
    if (currentSingle === option) {
      onChange(null);
    } else {
      onChange({ operator: currentOperator, value: option });
    }
  };

  const handleSelectRelativeDynamicOption = (optId: string) => {
    const n =
      dynamicInputs[optId] ?? field.dynamicOptions?.find((o) => o.id === optId)?.defaultN ?? 7;
    const dynValue = makeDynamicValue(optId, n);
    const currentSingle = typeof value?.value === 'string' ? value.value : '';
    const parsed = parseDynamicValue(currentSingle);
    if (parsed && parsed.id === optId) {
      onChange(null);
    } else {
      onChange({ operator: currentOperator, value: dynValue });
    }
  };

  const handleRelativeDynamicInputChange = (optId: string, n: number) => {
    setDynamicInputs((prev) => ({ ...prev, [optId]: n }));
    // If this parameterized option is the active single-select value, update it.
    const currentSingle = typeof value?.value === 'string' ? value.value : '';
    const parsed = parseDynamicValue(currentSingle);
    if (parsed && parsed.id === optId) {
      onChange({ operator: currentOperator, value: makeDynamicValue(optId, n) });
    }
  };

  const handleDateModeSwitch = (mode: 'manual' | 'relative') => {
    if (mode === dateMode) return;
    setDateMode(mode);
    // Clearing on switch avoids leaving an incompatible value in state
    // (e.g. a token while in Manual mode shows an empty date input).
    onChange(null);
  };

  const handleToggleOption = (option: string) => {
    const current = new Set(currentValues);
    if (current.has(option)) {
      current.delete(option);
    } else {
      current.add(option);
    }
    const arr = Array.from(current);
    if (arr.length === 0) {
      onChange(null);
    } else {
      onChange({ operator: currentOperator, value: isMulti ? arr : arr[0] });
    }
  };

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
    if (!field.options) return [];
    if (!search) return field.options;
    const q = search.toLowerCase();
    return field.options.filter((o) => o.toLowerCase().includes(q));
  }, [field.options, search]);

  const hasOptions = field.options && field.options.length > 0;
  const hasDynamicOptions = field.dynamicOptions && field.dynamicOptions.length > 0;
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
              className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden flex flex-col"
            >
              {/* Body: two-column split, fixed 180px height */}
              <div className="flex h-[240px] min-h-0">
                {/* Left panel — Operators: fixed heading, scrollable list */}
                <div
                  className={`w-[148px] flex flex-col shrink-0 ${showRightPanel ? 'border-r border-gray-100' : ''}`}
                >
                  <div className="px-2.5 py-1 shrink-0 border-b border-gray-100">
                    <span className="text-xs font-medium text-gray-700">Operator</span>
                  </div>
                  <div className="flex-1 overflow-y-auto py-1 pl-1 pr-2">
                    {operators.map((op) => (
                      <button
                        key={op.value}
                        onClick={() => handleOperatorChange(op.value)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl border border-white text-left transition-colors cursor-pointer ${
                          currentOperator === op.value
                            ? 'bg-gray-50 !border-gray-100 text-gray-900 font-medium'
                            : 'text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                            currentOperator === op.value
                              ? 'bg-gray-900'
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
                    {/* Date filter Manual/Relative mode toggle */}
                    {showDateRelative && (
                      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 shrink-0">
                        {(['manual', 'relative'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => handleDateModeSwitch(mode)}
                            className={`flex-1 h-[24px] px-2 text-[11px] rounded-md transition-colors cursor-pointer ${
                              dateMode === mode
                                ? 'bg-gray-900 text-white'
                                : 'bg-transparent text-gray-800 hover:bg-gray-100'
                            }`}
                          >
                            {mode === 'manual' ? 'Manual' : 'Relative'}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Date + Manual: single date picker */}
                    {showDateRelative && dateMode === 'manual' && (
                      <div className="px-3 py-2.5">
                        <input
                          type="date"
                          value={
                            typeof value?.value === 'string' && !parseDynamicValue(value.value)
                              ? value.value
                              : ''
                          }
                          onChange={(e) => handleTextValueChange(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 transition-colors"
                          autoFocus
                        />
                      </div>
                    )}

                    {/* Date + Relative: single-select radio list of preset + parameterized tokens */}
                    {showDateRelative && dateMode === 'relative' && (
                      <div className="flex-1 overflow-y-auto py-1 pl-1 pr-2">
                        {field.options?.map((option) => {
                          const isSelected =
                            typeof value?.value === 'string' && value.value === option;
                          return (
                            <button
                              key={option}
                              onClick={() => handleSelectRelativeOption(option)}
                              className="w-full flex items-center gap-2 border border-white rounded-xl px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? 'bg-gray-900' : 'border-[1.5px] border-gray-300'
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </div>
                              <span
                                className={
                                  isSelected ? 'text-gray-900 font-medium' : 'text-gray-800'
                                }
                              >
                                {option}
                              </span>
                            </button>
                          );
                        })}
                        {field.dynamicOptions?.map((opt) => {
                          const currentSingle = typeof value?.value === 'string' ? value.value : '';
                          const parsed = parseDynamicValue(currentSingle);
                          const isSelected = parsed?.id === opt.id;
                          const n = dynamicInputs[opt.id] ?? opt.defaultN ?? 7;
                          return (
                            <div key={opt.id}>
                              <button
                                onClick={() => handleSelectRelativeDynamicOption(opt.id)}
                                className="w-full flex items-center gap-2 border border-white rounded-xl px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors cursor-pointer"
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected ? 'bg-gray-900' : 'border-[1.5px] border-gray-300'
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                                <span
                                  className={
                                    isSelected ? 'text-gray-900 font-medium' : 'text-gray-800'
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
                                    onChange={(e) =>
                                      handleRelativeDynamicInputChange(
                                        opt.id,
                                        Math.max(1, parseInt(e.target.value) || 1)
                                      )
                                    }
                                    className="w-14 px-2 py-1 text-xs text-gray-900 bg-white border border-gray-200 rounded-lg text-center focus:outline-none focus:border-gray-300 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  {opt.unit && (
                                    <span className="text-xs text-gray-700">{opt.unit}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Inline search — fixed at top */}
                    {!showDateRelative && hasOptions && (
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0">
                        <MagnifyingGlassIcon size={13} className="text-gray-700 shrink-0" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search..."
                          className="flex-1 bg-transparent text-xs text-gray-900 placeholder:text-gray-700 outline-none"
                          autoFocus
                        />
                      </div>
                    )}

                    {/* Option list (picklist) — scrollable */}
                    {!showDateRelative && (hasOptions || hasDynamicOptions) && (
                      <div className="flex-1 overflow-y-auto py-1 pl-1 pr-2">
                        {filteredOptions.map((option) => {
                          const isSelected = currentValues.includes(option);
                          return (
                            <button
                              key={option}
                              onClick={() => handleToggleOption(option)}
                              className="w-full flex items-center gap-2 border border-white rounded-xl px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? 'bg-gray-900 border-gray-900'
                                    : 'bg-white border-gray-300'
                                }`}
                              >
                                {isSelected && (
                                  <CheckIcon size={10} weight="bold" className="text-white" />
                                )}
                              </div>
                              <span
                                className={
                                  isSelected ? 'text-gray-900 font-medium' : 'text-gray-800'
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
                        {hasDynamicOptions && (
                          <>
                            {field.dynamicOptions!.map((opt) => {
                              const isSelected = selectedDynamicIds.has(opt.id);
                              const n = dynamicInputs[opt.id] ?? opt.defaultN ?? 7;
                              return (
                                <div key={opt.id}>
                                  <button
                                    onClick={() => handleToggleDynamicOption(opt.id)}
                                    className="w-full flex items-center gap-2 border border-white rounded-xl px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                    <div
                                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected
                                          ? 'bg-gray-900 border-gray-900'
                                          : 'bg-white border-gray-300'
                                      }`}
                                    >
                                      {isSelected && (
                                        <CheckIcon size={10} weight="bold" className="text-white" />
                                      )}
                                    </div>
                                    <span
                                      className={
                                        isSelected ? 'text-gray-900 font-medium' : 'text-gray-800'
                                      }
                                    >
                                      {opt.label}
                                    </span>
                                  </button>
                                  {/* Inline number input — shown when selected */}
                                  {isSelected && (
                                    <div className="flex items-center gap-1.5 pl-[30px] pr-3 pb-1.5">
                                      <input
                                        type="number"
                                        min={1}
                                        value={n}
                                        onChange={(e) =>
                                          handleDynamicInputChange(
                                            opt.id,
                                            Math.max(1, parseInt(e.target.value) || 1)
                                          )
                                        }
                                        className="w-14 px-2 py-1 text-xs text-gray-900 bg-white border border-gray-200 rounded-lg text-center focus:outline-none focus:border-gray-300 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      {opt.unit && (
                                        <span className="text-xs text-gray-700">{opt.unit}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}

                    {/* Between range input (number or date) */}
                    {!showDateRelative && !hasOptions && isRange && (
                      <div className="px-3 py-2.5 flex flex-col gap-1">
                        <div>
                          <label className="text-[11px] text-gray-700 mb-1 block">Min</label>
                          <input
                            type={field.type === 'number' ? 'number' : 'date'}
                            value={Array.isArray(value?.value) ? (value.value[0] ?? '') : ''}
                            onChange={(e) => handleRangeChange(0, e.target.value)}
                            placeholder="Min"
                            className="w-full px-2.5 py-1.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
                            autoFocus
                          />
                        </div>
                        <div className="text-center text-xs text-gray-700">to</div>
                        <div className="-mt-3">
                          <label className="text-[11px] text-gray-700 mb-1 block">Max</label>
                          <input
                            type={field.type === 'number' ? 'number' : 'date'}
                            value={Array.isArray(value?.value) ? (value.value[1] ?? '') : ''}
                            onChange={(e) => handleRangeChange(1, e.target.value)}
                            placeholder="Max"
                            className="w-full px-2.5 py-1.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Text/number/date single input (non-picklist, non-range) */}
                    {!showDateRelative && !hasOptions && !isRange && (
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
                          onChange={(e) => handleTextValueChange(e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="w-full px-2.5 py-1.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* No right panel for no-value operators — left panel stands alone */}
              </div>

              {/* Footer — spans full width across both columns */}
              <div className="px-2.5 py-2 border-t border-gray-100 flex items-center gap-2">
                {!isNoValue && (
                  <button
                    onClick={() => {
                      if (value) {
                        onChange({ ...value, includeBlank: !value.includeBlank || undefined });
                      }
                    }}
                    className="flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        value?.includeBlank
                          ? 'bg-gray-900 border-gray-900'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {value?.includeBlank && (
                        <CheckIcon size={10} weight="bold" className="text-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-800">Include blanks</span>
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-800 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="h-[26px] px-3 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
