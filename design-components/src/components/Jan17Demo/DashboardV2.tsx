import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DotsThreeIcon,
  PencilSimpleIcon,
  TrashIcon,
  TableIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  DownloadIcon,
  ArrowsClockwiseIcon,
  PaperPlaneTiltIcon,
  CalendarIcon,
  UserIcon,
  CaretDownIcon,
  CheckIcon,
  XIcon,
  PlusIcon,
  GearIcon,
  UsersIcon,
  InfoIcon,
  NoteIcon,
} from '@phosphor-icons/react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Import Highcharts modules for waterfall chart support (v12+ auto-initializes on import)
import 'highcharts/highcharts-more';
import { SecondaryIconButton, GhostButton, PrimaryButton } from '../forms/buttons';
import { ContextMenu, type ContextMenuItem } from '../popups';
import { ReportTable, buildGridOptions, type ReportColumn } from '../ReportTable/ReportTable';
import type { FilterField, FilterGroup, FilterCondition } from '../forms/filter/Filter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ============================================================================
// Types
// ============================================================================

export type TimelineFilter =
  | 'this-quarter'
  | 'next-quarter'
  | 'last-quarter'
  | 'this-month'
  | 'this-year';
export type OwnerFilter = string; // owner id or 'all'

export interface DashboardFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface KPICardData {
  id: string;
  title: string;
  value: string;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  /** Progress value as a percentage (0-100) for horizontal progress bar */
  progress?: number;
  /** Target/goal value to display alongside progress */
  target?: string;
}

export interface WaterfallDataPoint {
  name: string;
  y?: number;
  isIntermediateSum?: boolean;
  isSum?: boolean;
  color?: string;
}

export interface CombinationSeriesConfig {
  name: string;
  type: 'column' | 'spline' | 'line';
  data: number[];
  color?: string;
  dashStyle?: 'Solid' | 'Dash' | 'Dot' | 'DashDot';
  /** For stacking columns together */
  stack?: string;
  /** Y-axis index (0 = left, 1 = right) */
  yAxis?: number;
  /** Marker configuration for line/spline series */
  marker?: {
    enabled?: boolean;
    symbol?: 'circle' | 'square' | 'diamond' | 'triangle';
    radius?: number;
  };
}

export interface CombinationChartData {
  categories: string[];
  series: CombinationSeriesConfig[];
  /** Enable dual Y-axis */
  dualAxis?: boolean;
  /** Right Y-axis title */
  rightAxisTitle?: string;
}

export interface ChartData {
  id: string;
  title: string;
  type: 'bar' | 'pie' | 'waterfall' | 'combination';
  data: unknown;
}

export interface TableColumn {
  id: string;
  label: string;
  type?: 'string' | 'number' | 'currency' | 'date';
  /** Whether this is an AI-generated column */
  isAI?: boolean;
  /** Data source for AI columns (e.g., 'Snowflake', 'Gong Calls', 'Von IQ') */
  aiSource?: string;
}

export interface TableData {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
}

export interface TextWidgetData {
  id: string;
  title: string;
  content: string;
  /** Maximum character limit for the text content */
  maxCharacters?: number;
  /** Whether this is AI-generated content */
  isAIGenerated?: boolean;
}

export interface OwnerOption {
  id: string;
  name: string;
}

export interface DashboardV2Props {
  name: string;
  kpiCards: KPICardData[];
  barChart?: ChartData;
  pieChart?: ChartData;
  /** Waterfall chart for showing cumulative financial data */
  waterfallChart?: ChartData;
  /** Combination chart with stacked bars and overlay lines (like forecast vs actual) */
  combinationChart?: ChartData;
  table?: TableData;
  /** Text widget for notes or AI-generated content */
  textWidget?: TextWidgetData;
  /** Callback when text widget content changes */
  onTextWidgetChange?: (content: string) => void;
  isBuilding?: boolean;
  buildProgress?: number;
  visibleWidgets?: string[];
  onWidgetDrillDown?: (widgetId: string) => void;
  onWidgetEdit?: (widgetId: string) => void;
  onWidgetDelete?: (widgetId: string) => void;
  /** Callback when filter button is clicked (legacy) */
  onFilterClick?: (buttonRect: DOMRect) => void;
  /** Callback when export button is clicked */
  onExportClick?: () => void;
  /** Callback when refresh button is clicked */
  onRefreshClick?: () => void;
  /** Callback when share button is clicked */
  onShareClick?: (buttonRect: DOMRect) => void;
  /** Callback when edit button is clicked (enters edit mode) */
  onEditClick?: () => void;
  /** Callback when dashboard name is changed */
  onNameChange?: (newName: string) => void;
  /** Whether the dashboard is in edit mode */
  isEditMode?: boolean;
  /** Timeline filter value */
  timelineFilter?: TimelineFilter;
  /** Callback when timeline filter changes */
  onTimelineFilterChange?: (value: TimelineFilter) => void;
  /** Owner filter value */
  ownerFilter?: OwnerFilter;
  /** Callback when owner filter changes */
  onOwnerFilterChange?: (value: OwnerFilter) => void;
  /** Available owners for filtering */
  ownerOptions?: OwnerOption[];
  /** Advanced filters */
  advancedFilters?: DashboardFilter[];
  /** Callback when advanced filters change */
  onAdvancedFiltersChange?: (filters: DashboardFilter[]) => void;
  /** Available fields for advanced filtering */
  availableFilterFields?: string[];
  /** Callback when a chart segment is clicked for drilldown */
  onChartSegmentClick?: (widgetId: string, segmentData: { name: string; value: number }) => void;
  /** Callback when cancel/close button is clicked */
  onCancelClick?: () => void;
  /** Timestamp when dashboard was created/updated */
  timestamp?: string;
  /** User who created the dashboard */
  createdBy?: string;
  /** Callback when a widget card is clicked (for reference context updates) */
  onWidgetClick?: (widgetId: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const TIMELINE_OPTIONS = [
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'next-quarter', label: 'Next Quarter' },
  { value: 'last-quarter', label: 'Last Quarter' },
  { value: 'this-month', label: 'This Month' },
  { value: 'this-year', label: 'This Year' },
];

// ============================================================================
// Context Menu Items
// ============================================================================

const getWidgetContextMenuItems = (): ContextMenuItem[] => [
  { id: 'edit', label: 'Edit', icon: <PencilSimpleIcon size={14} /> },
  { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' },
];

// ============================================================================
// Filter Dropdown Popover Component
// ============================================================================

interface FilterDropdownPopoverProps<T extends string> {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  title: string;
}

function FilterDropdownPopover<T extends string>({
  isOpen,
  onClose,
  anchorRef,
  options,
  value,
  onChange,
  title,
}: FilterDropdownPopoverProps<T>) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-[10000] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </span>
      </div>

      {/* Options */}
      <div className="py-1 max-h-[240px] overflow-y-auto">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onChange(option.value);
              onClose();
            }}
            className={`
              w-full flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer
              ${value === option.value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}
            `}
          >
            <span>{option.label}</span>
            {value === option.value && <CheckIcon size={14} className="text-indigo-600" />}
          </button>
        ))}
      </div>
    </motion.div>,
    document.body
  );
}

// ============================================================================
// Von AI Logo Component (for Filter popover)
// ============================================================================

const VonAILogo: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
      fill="url(#paint0_radial_dashboard_filter)"
    />
    <path
      d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
      stroke="white"
      strokeWidth="1.33"
    />
    <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
    <defs>
      <radialGradient
        id="paint0_radial_dashboard_filter"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
      >
        <stop stopColor="#FFF3EB" />
        <stop offset="0.26" stopColor="#FF9042" />
        <stop offset="1" stopColor="#854FFF" />
      </radialGradient>
    </defs>
  </svg>
);

// ============================================================================
// Filter Popover Helper Functions
// ============================================================================

const generateFilterId = () => Math.random().toString(36).substring(2, 9);

// Convert DashboardFilter[] to FilterGroup[] for the filter component
const dashboardFiltersToGroups = (filters: DashboardFilter[]): FilterGroup[] => {
  if (filters.length === 0) {
    return [
      {
        id: generateFilterId(),
        conditions: [{ id: generateFilterId(), field: '', operator: 'contains', value: '' }],
        connector: 'and',
      },
    ];
  }

  const conditions: FilterCondition[] = filters.map((f) => ({
    id: f.id,
    field: f.field,
    operator: f.operator,
    value: f.value,
  }));

  return [
    {
      id: generateFilterId(),
      conditions,
      connector: 'and',
    },
  ];
};

// Convert FilterGroup[] back to DashboardFilter[]
const groupsToDashboardFilters = (groups: FilterGroup[]): DashboardFilter[] => {
  const filters: DashboardFilter[] = [];
  groups.forEach((group) => {
    group.conditions.forEach((condition) => {
      if (condition.field) {
        filters.push({
          id: condition.id,
          field: condition.field,
          operator: condition.operator,
          value: condition.value,
        });
      }
    });
  });
  return filters;
};

// ============================================================================
// Filter Operators
// ============================================================================

const FILTER_OPERATORS = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'greater_or_equal', label: 'is at least' },
  { value: 'less_or_equal', label: 'is at most' },
  { value: 'is_any_of', label: 'is any of' },
  { value: 'is_null', label: 'is empty' },
  { value: 'is_not_null', label: 'is not empty' },
];

const FILTER_CONNECTOR_OPTIONS = [
  { value: 'and', label: 'and' },
  { value: 'or', label: 'or' },
];

const NULL_OPERATORS = ['is_null', 'is_not_null'];

// ============================================================================
// Filter Condition Row Component
// ============================================================================

interface FilterConditionRowProps {
  condition: FilterCondition;
  fields: FilterField[];
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
  showRemove: boolean;
  rowPrefix: 'where' | 'connector';
  connector?: 'and' | 'or';
  onConnectorChange?: (connector: 'and' | 'or') => void;
}

const FilterConditionRow: React.FC<FilterConditionRowProps> = ({
  condition,
  fields,
  onChange,
  onRemove,
  showRemove,
  rowPrefix,
  connector = 'and',
  onConnectorChange,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isNullOperator = NULL_OPERATORS.includes(condition.operator);

  return (
    <div
      className="group flex items-center gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Row Prefix: "Where" or and/or dropdown */}
      <div className="w-14 flex-shrink-0">
        {rowPrefix === 'where' ? (
          <span className="text-sm text-gray-700">Where</span>
        ) : (
          <select
            value={connector}
            onChange={(e) => onConnectorChange?.(e.target.value as 'and' | 'or')}
            className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer"
          >
            {FILTER_CONNECTOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Field Dropdown */}
      <div className="w-28 flex-shrink-0">
        <select
          value={condition.field}
          onChange={(e) => onChange({ ...condition, field: e.target.value })}
          className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer"
        >
          <option value="">Select field</option>
          {fields.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Operator Dropdown */}
      <div className="w-32 flex-shrink-0">
        <select
          value={condition.operator}
          onChange={(e) => onChange({ ...condition, operator: e.target.value })}
          className="w-full px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer"
        >
          {FILTER_OPERATORS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      {/* Value Input */}
      {!isNullOperator && (
        <div className="flex-1 min-w-[120px]">
          <input
            type="text"
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            placeholder="Enter a value"
            className="w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:border-gray-300 focus:ring-gray-200 transition-colors"
          />
        </div>
      )}

      {isNullOperator && <div className="flex-1" />}

      {/* Delete Button */}
      <button
        type="button"
        onClick={onRemove}
        title="Remove condition"
        className={`
          flex-shrink-0 p-1.5 rounded-lg
          text-gray-800 hover:bg-gray-100
          transition-all duration-150 cursor-pointer
          ${isHovered && showRemove ? 'opacity-100' : 'opacity-0'}
        `}
        disabled={!showRemove}
      >
        <TrashIcon size={16} />
      </button>
    </div>
  );
};

// ============================================================================
// Prompt-Based Filter Popover Component (using new Filter design)
// ============================================================================

interface PromptBasedFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  filters: DashboardFilter[];
  onFiltersChange: (filters: DashboardFilter[]) => void;
  placeholder?: string;
  availableFields?: FilterField[];
}

const PromptBasedFilterPopover: React.FC<PromptBasedFilterPopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
  filters,
  onFiltersChange,
  placeholder = 'Describe what you want to see',
  availableFields,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [aiPrompt, setAiPrompt] = useState('');
  const [groups, setGroups] = useState<FilterGroup[]>(() => dashboardFiltersToGroups(filters));

  // Default fields if none provided
  const fields: FilterField[] = availableFields || [
    { value: 'name', label: 'Name' },
    { value: 'stage', label: 'Stage' },
    { value: 'amount', label: 'Amount' },
    { value: 'close_date', label: 'Close Date' },
    { value: 'owner', label: 'Owner' },
    { value: 'account', label: 'Account' },
    { value: 'probability', label: 'Probability' },
  ];

  // Sync groups when filters change externally
  useEffect(() => {
    if (isOpen) {
      setGroups(dashboardFiltersToGroups(filters));
    }
  }, [isOpen, filters]);

  // Position calculation
  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const popoverWidth = 600;
      const leftPosition = Math.max(16, rect.right - popoverWidth);
      setPosition({
        top: rect.bottom + 8,
        left: leftPosition,
      });
    }
  }, [isOpen, anchorRef]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiPrompt.trim()) {
      // Simulate AI processing - create filter from prompt
      const lowerPrompt = aiPrompt.toLowerCase();
      const newConditions: FilterCondition[] = [];

      if (lowerPrompt.includes('this quarter') || lowerPrompt.includes('q1')) {
        newConditions.push({
          id: generateFilterId(),
          field: 'close_date',
          operator: 'equals',
          value: 'This Quarter',
        });
      }

      if (lowerPrompt.includes('>') && lowerPrompt.includes('$')) {
        const match = aiPrompt.match(/>\s*\$?([\d,]+)k?/i);
        if (match) {
          const value = match[1].replace(/,/g, '');
          newConditions.push({
            id: generateFilterId(),
            field: 'amount',
            operator: 'greater_than',
            value: lowerPrompt.includes('k') ? `${parseInt(value) * 1000}` : value,
          });
        }
      }

      if (newConditions.length === 0) {
        newConditions.push({
          id: generateFilterId(),
          field: 'name',
          operator: 'contains',
          value: aiPrompt,
        });
      }

      const firstGroup = groups[0];
      const updatedGroup = {
        ...firstGroup,
        conditions: [...firstGroup.conditions.filter((c) => c.field), ...newConditions],
      };
      setGroups([updatedGroup, ...groups.slice(1)]);
      setAiPrompt('');
    }
  };

  const firstGroup = groups[0];
  const nestedGroups = groups.slice(1);

  const addCondition = () => {
    if (groups.length === 0) {
      const newGroup: FilterGroup = {
        id: generateFilterId(),
        conditions: [{ id: generateFilterId(), field: '', operator: 'contains', value: '' }],
        connector: 'and',
      };
      setGroups([newGroup]);
    } else {
      const updatedFirstGroup = {
        ...firstGroup,
        conditions: [
          ...firstGroup.conditions,
          { id: generateFilterId(), field: '', operator: 'contains', value: '' },
        ],
      };
      setGroups([updatedFirstGroup, ...nestedGroups]);
    }
  };

  const updateFirstGroupCondition = (index: number, updatedCondition: FilterCondition) => {
    const newConditions = [...firstGroup.conditions];
    newConditions[index] = updatedCondition;
    const updatedFirstGroup = { ...firstGroup, conditions: newConditions };
    setGroups([updatedFirstGroup, ...nestedGroups]);
  };

  const removeFirstGroupCondition = (index: number) => {
    if (firstGroup.conditions.length === 1 && nestedGroups.length === 0) {
      return;
    }
    if (firstGroup.conditions.length === 1) {
      setGroups(nestedGroups);
    } else {
      const newConditions = firstGroup.conditions.filter((_, i) => i !== index);
      const updatedFirstGroup = { ...firstGroup, conditions: newConditions };
      setGroups([updatedFirstGroup, ...nestedGroups]);
    }
  };

  const updateFirstGroupConnector = (connector: 'and' | 'or') => {
    const updatedFirstGroup = { ...firstGroup, connector };
    setGroups([updatedFirstGroup, ...nestedGroups]);
  };

  const handleApply = () => {
    const dashboardFilters = groupsToDashboardFilters(groups);
    onFiltersChange(dashboardFilters);
    onClose();
  };

  const handleCancel = () => {
    setGroups(dashboardFiltersToGroups(filters));
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed bg-white rounded-xl shadow-xl border border-gray-200 z-[10000] overflow-hidden"
      style={{ top: position.top, left: position.left, minWidth: 600, maxWidth: 800 }}
    >
      <div className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Filter</span>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* AI Prompt Input */}
        <form onSubmit={handleAISubmit}>
          <div
            className="p-[1px] rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #FF9042 0%, #854FFF 100%)',
            }}
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-[7px]">
              <VonAILogo size={18} />
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Section label */}
        <div className="text-sm text-gray-700">In this view, show records</div>

        {/* Filter Conditions */}
        <div className="flex flex-col gap-2">
          {firstGroup &&
            firstGroup.conditions.map((condition, index) => (
              <FilterConditionRow
                key={condition.id}
                condition={condition}
                fields={fields}
                onChange={(updated) => updateFirstGroupCondition(index, updated)}
                onRemove={() => removeFirstGroupCondition(index)}
                showRemove={firstGroup.conditions.length > 1 || nestedGroups.length > 0}
                rowPrefix={index === 0 ? 'where' : 'connector'}
                connector={firstGroup.connector}
                onConnectorChange={updateFirstGroupConnector}
              />
            ))}

          {/* Add condition button */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={addCondition}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-800 bg-transparent border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <PlusIcon size={14} />
              <span>Add condition</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <GhostButton onClick={handleCancel}>Cancel</GhostButton>
          <PrimaryButton onClick={handleApply}>Apply</PrimaryButton>
        </div>
      </div>
    </motion.div>,
    document.body
  );
};

// ============================================================================
// KPI Card Component
// ============================================================================

interface KPICardProps {
  data: KPICardData;
  isAnimating?: boolean;
  onDrillDown?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  data,
  isAnimating,
  onDrillDown,
  onContextMenu,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-gray-200 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Actions */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2 flex items-center gap-1"
          >
            <SecondaryIconButton
              icon={<TableIcon size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown?.();
              }}
              title="View data"
              size="small"
            />
            <SecondaryIconButton
              icon={<DotsThreeIcon size={14} weight="bold" />}
              onClick={(e) => {
                e.stopPropagation();
                onContextMenu?.(e);
              }}
              title="More options"
              size="small"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-gray-500 mb-1">{data.title}</p>
      <p className="text-2xl font-semibold text-gray-900 tabular-nums">{data.value}</p>
      {data.change && (
        <div className="flex items-center gap-1 mt-1">
          {data.changeDirection === 'up' && <ArrowUpIcon size={12} className="text-emerald-600" />}
          {data.changeDirection === 'down' && <ArrowDownIcon size={12} className="text-red-600" />}
          <span
            className={`text-xs font-medium ${
              data.changeDirection === 'up'
                ? 'text-emerald-600'
                : data.changeDirection === 'down'
                  ? 'text-red-600'
                  : 'text-gray-500'
            }`}
          >
            {data.change}
          </span>
          {data.subtitle && <span className="text-xs text-gray-500">{data.subtitle}</span>}
        </div>
      )}

      {/* Progress bar */}
      {data.progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">Progress</span>
            {data.target && (
              <span className="text-[10px] text-gray-500">Target: {data.target}</span>
            )}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, data.progress))}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                data.progress >= 100
                  ? 'bg-emerald-500'
                  : data.progress >= 75
                    ? 'bg-indigo-500'
                    : data.progress >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-400'
              }`}
            />
          </div>
          <div className="flex items-center justify-end mt-0.5">
            <span className="text-[10px] font-medium text-gray-600">
              {Math.round(data.progress)}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// Chart Widget Component
// ============================================================================

interface ChartWidgetProps {
  data: ChartData;
  isAnimating?: boolean;
  onDrillDown?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onSegmentClick?: (segmentData: { name: string; value: number }) => void;
  onClick?: () => void;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({
  data,
  isAnimating,
  onDrillDown,
  onContextMenu,
  onSegmentClick,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const chartOptions: Highcharts.Options = useMemo(() => {
    const baseOptions: Highcharts.Options = {
      chart: {
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' },
        spacing: [10, 10, 10, 10],
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: { fontSize: '11px', fontWeight: '400', color: '#6b7280' },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        borderRadius: 8,
        style: { color: '#fff', fontSize: '11px' },
      },
    };

    if (data.type === 'bar') {
      const barData = data.data as {
        categories: string[];
        series: { name: string; data: number[] }[];
      };
      return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'column' },
        xAxis: {
          categories: barData.categories,
          labels: { style: { fontSize: '10px', color: '#6b7280' } },
          lineColor: '#e5e7eb',
          tickColor: '#e5e7eb',
        },
        yAxis: {
          title: { text: undefined },
          labels: { style: { fontSize: '10px', color: '#6b7280' } },
          gridLineColor: '#f3f4f6',
        },
        plotOptions: {
          column: {
            borderRadius: 4,
            borderWidth: 0,
            groupPadding: 0.2,
            pointPadding: 0.1,
            cursor: onSegmentClick ? 'pointer' : 'default',
            point: {
              events: {
                click: function (this: Highcharts.Point) {
                  if (onSegmentClick) {
                    onSegmentClick({
                      name: this.category as string,
                      value: this.y as number,
                    });
                  }
                },
              },
            },
          },
        },
        colors: ['#4f46e5', '#818cf8'],
        series: barData.series as Highcharts.SeriesOptionsType[],
      };
    }

    if (data.type === 'pie') {
      const pieData = data.data as { name: string; y: number; color?: string }[];
      return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'pie' },
        plotOptions: {
          pie: {
            innerSize: '50%',
            borderWidth: 0,
            cursor: onSegmentClick ? 'pointer' : 'default',
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.percentage:.0f}%',
              style: { fontSize: '10px', fontWeight: '400', color: '#374151' },
            },
            point: {
              events: {
                click: function (this: Highcharts.Point) {
                  if (onSegmentClick) {
                    onSegmentClick({
                      name: this.name as string,
                      value: this.y as number,
                    });
                  }
                },
              },
            },
          },
        },
        series: [
          {
            type: 'pie',
            name: 'Distribution',
            data: pieData,
          },
        ],
      };
    }

    if (data.type === 'waterfall') {
      const waterfallData = data.data as WaterfallDataPoint[];
      return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'waterfall' },
        xAxis: {
          type: 'category' as const,
          labels: { style: { fontSize: '10px', color: '#6b7280' } },
          lineColor: '#e5e7eb',
          tickColor: '#e5e7eb',
        },
        yAxis: {
          title: { text: undefined },
          labels: {
            style: { fontSize: '10px', color: '#6b7280' },
            formatter: function (this: Highcharts.AxisLabelsFormatterContextObject): string {
              const value = this.value as number;
              if (Math.abs(value) >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              }
              if (Math.abs(value) >= 1000) {
                return `$${(value / 1000).toFixed(0)}K`;
              }
              return `$${value}`;
            },
          },
          gridLineColor: '#f3f4f6',
        },
        plotOptions: {
          waterfall: {
            borderWidth: 0,
            borderRadius: 4,
            cursor: onSegmentClick ? 'pointer' : 'default',
            dataLabels: {
              enabled: true,
              style: { fontSize: '10px', fontWeight: '500', color: '#374151' },
              formatter: function (): string {
                const value = (this as unknown as { y: number }).y;
                if (Math.abs(value) >= 1000000) {
                  return `$${(value / 1000000).toFixed(2)}M`;
                }
                if (Math.abs(value) >= 1000) {
                  return `$${(value / 1000).toFixed(0)}K`;
                }
                return `$${value}`;
              },
            },
            point: {
              events: {
                click: function (this: Highcharts.Point) {
                  if (onSegmentClick) {
                    onSegmentClick({
                      name: this.name as string,
                      value: this.y as number,
                    });
                  }
                },
              },
            },
          },
        },
        legend: { enabled: false },
        // Waterfall-specific colors
        colors: ['#4f46e5'], // Default positive color
        series: [
          {
            type: 'waterfall',
            name: 'Amount',
            upColor: '#10b981', // Green for positive
            color: '#ef4444', // Red for negative
            data: waterfallData,
          },
        ],
      };
    }

    if (data.type === 'combination') {
      const comboData = data.data as CombinationChartData;

      // Configure Y-axes
      const yAxisConfig: Highcharts.YAxisOptions[] = [
        {
          title: { text: undefined },
          labels: {
            style: { fontSize: '10px', color: '#6b7280' },
            formatter: function (this: Highcharts.AxisLabelsFormatterContextObject): string {
              const value = this.value as number;
              if (Math.abs(value) >= 1000000) {
                return `$${(value / 1000000).toFixed(0)}M`;
              }
              if (Math.abs(value) >= 1000) {
                return `$${(value / 1000).toFixed(0)}K`;
              }
              return `$${value}`;
            },
          },
          gridLineColor: '#f3f4f6',
        },
      ];

      // Add right axis if dual axis is enabled
      if (comboData.dualAxis) {
        yAxisConfig.push({
          title: { text: comboData.rightAxisTitle || undefined },
          labels: { style: { fontSize: '10px', color: '#6b7280' } },
          gridLineColor: '#f3f4f6',
          opposite: true,
        });
      }

      return {
        ...baseOptions,
        chart: { ...baseOptions.chart },
        xAxis: {
          categories: comboData.categories,
          labels: { style: { fontSize: '10px', color: '#6b7280' } },
          lineColor: '#e5e7eb',
          tickColor: '#e5e7eb',
        },
        yAxis: yAxisConfig,
        plotOptions: {
          column: {
            borderRadius: 4,
            borderWidth: 0,
            stacking: 'normal',
            cursor: onSegmentClick ? 'pointer' : 'default',
            point: {
              events: {
                click: function (this: Highcharts.Point) {
                  if (onSegmentClick) {
                    onSegmentClick({
                      name: this.category as string,
                      value: this.y as number,
                    });
                  }
                },
              },
            },
          },
          spline: {
            lineWidth: 2,
            marker: {
              enabled: true,
              radius: 4,
              symbol: 'circle',
            },
          },
          line: {
            lineWidth: 2,
            marker: {
              enabled: true,
              radius: 4,
              symbol: 'circle',
            },
          },
        },
        tooltip: {
          ...baseOptions.tooltip,
          shared: true,
          formatter: function (): string {
            const ctx = this as unknown as {
              x: string;
              points?: Array<{
                y: number;
                color: string;
                series: { name: string };
              }>;
            };
            let tooltip = `<b>${ctx.x}</b><br/>`;
            ctx.points?.forEach((point) => {
              const value = point.y;
              let formattedValue: string;
              if (Math.abs(value) >= 1000000) {
                formattedValue = `$${(value / 1000000).toFixed(2)}M`;
              } else if (Math.abs(value) >= 1000) {
                formattedValue = `$${(value / 1000).toFixed(0)}K`;
              } else {
                formattedValue = `$${value}`;
              }
              tooltip += `<span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${formattedValue}</b><br/>`;
            });
            return tooltip;
          },
        },
        series: comboData.series.map((s) => ({
          type: s.type,
          name: s.name,
          data: s.data,
          color: s.color,
          dashStyle: s.dashStyle,
          stack: s.stack,
          yAxis: s.yAxis || 0,
          marker: s.marker,
        })) as Highcharts.SeriesOptionsType[],
      };
    }

    return baseOptions;
  }, [data, onSegmentClick]);

  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-900">{data.title}</span>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <SecondaryIconButton
                icon={<TableIcon size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDrillDown?.();
                }}
                title="View data"
                size="small"
              />
              <SecondaryIconButton
                icon={<DotsThreeIcon size={14} weight="bold" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onContextMenu?.(e);
                }}
                title="More options"
                size="small"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="p-4 h-64">
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions}
          containerProps={{ style: { height: '100%', width: '100%' } }}
        />
      </div>
    </motion.div>
  );
};

// ============================================================================
// Settings Panel Component (Slide-up Panel)
// ============================================================================

type SettingsTab = 'refresh' | 'sharing' | 'details';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('refresh');
  const [refreshFrequency, setRefreshFrequency] = useState('daily');
  const [visibility, setVisibility] = useState('private');

  if (!isOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'refresh', label: 'Refresh', icon: <ArrowsClockwiseIcon size={16} /> },
    { id: 'sharing', label: 'Sharing', icon: <UsersIcon size={16} /> },
    { id: 'details', label: 'Details', icon: <InfoIcon size={16} /> },
  ];

  return (
    <>
      {/* Backdrop with blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl border-t border-gray-200 flex flex-col z-50 overflow-hidden"
        style={{ height: '90%' }}
      >
        {/* Resize Handle */}
        <div className="absolute -top-2 left-0 right-0 h-4 flex justify-center items-center">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <GearIcon size={20} className="text-gray-700" />
            <span className="text-sm font-semibold text-gray-900">Dashboard Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Content Area with Sidebar Navigation */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-56 border-r border-gray-100 bg-gray-50 p-4 flex-shrink-0">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer
                    ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        : 'text-gray-800 hover:text-gray-900 hover:bg-white/50'
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'refresh' && (
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h3 className="text-[14px] font-semibold text-gray-900 mb-1">
                    Refresh Frequency
                  </h3>
                  <p className="text-sm text-gray-500">
                    Choose how often this dashboard should refresh its data.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      value: 'realtime',
                      label: 'Real-time',
                      desc: 'Updates automatically as data changes in your connected sources',
                      recommended: true,
                    },
                    { value: 'hourly', label: 'Hourly', desc: 'Refreshes every hour on the hour' },
                    {
                      value: 'daily',
                      label: 'Daily',
                      desc: 'Refreshes once per day at midnight in your timezone',
                    },
                    { value: 'weekly', label: 'Weekly', desc: 'Refreshes every Monday at 9:00 AM' },
                    {
                      value: 'manual',
                      label: 'Manual only',
                      desc: 'Only refreshes when you click the refresh button',
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`
                        flex items-start gap-4 px-4 py-4 rounded-xl border cursor-pointer transition-all
                        ${
                          refreshFrequency === option.value
                            ? 'border-indigo-300 bg-indigo-50/50 ring-1 ring-indigo-200'
                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="refreshFrequency"
                        value={option.value}
                        checked={refreshFrequency === option.value}
                        onChange={(e) => setRefreshFrequency(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                          ${
                            refreshFrequency === option.value
                              ? 'border-indigo-600'
                              : 'border-gray-300'
                          }
                        `}
                      >
                        {refreshFrequency === option.value && (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-medium text-gray-900">{option.label}</p>
                          {option.recommended && (
                            <span className="px-2 py-0.5 text-[10px] font-medium text-indigo-700 bg-indigo-100 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-3">
                    <InfoIcon size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">About data refresh</p>
                      <p className="text-[12px] text-gray-500 mt-1">
                        Real-time refresh may increase data usage and API calls to your connected
                        sources. Consider using hourly or daily refresh for dashboards that don't
                        require live data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sharing' && (
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h3 className="text-[14px] font-semibold text-gray-900 mb-1">
                    Visibility & Access
                  </h3>
                  <p className="text-sm text-gray-500">
                    Control who can view and interact with this dashboard.
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    {
                      value: 'private',
                      label: 'Private',
                      desc: 'Only you can view this dashboard',
                      icon: <UserIcon size={18} />,
                    },
                    {
                      value: 'team',
                      label: 'Team',
                      desc: 'All members of your team can view',
                      icon: <UsersIcon size={18} />,
                    },
                    {
                      value: 'org',
                      label: 'Organization',
                      desc: 'Everyone in your organization can view',
                      icon: <UsersIcon size={18} />,
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`
                        flex items-start gap-4 px-4 py-4 rounded-xl border cursor-pointer transition-all
                        ${
                          visibility === option.value
                            ? 'border-indigo-300 bg-indigo-50/50 ring-1 ring-indigo-200'
                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={visibility === option.value}
                        onChange={(e) => setVisibility(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`
                          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                          ${
                            visibility === option.value
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'bg-gray-100 text-gray-500'
                          }
                        `}
                      >
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-medium text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{option.desc}</p>
                      </div>
                      {visibility === option.value && (
                        <CheckIcon size={20} className="text-indigo-600 flex-shrink-0" />
                      )}
                    </label>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Invite Collaborators</h4>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      placeholder="Enter email address..."
                      className="flex-1 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <PrimaryButton>
                      <span className="flex items-center gap-2">
                        <PaperPlaneTiltIcon size={14} />
                        Invite
                      </span>
                    </PrimaryButton>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-2">
                    Invited collaborators will receive an email with a link to view this dashboard.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Current Access</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'John Doe', email: 'john@example.com', role: 'Owner', avatar: 'JD' },
                      {
                        name: 'Sarah Chen',
                        email: 'sarah@example.com',
                        role: 'Editor',
                        avatar: 'SC',
                      },
                      {
                        name: 'Mike Johnson',
                        email: 'mike@example.com',
                        role: 'Viewer',
                        avatar: 'MJ',
                      },
                    ].map((user) => (
                      <div key={user.email} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-semibold text-indigo-600">
                            {user.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-[12px] text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${
                            user.role === 'Owner'
                              ? 'bg-indigo-100 text-indigo-700'
                              : user.role === 'Editor'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h3 className="text-[14px] font-semibold text-gray-900 mb-1">
                    Dashboard Details
                  </h3>
                  <p className="text-sm text-gray-500">View information about this dashboard.</p>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
                  {[
                    { label: 'Dashboard Name', value: 'Deals Closing This Quarter' },
                    { label: 'Created', value: 'January 15, 2025 at 10:30 AM' },
                    { label: 'Last Modified', value: '2 hours ago' },
                    { label: 'Owner', value: 'John Doe' },
                    { label: 'Data Sources', value: 'Salesforce, HubSpot, Snowflake' },
                    { label: 'Widgets', value: '6 widgets (3 KPIs, 2 Charts, 1 Table)' },
                    { label: 'Refresh Rate', value: 'Daily at midnight' },
                    { label: 'Last Refreshed', value: 'Today at 12:00 AM' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-3.5">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm text-gray-900 font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Danger Zone</h4>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-red-900">Delete this dashboard</p>
                        <p className="text-[12px] text-red-700 mt-0.5">
                          Once deleted, this dashboard cannot be recovered. All widgets and
                          configurations will be permanently removed.
                        </p>
                      </div>
                      <button className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer flex-shrink-0">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={onClose}>Save Changes</PrimaryButton>
        </div>
      </motion.div>
    </>
  );
};

// ============================================================================
// Table Widget Component
// ============================================================================

interface TableWidgetProps {
  data: TableData;
  isAnimating?: boolean;
  onDrillDown?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

const TableWidget: React.FC<TableWidgetProps> = ({
  data,
  isAnimating,
  onDrillDown,
  onContextMenu,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Convert TableData columns to ReportColumn format
  const reportColumns: ReportColumn[] = useMemo(() => {
    return data.columns.map((col) => ({
      id: col.id,
      label: col.label,
      type: (col.type === 'string' ? 'text' : col.type) as ReportColumn['type'],
      isAI: col.isAI,
      sortable: true,
      width: col.type === 'currency' ? 130 : col.type === 'number' ? 80 : 120,
    }));
  }, [data.columns]);

  // Convert rows to the format expected by ReportTable
  const tableData = useMemo(() => {
    return data.rows.map((row, idx) => ({
      ...row,
      id: row.id || `row-${idx}`,
    }));
  }, [data.rows]);

  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-900">{data.title}</span>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <SecondaryIconButton
                icon={<TableIcon size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDrillDown?.();
                }}
                title="View full data"
                size="small"
              />
              <SecondaryIconButton
                icon={<DotsThreeIcon size={14} weight="bold" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onContextMenu?.(e);
                }}
                title="More options"
                size="small"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table using ReportTable component */}
      <div className="max-h-80 overflow-hidden">
        <ReportTable
          options={buildGridOptions(reportColumns, tableData, {
            pageSize: 10,
            showPagination: false,
          })}
        />
      </div>
    </motion.div>
  );
};

// ============================================================================
// Text Widget Component
// ============================================================================

// Von Minimal Logo component - inline SVG for AI-generated content
const VonMinimalLogo: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.57031 0.00976562C11.3747 0.202421 14.4003 3.34798 14.4004 7.2002L14.3916 7.5498C14.3088 9.2802 13.6139 10.8497 12.5205 12.0488L12.418 12.1768C12.3818 12.2193 12.3437 12.2617 12.3027 12.3027C12.2209 12.3846 12.1333 12.4559 12.0488 12.5205C10.8497 13.6139 9.2802 14.3088 7.5498 14.3916L7.2002 14.4004C3.34798 14.4003 0.202421 11.3747 0.00976562 7.57031L0 7.2002C4.98797e-05 5.32944 0.71407 3.62479 1.88379 2.34473C1.94851 2.26043 2.01865 2.17666 2.09766 2.09766C2.17973 2.01559 2.26687 1.94274 2.35449 1.87598C3.63351 0.711246 5.33393 5.07565e-05 7.2002 0L7.57031 0.00976562ZM1.5459 5.90137C1.45048 6.31879 1.4004 6.75354 1.40039 7.2002C1.40039 10.4034 3.99702 12.9999 7.2002 13C7.64728 13 8.08216 12.9484 8.5 12.8525C7.09291 12.4323 5.56942 11.5089 4.23047 10.1699C2.89169 8.83108 1.96633 7.30834 1.5459 5.90137ZM5.37598 2.84961C4.32573 2.56213 3.63214 2.69284 3.24414 2.95801C3.1455 3.05003 3.05003 3.1455 2.95801 3.24414C2.69285 3.63214 2.56213 4.32573 2.84961 5.37598C3.17108 6.54998 3.97097 7.92989 5.2207 9.17969C6.47056 10.4295 7.85126 11.2293 9.02539 11.5508C10.0728 11.8374 10.7638 11.7063 11.1523 11.4424C11.2524 11.3491 11.3491 11.2524 11.4424 11.1523C11.7063 10.7638 11.8374 10.0728 11.5508 9.02539C11.2293 7.85126 10.4295 6.47056 9.17969 5.2207C7.92989 3.97097 6.54998 3.17108 5.37598 2.84961ZM7.2002 1.40039C6.75354 1.40041 6.31879 1.45048 5.90137 1.5459C7.30834 1.96633 8.83108 2.89169 10.1699 4.23047C11.5089 5.56942 12.4323 7.09291 12.8525 8.5C12.9484 8.08216 13 7.64728 13 7.2002C12.9999 3.99702 10.4034 1.40039 7.2002 1.40039Z"
      fill="url(#paint0_radial_von_text_widget)"
    />
    <defs>
      <radialGradient
        id="paint0_radial_von_text_widget"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(11.1377 1.0752) rotate(120.964) scale(15.3062)"
      >
        <stop stopColor="#FFF3EB" />
        <stop offset="0.26" stopColor="#FF9042" />
        <stop offset="1" stopColor="#854FFF" />
      </radialGradient>
    </defs>
  </svg>
);

interface TextWidgetProps {
  data: TextWidgetData;
  isAnimating?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  onChange?: (content: string) => void;
}

const TextWidget: React.FC<TextWidgetProps> = ({
  data,
  isAnimating,
  onContextMenu,
  onClick,
  onChange,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxChars = data.maxCharacters || 500;
  const charCount = content.length;
  const isOverLimit = charCount > maxChars;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content, isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (!isOverLimit) {
      onChange?.(content);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent(data.content);
  };

  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!isEditing) onClick?.();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {data.isAIGenerated ? (
            <VonMinimalLogo size={16} />
          ) : (
            <NoteIcon size={16} className="text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-900">{data.title}</span>
        </div>
        <AnimatePresence>
          {isHovered && !isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <SecondaryIconButton
                icon={<PencilSimpleIcon size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                title="Edit"
                size="small"
              />
              <SecondaryIconButton
                icon={<DotsThreeIcon size={14} weight="bold" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onContextMenu?.(e);
                }}
                title="More options"
                size="small"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`
                w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border rounded-lg
                placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
                resize-none min-h-[100px] leading-relaxed
                ${isOverLimit ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}
              `}
              placeholder="Add your notes here..."
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] ${isOverLimit ? 'text-red-500 font-medium' : 'text-gray-500'}`}
              >
                {charCount}/{maxChars} characters
              </span>
              <div className="flex items-center gap-2">
                <GhostButton onClick={handleCancel}>Cancel</GhostButton>
                <PrimaryButton onClick={handleSave} disabled={isOverLimit}>
                  Save
                </PrimaryButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-widget-content">
            {content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom heading styles following design system
                  h1: ({ children }) => (
                    <h1 className="text-sm font-medium text-gray-900 mb-3">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-medium text-gray-900 mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-medium text-gray-900 mb-2">{children}</h3>
                  ),
                  // Paragraph styling
                  p: ({ children }) => (
                    <p className="text-sm text-gray-700 leading-relaxed mb-3 last:mb-0">
                      {children}
                    </p>
                  ),
                  // List styling
                  ul: ({ children }) => (
                    <ul className="text-sm text-gray-700 space-y-2 mb-3 last:mb-0">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-sm text-gray-700 space-y-2 mb-3 last:mb-0 list-decimal pl-4">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  // Strong/bold text
                  strong: ({ children }) => (
                    <span className="font-medium text-gray-900">{children}</span>
                  ),
                  // Emphasis/italic
                  em: ({ children }) => <span className="italic text-gray-600">{children}</span>,
                  // Code
                  code: ({ children }) => (
                    <code className="text-[12px] bg-gray-100 px-1 py-0.5 rounded text-gray-800">
                      {children}
                    </code>
                  ),
                  // Links
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-indigo-600 hover:text-indigo-700 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-gray-400 italic">Click edit to add notes...</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const DashboardV2: React.FC<DashboardV2Props> = ({
  name,
  kpiCards,
  barChart,
  pieChart,
  waterfallChart,
  combinationChart,
  table,
  textWidget,
  onTextWidgetChange,
  isBuilding = false,
  visibleWidgets = [],
  onWidgetDrillDown,
  onWidgetEdit,
  onWidgetDelete,
  onFilterClick,
  onExportClick,
  onRefreshClick,
  onShareClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEditClick,
  onNameChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isEditMode = false,
  timelineFilter = 'this-quarter',
  onTimelineFilterChange,
  ownerFilter = 'all',
  onOwnerFilterChange,
  ownerOptions = [],
  advancedFilters = [],
  onAdvancedFiltersChange,
  availableFilterFields = [],
  onChartSegmentClick,
  onCancelClick,
  timestamp,
  createdBy,
  onWidgetClick,
}) => {
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const timelineButtonRef = useRef<HTMLButtonElement>(null);
  const ownerButtonRef = useRef<HTMLButtonElement>(null);
  const shareButtonRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const editButtonRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [showTimelinePopover, setShowTimelinePopover] = useState(false);
  const [showOwnerPopover, setShowOwnerPopover] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Derive owner options for dropdown
  const ownerDropdownOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [{ value: 'all', label: 'All Owners' }];
    ownerOptions.forEach((owner) => {
      options.push({ value: owner.id, label: owner.name });
    });
    return options;
  }, [ownerOptions]);

  // Derive field options for filter rows (kept for AdvancedFiltersPopover if needed)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _fieldOptions = useMemo(() => {
    return availableFilterFields.map((f) => ({ value: f, label: f }));
  }, [availableFilterFields]);

  // Get display labels for current filter values
  const timelineLabel =
    TIMELINE_OPTIONS.find((o) => o.value === timelineFilter)?.label || 'This Quarter';
  const ownerLabel =
    ownerDropdownOptions.find((o) => o.value === ownerFilter)?.label || 'All Owners';

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { top: number; left: number };
    widgetId: string | null;
  }>({ isOpen: false, position: { top: 0, left: 0 }, widgetId: null });

  // Close all popovers when one opens
  const handleOpenTimelinePopover = () => {
    setShowTimelinePopover(true);
    setShowOwnerPopover(false);
    setShowAdvancedFilters(false);
  };

  const handleOpenOwnerPopover = () => {
    setShowOwnerPopover(true);
    setShowTimelinePopover(false);
    setShowAdvancedFilters(false);
  };

  const handleOpenAdvancedFilters = () => {
    setShowAdvancedFilters(true);
    setShowTimelinePopover(false);
    setShowOwnerPopover(false);
  };

  const handleContextMenu = (e: React.MouseEvent, widgetId: string) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { top: e.clientY, left: e.clientX },
      widgetId,
    });
  };

  const handleContextMenuAction = (actionId: string) => {
    if (!contextMenu.widgetId) return;
    if (actionId === 'edit') {
      onWidgetEdit?.(contextMenu.widgetId);
    } else if (actionId === 'delete') {
      onWidgetDelete?.(contextMenu.widgetId);
    }
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const isWidgetVisible = (widgetId: string) => {
    if (!isBuilding) return true;
    return visibleWidgets.includes(widgetId);
  };

  return (
    <div className="px-2 h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        {/* Left side - Dashboard Name and metadata */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Dashboard Name - Editable */}
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={() => {
                setIsEditingName(false);
                if (editedName.trim() && editedName !== name) {
                  onNameChange?.(editedName.trim());
                } else {
                  setEditedName(name);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingName(false);
                  if (editedName.trim() && editedName !== name) {
                    onNameChange?.(editedName.trim());
                  }
                }
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setEditedName(name);
                }
              }}
              autoFocus
              className="text-lg font-medium text-gray-900 bg-transparent border-b border-indigo-500 outline-none px-0 py-0"
            />
          ) : (
            <span
              className={`text-lg font-medium text-gray-900 ${onNameChange ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''}`}
              onClick={() => {
                if (onNameChange) {
                  setIsEditingName(true);
                }
              }}
              title={onNameChange ? 'Click to edit name' : undefined}
            >
              {name}
            </span>
          )}

          {/* Timestamp with Refresh */}
          {(timestamp || createdBy || onRefreshClick) && (
            <div className="flex items-center gap-1 tracking-tight text-[11px] text-gray-600 whitespace-nowrap">
              {onRefreshClick && (
                <button
                  onClick={onRefreshClick}
                  className="flex items-center gap-1 px-1.5 py-1 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Refresh now"
                >
                  <ArrowsClockwiseIcon size={12} />
                </button>
              )}
              {timestamp && <span>Last refreshed {timestamp}</span>}
              {timestamp && createdBy && <span>•</span>}
              {createdBy && <span>by {createdBy}</span>}
            </div>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Export Button */}
          {onExportClick && (
            <SecondaryIconButton
              icon={<DownloadIcon size={14} />}
              onClick={onExportClick}
              title="Export as PDF"
            />
          )}

          {/* Share Button */}
          {onShareClick && (
            <div ref={shareButtonRef}>
              <SecondaryIconButton
                icon={<PaperPlaneTiltIcon size={14} />}
                onClick={() => {
                  if (shareButtonRef.current) {
                    onShareClick(shareButtonRef.current.getBoundingClientRect());
                  }
                }}
                title="Share dashboard"
              />
            </div>
          )}

          {/* Settings Button */}
          <button
            ref={settingsButtonRef}
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className={`
              p-2 rounded-lg transition-colors cursor-pointer
              ${
                showSettingsPanel
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-800 hover:text-gray-700 hover:bg-gray-100'
              }
            `}
            title="Settings"
          >
            <GearIcon size={16} />
          </button>

          {/* Separator before Cancel */}
          {onCancelClick && <div className="h-6 w-px bg-gray-200" />}

          {/* Cancel Button */}
          {onCancelClick && (
            <button
              onClick={onCancelClick}
              className="p-2 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Close dashboard"
            >
              <XIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        {/* Timeline Filter Button */}
        {onTimelineFilterChange && (
          <button
            ref={timelineButtonRef}
            onClick={handleOpenTimelinePopover}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-sm transition-colors cursor-pointer
              ${
                showTimelinePopover
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-100 text-gray-800 hover:bg-gray-50 hover:border-gray-200'
              }
            `}
          >
            <CalendarIcon size={14} />
            <span>{timelineLabel}</span>
            <CaretDownIcon size={12} className="text-gray-400" />
          </button>
        )}

        {/* Owner Filter Button */}
        {onOwnerFilterChange && ownerDropdownOptions.length > 1 && (
          <button
            ref={ownerButtonRef}
            onClick={handleOpenOwnerPopover}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-sm transition-colors cursor-pointer
              ${
                showOwnerPopover
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-100 text-gray-800 hover:bg-gray-50 hover:border-gray-200'
              }
            `}
          >
            <UserIcon size={14} />
            <span>{ownerLabel}</span>
            <CaretDownIcon size={12} className="text-gray-400" />
          </button>
        )}

        {/* Advanced Filters Button */}
        {onAdvancedFiltersChange && (
          <button
            ref={filterButtonRef}
            onClick={handleOpenAdvancedFilters}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-sm transition-colors cursor-pointer
              ${
                showAdvancedFilters || advancedFilters.length > 0
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-100 text-gray-800 hover:bg-gray-50 hover:border-gray-200'
              }
            `}
          >
            <FunnelIcon size={14} />
            <span>Filters</span>
            {advancedFilters.length > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-medium bg-indigo-600 text-white rounded-full">
                {advancedFilters.length}
              </span>
            )}
          </button>
        )}

        {/* Legacy Filter Button (for backwards compatibility) */}
        {onFilterClick && !onAdvancedFiltersChange && (
          <button
            ref={filterButtonRef}
            onClick={() => {
              if (filterButtonRef.current) {
                onFilterClick(filterButtonRef.current.getBoundingClientRect());
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-800 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-colors cursor-pointer"
          >
            <FunnelIcon size={14} />
            <span>Filter</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-3 gap-4">
            {kpiCards.map((kpi) => (
              <AnimatePresence key={kpi.id}>
                {isWidgetVisible(kpi.id) && (
                  <KPICard
                    data={kpi}
                    isAnimating={isBuilding}
                    onDrillDown={() => onWidgetDrillDown?.(kpi.id)}
                    onContextMenu={(e) => handleContextMenu(e, kpi.id)}
                    onClick={() => onWidgetClick?.(kpi.id)}
                  />
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4">
            {barChart && (
              <AnimatePresence>
                {isWidgetVisible(barChart.id) && (
                  <ChartWidget
                    data={barChart}
                    isAnimating={isBuilding}
                    onDrillDown={() => onWidgetDrillDown?.(barChart.id)}
                    onContextMenu={(e) => handleContextMenu(e, barChart.id)}
                    onSegmentClick={
                      onChartSegmentClick
                        ? (segmentData) => onChartSegmentClick(barChart.id, segmentData)
                        : undefined
                    }
                    onClick={() => onWidgetClick?.(barChart.id)}
                  />
                )}
              </AnimatePresence>
            )}
            {pieChart && (
              <AnimatePresence>
                {isWidgetVisible(pieChart.id) && (
                  <ChartWidget
                    data={pieChart}
                    isAnimating={isBuilding}
                    onDrillDown={() => onWidgetDrillDown?.(pieChart.id)}
                    onContextMenu={(e) => handleContextMenu(e, pieChart.id)}
                    onSegmentClick={
                      onChartSegmentClick
                        ? (segmentData) => onChartSegmentClick(pieChart.id, segmentData)
                        : undefined
                    }
                    onClick={() => onWidgetClick?.(pieChart.id)}
                  />
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Waterfall & Combination Charts Row */}
          {(waterfallChart || combinationChart) && (
            <div className="grid grid-cols-2 gap-4">
              {waterfallChart && (
                <AnimatePresence>
                  {isWidgetVisible(waterfallChart.id) && (
                    <ChartWidget
                      data={waterfallChart}
                      isAnimating={isBuilding}
                      onDrillDown={() => onWidgetDrillDown?.(waterfallChart.id)}
                      onContextMenu={(e) => handleContextMenu(e, waterfallChart.id)}
                      onSegmentClick={
                        onChartSegmentClick
                          ? (segmentData) => onChartSegmentClick(waterfallChart.id, segmentData)
                          : undefined
                      }
                      onClick={() => onWidgetClick?.(waterfallChart.id)}
                    />
                  )}
                </AnimatePresence>
              )}
              {combinationChart && (
                <AnimatePresence>
                  {isWidgetVisible(combinationChart.id) && (
                    <ChartWidget
                      data={combinationChart}
                      isAnimating={isBuilding}
                      onDrillDown={() => onWidgetDrillDown?.(combinationChart.id)}
                      onContextMenu={(e) => handleContextMenu(e, combinationChart.id)}
                      onSegmentClick={
                        onChartSegmentClick
                          ? (segmentData) => onChartSegmentClick(combinationChart.id, segmentData)
                          : undefined
                      }
                      onClick={() => onWidgetClick?.(combinationChart.id)}
                    />
                  )}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* Table */}
          {table && (
            <AnimatePresence>
              {isWidgetVisible(table.id) && (
                <TableWidget
                  data={table}
                  isAnimating={isBuilding}
                  onDrillDown={() => onWidgetDrillDown?.(table.id)}
                  onContextMenu={(e) => handleContextMenu(e, table.id)}
                  onClick={() => onWidgetClick?.(table.id)}
                />
              )}
            </AnimatePresence>
          )}

          {/* Text Widget */}
          {textWidget && (
            <AnimatePresence>
              {isWidgetVisible(textWidget.id) && (
                <TextWidget
                  data={textWidget}
                  isAnimating={isBuilding}
                  onContextMenu={(e) => handleContextMenu(e, textWidget.id)}
                  onClick={() => onWidgetClick?.(textWidget.id)}
                  onChange={onTextWidgetChange}
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        items={getWidgetContextMenuItems()}
        fixedPosition={contextMenu.position}
        width={128}
        onItemClick={(item) => handleContextMenuAction(item.id)}
      />

      {/* Timeline Filter Popover */}
      <AnimatePresence>
        {onTimelineFilterChange && (
          <FilterDropdownPopover
            isOpen={showTimelinePopover}
            onClose={() => setShowTimelinePopover(false)}
            anchorRef={timelineButtonRef}
            options={TIMELINE_OPTIONS}
            value={timelineFilter}
            onChange={(value) => {
              onTimelineFilterChange(value as TimelineFilter);
            }}
            title="Time Period"
          />
        )}
      </AnimatePresence>

      {/* Owner Filter Popover */}
      <AnimatePresence>
        {onOwnerFilterChange && (
          <FilterDropdownPopover
            isOpen={showOwnerPopover}
            onClose={() => setShowOwnerPopover(false)}
            anchorRef={ownerButtonRef}
            options={ownerDropdownOptions}
            value={ownerFilter}
            onChange={(value) => {
              onOwnerFilterChange(value);
            }}
            title="Owner"
          />
        )}
      </AnimatePresence>

      {/* Prompt-Based Filters Popover */}
      <AnimatePresence>
        {onAdvancedFiltersChange && (
          <PromptBasedFilterPopover
            isOpen={showAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
            anchorRef={filterButtonRef}
            filters={advancedFilters}
            onFiltersChange={onAdvancedFiltersChange}
          />
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        <SettingsPanel
          isOpen={showSettingsPanel}
          onClose={() => setShowSettingsPanel(false)}
          anchorRef={settingsButtonRef}
        />
      </AnimatePresence>
    </div>
  );
};

export default DashboardV2;
