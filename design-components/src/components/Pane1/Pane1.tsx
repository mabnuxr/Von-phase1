import { useState } from 'react';
import {
  ChartBar,
  ChartLine,
  ChartPie,
  ChartDonut,
  Hash,
  Table,
  MagnifyingGlass,
  ArrowLeft,
} from '@phosphor-icons/react';
import { TextInput } from '../forms/input';
import { Select } from '../forms/dropdown';
import { FilterRow } from '../forms/filter';
import { Toggle } from '../forms/toggle';
import { AddButton, PrimaryButton, GhostButton, TertiaryIconButton } from '../forms/buttons';

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
   * Called when a data source is clicked
   */
  onDataSourceClick?: (id: string) => void;

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
  searchPlaceholder,
  onDragStart,
  onComponentClick,
  onDataSourceClick,
  defaultTab = 'dashboard',
  onSaveConfig,
  onDiscardConfig,
  selectedComponent: controlledSelectedComponent,
  onSelectedComponentChange,
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'dashboard'>(defaultTab);
  const [searchValue, setSearchValue] = useState('');

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

  const filteredDataSources = dataSources.filter((d) =>
    d.label.toLowerCase().includes(searchValue.toLowerCase())
  );

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
                {configFilters.map((filter, index) => (
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
                      className="flex flex-row items-center justify-center gap-1.5 px-3 py-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-gray-200 hover:border-dashed hover:shadow-lg hover:shadow-gray-100 transition-all duration-200 active:scale-[0.98]"
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
          /* Reports View */
          <div className="mb-1">
            <div className="px-2 py-1.5">
              <span className="text-xs font-medium text-gray-700">
                Reports
              </span>
            </div>

            <div className="flex flex-col">
              {filteredDataSources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => onDataSourceClick?.(source.id)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors duration-150 cursor-pointer text-left"
                >
                  <Table size={16} weight="regular" className="text-gray-700 flex-shrink-0" />
                  <span className="flex-1 text-[13px] text-gray-900 truncate">{source.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pane1;
