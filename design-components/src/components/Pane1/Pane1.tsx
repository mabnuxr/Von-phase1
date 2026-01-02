import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBar,
  ChartLine,
  ChartPie,
  ChartDonut,
  Hash,
  Table,
  MagnifyingGlass,
  ArrowLeft,
  TreeStructureIcon,
  CaretDownIcon,
  CaretRightIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { TextInput } from '../forms/input';
import { Select } from '../forms/dropdown';
import { FilterRow } from '../forms/filter';
import { Toggle } from '../forms/toggle';
import { AddButton, PrimaryButton, SecondaryButton, GhostButton, TertiaryIconButton, PrimaryIconButton } from '../forms/buttons';
import { ContextMenu, DeleteConfirmationPopup, NewReportModal, type ContextMenuItem, type NewReportConfig } from '../popups';

// ============================================================================
// Types
// ============================================================================

export interface ChartComponent {
  id: string;
  label: string;
  icon: 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';
}

export interface TableItem {
  id: string;
  label: string;
  columnCount?: number;
  /** Fields/columns available in this report for filtering */
  fields?: { value: string; label: string }[];
}

export interface SubtableItem {
  id: string;
  label: string;
  /** Whether this subtable section is expanded */
  isExpanded?: boolean;
  /** Child subtables (supports up to 3 levels deep) */
  children?: SubtableItem[];
}

export interface ComponentConfig {
  componentType: ChartComponent;
  title: string;
  reportId: string;
  filters: Array<{
    id: string;
    field: string;
    operator: string;
    value: string;
  }>;
}

export interface Pane1Props {
  /**
   * Available chart components for drag and drop
   */
  chartComponents?: ChartComponent[];

  /**
   * Data sources with their columns
   */
  dataSources?: TableItem[];

  /**
   * Search placeholder text
   * @default 'Search components...'
   */
  searchPlaceholder?: string;

  /**
   * Called when a component is dragged
   */
  onDragStart?: (component: ChartComponent) => void;

  /**
   * Called when a component is clicked (to configure)
   */
  onComponentClick?: (component: ChartComponent) => void;

  /**
   * Hierarchical subtables data (supports up to 3 levels)
   */
  subtables?: SubtableItem[];

  /**
   * Called when a subtable is clicked
   */
  onSubtableClick?: (id: string) => void;

  /**
   * Called when a subtable is toggled (expanded/collapsed)
   */
  onSubtableToggle?: (id: string, isExpanded: boolean) => void;

  /**
   * Called when a subtable is renamed
   */
  onSubtableRename?: (id: string, newName: string) => void;

  /**
   * Called when a subtable is deleted
   */
  onSubtableDelete?: (id: string) => void;

  /**
   * Initial active tab
   * @default 'dashboard'
   */
  defaultTab?: 'data' | 'dashboard';

  /**
   * Called when component configuration is saved
   */
  onSaveConfig?: (config: ComponentConfig) => void;

  /**
   * Called when component configuration is discarded
   */
  onDiscardConfig?: () => void;

  /**
   * Currently selected component for configuration (controlled)
   */
  selectedComponent?: ChartComponent | null;

  /**
   * Called when selected component changes
   */
  onSelectedComponentChange?: (component: ChartComponent | null) => void;

  /**
   * Called when a new report is created
   */
  onCreateReport?: (config: NewReportConfig) => void;
}

const iconMap = {
  bar: ChartBar,
  line: ChartLine,
  pie: ChartPie,
  donut: ChartDonut,
  metric: Hash,
  table: Table,
};

const defaultChartComponents: ChartComponent[] = [
  { id: 'bar', label: 'Bar Chart', icon: 'bar' },
  { id: 'line', label: 'Line Chart', icon: 'line' },
  { id: 'pie', label: 'Pie Chart', icon: 'pie' },
  { id: 'donut', label: 'Donut Chart', icon: 'donut' },
  { id: 'metric', label: 'Metric Card', icon: 'metric' },
  { id: 'table', label: 'Data Table', icon: 'table' },
];

const defaultFields = [
  { value: 'account_name', label: 'Account Name' },
  { value: 'stage', label: 'Stage' },
  { value: 'amount', label: 'Amount' },
  { value: 'close_date', label: 'Close Date' },
  { value: 'owner', label: 'Owner' },
  { value: 'industry', label: 'Industry' },
  { value: 'region', label: 'Region' },
];

const defaultDataSources: TableItem[] = [
  { id: '1', label: 'Accounts at Risk', columnCount: 8, fields: defaultFields },
  { id: '2', label: 'Engagement Timeline', columnCount: 6, fields: defaultFields },
  { id: '3', label: 'Risk by Region', columnCount: 3, fields: defaultFields },
  { id: '4', label: 'ARR at Risk by Industry', columnCount: 7, fields: defaultFields },
  { id: '5', label: 'Churn Probability Distribution', columnCount: 5, fields: defaultFields },
  { id: '6', label: 'Support Ticket Trends', columnCount: 4, fields: defaultFields },
];

const defaultSubtables: SubtableItem[] = [
  {
    id: 'revenue-summary',
    label: 'Revenue Summary',
    isExpanded: true,
    children: [
      {
        id: 'revenue-by-region',
        label: 'Revenue by Region',
        children: [
          { id: 'revenue-region-americas', label: 'Americas Breakdown' },
          { id: 'revenue-region-emea', label: 'EMEA Breakdown' },
          { id: 'revenue-region-apac', label: 'APAC Breakdown' },
        ],
      },
      {
        id: 'revenue-by-product',
        label: 'Revenue by Product',
        children: [
          { id: 'revenue-product-enterprise', label: 'Enterprise Tier' },
          { id: 'revenue-product-growth', label: 'Growth Tier' },
        ],
      },
    ],
  },
  {
    id: 'pipeline-analysis',
    label: 'Pipeline Analysis',
    isExpanded: false,
    children: [
      { id: 'pipeline-by-stage', label: 'By Stage' },
      { id: 'pipeline-by-owner', label: 'By Owner' },
      { id: 'pipeline-velocity', label: 'Velocity Metrics' },
    ],
  },
  {
    id: 'customer-health',
    label: 'Customer Health',
    isExpanded: false,
    children: [
      {
        id: 'health-risk-scores',
        label: 'Risk Scores',
        children: [
          { id: 'health-risk-high', label: 'High Risk' },
          { id: 'health-risk-medium', label: 'Medium Risk' },
        ],
      },
      { id: 'health-nps-trends', label: 'NPS Trends' },
    ],
  },
];

// ============================================================================
// Sub-components
// ============================================================================

/** Count total items in a subtable hierarchy */
const countSubtableItems = (items: SubtableItem[]): number => {
  return items.reduce((count, item) => {
    return count + 1 + (item.children ? countSubtableItems(item.children) : 0);
  }, 0);
};

// Context menu items for subtables
const getSubtableContextMenuItems = (): ContextMenuItem[] => [
  { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
  { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' },
];

interface SubtableRowProps {
  item: SubtableItem;
  level: number;
  isSelected?: boolean;
  isEditing?: boolean;
  isMenuOpen?: boolean;
  onClick: () => void;
  onToggle: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onSaveEdit?: (newName: string) => void;
  onCancelEdit?: () => void;
}

const SubtableRow: React.FC<SubtableRowProps> = ({
  item,
  level,
  isSelected = false,
  isEditing = false,
  isMenuOpen = false,
  onClick,
  onToggle,
  onContextMenu,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [editValue, setEditValue] = useState(item.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasChildren = item.children && item.children.length > 0;
  const showButton = (isHovered || isMenuOpen) && !isEditing;

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when item label changes or editing starts
  useEffect(() => {
    setEditValue(item.label);
  }, [item.label, isEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== item.label) {
      onSaveEdit?.(trimmedValue);
    } else {
      onCancelEdit?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit?.();
    }
  };

  const childCount = item.children ? countSubtableItems(item.children) : 0;

  return (
    <div
      className={`
        group relative flex items-center gap-2 px-2 py-1 rounded-lg text-[13px]
        transition-colors duration-150
        ${!hasChildren ? 'pl-6' : ''}
        ${isEditing ? 'bg-gray-50' : isSelected ? 'bg-gray-50 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}
      `}
      onClick={isEditing ? undefined : onClick}
      onContextMenu={isEditing ? undefined : onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isEditing ? undefined : item.label}
    >
      {/* Expand/Collapse Caret for parent items (only show if has children) */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex-shrink-0 p-0.5 hover:bg-gray-100 rounded transition-colors"
        >
          {item.isExpanded ? (
            <CaretDownIcon size={12} weight="duotone" className="text-gray-800" />
          ) : (
            <CaretRightIcon size={12} weight="duotone" className="text-gray-800" />
          )}
        </button>
      )}

      {/* Branch icon for subtables (not for top-level parent tables) */}
      {level > 0 && (
        <TreeStructureIcon size={16} weight="regular" className="text-gray-600 flex-shrink-0" />
      )}

      {/* Table icon for top-level parent tables */}
      {level === 0 && (
        <Table size={16} weight="regular" className="text-gray-700 flex-shrink-0" />
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="flex-1 text-[13px] text-gray-900 bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="flex-1 text-[13px] truncate text-gray-900">
            {item.label}
          </span>

          {/* Child count badge */}
          {hasChildren && (
            <span className="text-[11px] font-mono text-gray-500">
              [{childCount}]
            </span>
          )}

          {/* More options button - shows on hover or when menu is open */}
          <PrimaryIconButton
            icon={<DotsThreeIcon size={16} weight="bold" />}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => onContextMenu(e)}
            visible={showButton}
            size="small"
            className="absolute right-1"
          />
        </>
      )}
    </div>
  );
};

interface SubtableSectionProps {
  items: SubtableItem[];
  level?: number;
  selectedId?: string | null;
  editingId?: string | null;
  menuOpenId?: string | null;
  expandedIds: Set<string>;
  onItemClick: (id: string) => void;
  onToggle: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, item: SubtableItem) => void;
  onSaveEdit: (item: SubtableItem, newName: string) => void;
  onCancelEdit: () => void;
}

const SubtableSection: React.FC<SubtableSectionProps> = ({
  items,
  level = 0,
  selectedId,
  editingId,
  menuOpenId,
  expandedIds,
  onItemClick,
  onToggle,
  onContextMenu,
  onSaveEdit,
  onCancelEdit,
}) => {
  return (
    <div className={level > 0 ? 'pl-2 border-l border-gray-200 ml-4' : ''}>
      {items.map((item) => {
        const isExpanded = expandedIds.has(item.id);
        const hasChildren = item.children && item.children.length > 0;

        return (
          <div key={item.id} className="mb-0.5">
            <SubtableRow
              item={{ ...item, isExpanded }}
              level={level}
              isSelected={selectedId === item.id}
              isEditing={editingId === item.id}
              isMenuOpen={menuOpenId === item.id}
              onClick={() => onItemClick(item.id)}
              onToggle={() => onToggle(item.id)}
              onContextMenu={(e) => onContextMenu(e, item)}
              onSaveEdit={(newName) => onSaveEdit(item, newName)}
              onCancelEdit={onCancelEdit}
            />

            {/* Render children if expanded */}
            <AnimatePresence>
              {hasChildren && isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <SubtableSection
                    items={item.children!}
                    level={level + 1}
                    selectedId={selectedId}
                    editingId={editingId}
                    menuOpenId={menuOpenId}
                    expandedIds={expandedIds}
                    onItemClick={onItemClick}
                    onToggle={onToggle}
                    onContextMenu={onContextMenu}
                    onSaveEdit={onSaveEdit}
                    onCancelEdit={onCancelEdit}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Pane1 - Dashboard Builder Side Panel
 *
 * A side panel with toggle between Dashboard (components) and Data (sources) views.
 * Used for dragging chart components onto a dashboard canvas.
 * When a component is clicked, shows a configuration form.
 */
export const Pane1: React.FC<Pane1Props> = ({
  chartComponents = defaultChartComponents,
  dataSources = defaultDataSources,
  subtables = defaultSubtables,
  searchPlaceholder,
  onDragStart,
  onComponentClick,
  onSubtableClick,
  onSubtableToggle,
  onSubtableRename,
  onSubtableDelete,
  defaultTab = 'dashboard',
  onSaveConfig,
  onDiscardConfig,
  selectedComponent: controlledSelectedComponent,
  onSelectedComponentChange,
  onCreateReport,
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'dashboard'>(defaultTab);
  const [searchValue, setSearchValue] = useState('');

  // New Report Modal state
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);

  // Subtables section expansion state
  const [isSubtablesExpanded, setIsSubtablesExpanded] = useState(true);

  // Subtables state management
  const [selectedSubtableId, setSelectedSubtableId] = useState<string | null>(null);
  const [editingSubtableId, setEditingSubtableId] = useState<string | null>(null);
  const [expandedSubtableIds, setExpandedSubtableIds] = useState<Set<string>>(() => {
    // Initialize with items that have isExpanded: true
    const initialExpanded = new Set<string>();
    const collectExpanded = (items: SubtableItem[]) => {
      items.forEach((item) => {
        if (item.isExpanded) {
          initialExpanded.add(item.id);
        }
        if (item.children) {
          collectExpanded(item.children);
        }
      });
    };
    collectExpanded(subtables);
    return initialExpanded;
  });

  // Context menu state for subtables
  const [subtableContextMenu, setSubtableContextMenu] = useState<{
    isOpen: boolean;
    position: { top: number; left: number };
    item: SubtableItem | null;
  }>({ isOpen: false, position: { top: 0, left: 0 }, item: null });

  // Delete confirmation state for reports
  const [reportDeleteConfirmation, setReportDeleteConfirmation] = useState<{
    isOpen: boolean;
    item: SubtableItem | null;
  }>({ isOpen: false, item: null });

  // Internal state for selected component (uncontrolled mode)
  const [internalSelectedComponent, setInternalSelectedComponent] = useState<ChartComponent | null>(null);

  // Use controlled or uncontrolled state
  const selectedComponent = controlledSelectedComponent !== undefined
    ? controlledSelectedComponent
    : internalSelectedComponent;

  const setSelectedComponent = (component: ChartComponent | null) => {
    if (onSelectedComponentChange) {
      onSelectedComponentChange(component);
    } else {
      setInternalSelectedComponent(component);
    }
  };

  // Form state for component configuration
  const [configTitle, setConfigTitle] = useState('');
  const [configReportId, setConfigReportId] = useState('');
  const [configFilters, setConfigFilters] = useState<Array<{
    id: string;
    field: string;
    operator: string;
    value: string;
  }>>([]);

  // Get fields for the selected report
  const selectedReport = dataSources.find((d) => d.id === configReportId);
  const availableFields = selectedReport?.fields || defaultFields;

  // Report options for the dropdown
  const reportOptions = dataSources.map((d) => ({
    value: d.id,
    label: d.label,
  }));

  const handleComponentSelect = (component: ChartComponent) => {
    setSelectedComponent(component);
    setConfigTitle(component.label);
    setConfigReportId('');
    setConfigFilters([]);
    onComponentClick?.(component);
  };

  const handleAddFilter = () => {
    setConfigFilters([
      ...configFilters,
      { id: crypto.randomUUID(), field: '', operator: '', value: '' },
    ]);
  };

  const handleUpdateFilter = (
    id: string,
    updates: Partial<{ field: string; operator: string; value: string }>
  ) => {
    setConfigFilters(
      configFilters.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleRemoveFilter = (id: string) => {
    setConfigFilters(configFilters.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    if (selectedComponent) {
      onSaveConfig?.({
        componentType: selectedComponent,
        title: configTitle,
        reportId: configReportId,
        filters: configFilters,
      });
    }
    handleDiscard();
  };

  const handleDiscard = () => {
    setSelectedComponent(null);
    setConfigTitle('');
    setConfigReportId('');
    setConfigFilters([]);
    onDiscardConfig?.();
  };

  // If a component is selected, show the configuration form
  if (selectedComponent) {
    const IconComponent = iconMap[selectedComponent.icon];

    return (
      <div className="px-2 py-3 h-full w-full bg-white flex text-[13px] flex-col overflow-hidden antialiased font-sf rounded-xl border border-gray-100 shadow-xs">
        {/* Header with Back Button */}
        <div className="px-1 pb-3 mb-3 border-b border-gray-100">
          <div className="flex justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconComponent size={18} weight="regular" className="text-gray-700" />
              <span className="font-medium text-gray-900">{configTitle || selectedComponent.label}</span>
            </div>
            <TertiaryIconButton
              icon={<ArrowLeft size={16} weight="bold" />}
              onClick={handleDiscard}
              title="Go back"
            />
          </div>
        </div>

        {/* Configuration Form */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 space-y-4">

           {/* Title Input */}
          <TextInput
            label="Title"
            value={configTitle}
            onChange={(e) => setConfigTitle(e.target.value)}
            placeholder="Enter chart title..."
          />

          {/* Report Selection */}
          <Select
            label="Source Report"
            options={reportOptions}
            value={configReportId}
            onChange={(value) => setConfigReportId(value)}
            placeholder="Select a report..."
          />

          {/* Filters Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Filters</span>
              <AddButton onClick={handleAddFilter}>
                Add Filter
              </AddButton>
            </div>

            {configFilters.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-[13px] text-gray-500">No filters added</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Click "Add Filter" to add a filter condition</p>
              </div>
            ) : (
              <div className="space-y-2">
                {configFilters.map((filter) => (
                  <FilterRow
                    key={filter.id}
                    fields={availableFields}
                    field={filter.field}
                    operator={filter.operator}
                    value={filter.value}
                    onFieldChange={(field) => handleUpdateFilter(filter.id, { field })}
                    onOperatorChange={(operator) => handleUpdateFilter(filter.id, { operator })}
                    onValueChange={(value) => handleUpdateFilter(filter.id, { value })}
                    onRemove={() => handleRemoveFilter(filter.id)}
                    showRemove={configFilters.length > 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer with Discard/Save Buttons */}
        <div className="pt-3 mt-3 border-t border-gray-100 px-1">
          <div className="flex items-center gap-2">
            <GhostButton onClick={handleDiscard} fullWidth>
              Discard
            </GhostButton>
            <PrimaryButton onClick={handleSave} fullWidth>
              Save
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-3 h-full w-full bg-white flex text-[13px] rounded-xl border border-gray-100 shadow-xs flex-col overflow-hidden antialiased font-sf">
      {/* Header with Toggle */}
      <div className="px-1 mb-4">
        <Toggle
          options={[
            { value: 'data', label: 'Data' },
            { value: 'dashboard', label: 'Dashboard' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Search - Only show on Data tab */}
      {activeTab === 'data' && (
        <div className="px-1 mb-2">
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white rounded-lg border border-gray-100 focus-within:border-gray-200 focus-within:ring-1 focus-within:ring-gray-100 transition-colors">
            <MagnifyingGlass size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder || 'Search reports...'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-[13px] text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1">
        {activeTab === 'dashboard' ? (
          <>
            {/* Components Section */}
            <div className="mb-1">
              <div className="px-2 py-1.5">
                <span className="text-xs font-medium text-gray-700">
                  Drag and drop component
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2.5 pr-2">
                {chartComponents.map((component) => {
                  const IconComponent = iconMap[component.icon];
                  return (
                    <div
                      key={component.id}
                      draggable
                      onDragStart={() => onDragStart?.(component)}
                      onClick={() => handleComponentSelect(component)}
                      className="flex flex-row items-center justify-center gap-1.5 px-3 py-3 bg-white rounded-xl border border-gray-100 cursor-grab hover:border-gray-200 hover:border-dashed hover:shadow-lg hover:shadow-gray-100 transition-all duration-200 active:scale-[0.98]"
                    >
                      <div className="p-2 bg-gray-50 rounded-lg">
                      <IconComponent size={18} weight="regular" className="text-gray-800" />
                      </div>
                      <span className="text-[13px] text-gray-900 pl-1 leading-[15px]">{component.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Data View - Reports */
          <>
            {/* New Report Button */}
            <div className="mb-3 px-1">
              <SecondaryButton onClick={() => setIsNewReportModalOpen(true)} fullWidth>
                New Report
              </SecondaryButton>
            </div>

            {/* Reports Section */}
            <div className="mb-1">
              <div className="flex items-center justify-between px-2 py-1.5">
                <button
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-800 transition-colors cursor-pointer"
                  onClick={() => setIsSubtablesExpanded(!isSubtablesExpanded)}
                >
                  <span>Reports</span>
                  <span className="text-[11px] font-mono text-gray-500">
                    [{countSubtableItems(subtables)}]
                  </span>
                  {isSubtablesExpanded ? (
                    <CaretDownIcon size={12} weight="duotone" className="text-gray-800" />
                  ) : (
                    <CaretRightIcon size={12} weight="duotone" className="text-gray-800" />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {isSubtablesExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <SubtableSection
                      items={subtables}
                      level={0}
                      selectedId={selectedSubtableId}
                      editingId={editingSubtableId}
                      menuOpenId={subtableContextMenu.isOpen ? subtableContextMenu.item?.id : null}
                      expandedIds={expandedSubtableIds}
                      onItemClick={(id) => {
                        setSelectedSubtableId(id);
                        onSubtableClick?.(id);
                      }}
                      onToggle={(id) => {
                        setExpandedSubtableIds((prev) => {
                          const next = new Set(prev);
                          const isExpanded = next.has(id);
                          if (isExpanded) {
                            next.delete(id);
                          } else {
                            next.add(id);
                          }
                          onSubtableToggle?.(id, !isExpanded);
                          return next;
                        });
                      }}
                      onContextMenu={(e, item) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSubtableContextMenu({
                          isOpen: true,
                          position: { top: e.clientY, left: e.clientX + 8 },
                          item,
                        });
                      }}
                      onSaveEdit={(item, newName) => {
                        onSubtableRename?.(item.id, newName);
                        setEditingSubtableId(null);
                      }}
                      onCancelEdit={() => setEditingSubtableId(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Context Menu for Reports */}
            <ContextMenu
              isOpen={subtableContextMenu.isOpen}
              onClose={() => setSubtableContextMenu({ ...subtableContextMenu, isOpen: false })}
              items={getSubtableContextMenuItems()}
              fixedPosition={subtableContextMenu.position}
              width={128}
              onItemClick={(item) => {
                if (item.id === 'rename' && subtableContextMenu.item) {
                  setEditingSubtableId(subtableContextMenu.item.id);
                } else if (item.id === 'delete' && subtableContextMenu.item) {
                  setReportDeleteConfirmation({ isOpen: true, item: subtableContextMenu.item });
                }
                setSubtableContextMenu({ ...subtableContextMenu, isOpen: false });
              }}
            />

            {/* Delete Confirmation Popup for Reports */}
            <DeleteConfirmationPopup
              isOpen={reportDeleteConfirmation.isOpen}
              itemLabel={reportDeleteConfirmation.item?.label || ''}
              itemType="report"
              onConfirm={() => {
                if (reportDeleteConfirmation.item) {
                  onSubtableDelete?.(reportDeleteConfirmation.item.id);
                }
                setReportDeleteConfirmation({ isOpen: false, item: null });
              }}
              onCancel={() => setReportDeleteConfirmation({ isOpen: false, item: null })}
            />

            {/* New Report Modal */}
            <NewReportModal
              isOpen={isNewReportModalOpen}
              onConfirm={(config) => {
                onCreateReport?.(config);
                setIsNewReportModalOpen(false);
              }}
              onCancel={() => setIsNewReportModalOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Pane1;
