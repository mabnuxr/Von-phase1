/**
 * ScrollableFilterBar — horizontal pill bar with caret navigation and gradient fades.
 *
 * Renders filter fields as individual pill dropdowns in a single non-wrapping row.
 * When content overflows, gradient fades appear on the edges and caret buttons
 * allow the user to scroll left/right.
 */

import React, { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { CaretLeftIcon, CaretRightIcon, InfoIcon } from '@phosphor-icons/react';
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
}

export interface FilterFieldConfig {
  id: string;
  label: string;
  type: FieldType;
  /** Available options for picklist fields */
  options?: string[];
  /** Options that require a numeric input (shown below static options) */
  dynamicOptions?: DynamicOptionConfig[];
  /** Tooltip text shown when hovering the info icon next to the label */
  tooltip?: string;
  /** Custom operator definitions — overrides the default operators for this field's type */
  customOperators?: CustomOperatorDef[];
  /** Override the default operator for this field */
  defaultOperator?: string;
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
}

// ============================================================================
// Component
// ============================================================================

export const ScrollableFilterBar: React.FC<ScrollableFilterBarProps> = ({
  fields,
  values,
  onFilterChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
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
  }, [checkScroll, fields.length]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 200;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  const renderFilterValue = (field: FilterFieldConfig, fv: FilterValue | undefined): React.ReactNode => {
    if (!fv) return 'All';
    const opLabel = getOperatorFullLabel(fv.operator, field);

    // NoValue operators (is_blank, is_not_blank, custom noValue like My Records)
    if (!fv.value && fv.value !== '') return opLabel;

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
      const displayValues = fv.value.map(v => {
        const dynLabel = formatDynamicValue(v, field.dynamicOptions);
        return dynLabel ?? v;
      });
      return (
        <span className="flex items-center gap-1">
          <span>{opLabel}:</span>
          {displayValues.slice(0, 2).map((v, i) => (
            <span key={fv.value![i] as string} className="inline-flex items-center h-[18px] px-1.5 bg-gray-50 border border-gray-100 text-gray-800 text-xs rounded-full">{v}</span>
          ))}
          {displayValues.length > 2 && (
            <span className="inline-flex items-center h-[18px] px-1.5 bg-gray-50 border border-gray-100 text-gray-800 text-xs rounded-full">+{displayValues.length - 2}</span>
          )}
        </span>
      );
    }

    // Single value
    if (fv.value && typeof fv.value === 'string') return `${opLabel}: ${fv.value}`;
    return 'All';
  };

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
        {fields.map(field => {
          const fv = values[field.id];
          return (
            <SplitFilterDropdown
              key={field.id}
              field={field}
              value={fv ?? null}
              onChange={(val) => onFilterChange(field.id, val)}
            >
              <div className="flex flex-col gap-1 shrink-0 cursor-pointer">
                <span className="flex items-center gap-1 text-[11px] text-gray-700 leading-none pl-0.5">
                  {field.label}
                  {field.tooltip && (
                    <Tooltip content={field.tooltip} placement="top">
                      <InfoIcon size={11} className="text-gray-800 hover:text-gray-600 transition-colors shrink-0" />
                    </Tooltip>
                  )}
                </span>
                <button
                  className={`flex items-center justify-between gap-2 h-[28px] px-2 text-xs text-gray-900 bg-white rounded-lg shadow-xs border border-gray-200/50 hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer ${!fv ? 'min-w-[80px]' : ''}`}
                >
                  <span className="flex items-center gap-1">{renderFilterValue(field, fv)}</span>
                  <CaretRightIcon size={12} className="text-gray-400 rotate-90 shrink-0" />
                </button>
              </div>
            </SplitFilterDropdown>
          );
        })}
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
    const custom = field.customOperators.find(o => o.value === op);
    if (custom) return custom.label;
  }
  const labels: Record<string, string> = {
    equals: 'Is',
    not_equals: 'Is not',
    contains: 'Contains',
    not_contains: 'Does not contain',
    starts_with: 'Starts with',
    ends_with: 'Ends with',
    is_blank: 'Is blank',
    is_not_blank: 'Is not blank',
    in: 'Is any of',
    not_in: 'Is none of',
    on: 'On',
    before: 'Before',
    after: 'After',
    on_or_before: 'On or before',
    on_or_after: 'On or after',
    between: 'Between',
    not_between: 'Not between',
    greater_than: 'Greater than',
    greater_than_or_equal: 'At least',
    less_than: 'Less than',
    less_than_or_equal: 'At most',
  };
  return labels[op] ?? op;
}

/** Resolve a dynamic value like "last_n_days:30" → "Last 30 days" using the field's dynamicOptions config */
function formatDynamicValue(v: string, dynamicOptions?: DynamicOptionConfig[]): string | null {
  if (!dynamicOptions) return null;
  const match = v.match(/^([a-z_]+):(\d+)$/);
  if (!match) return null;
  const [, id, nStr] = match;
  const opt = dynamicOptions.find(o => o.id === id);
  if (!opt) return null;
  return opt.label.replace('N', nStr);
}
