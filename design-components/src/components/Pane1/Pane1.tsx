import { useState } from 'react';
import {
  Database,
  ChartBar,
  ChartLine,
  ChartPie,
  ChartDonut,
  Hash,
  Table,
  MagnifyingGlass,
  CaretRight,
} from '@phosphor-icons/react';

export interface ChartComponent {
  id: string;
  label: string;
  icon: 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';
}

export interface TableItem {
  id: string;
  label: string;
  columnCount?: number;
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
   * Called when a data source is clicked
   */
  onDataSourceClick?: (id: string) => void;

  /**
   * Initial active tab
   * @default 'dashboard'
   */
  defaultTab?: 'data' | 'dashboard';
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
  { id: 'donut', label: 'Donut', icon: 'donut' },
  { id: 'metric', label: 'Metric', icon: 'metric' },
  { id: 'table', label: 'Table', icon: 'table' },
];

const defaultDataSources: TableItem[] = [
  { id: '1', label: 'Accounts at Risk', columnCount: 8 },
  { id: '2', label: 'Engagement Timeline', columnCount: 6 },
  { id: '3', label: 'Risk by Region', columnCount: 3 },
  { id: '4', label: 'ARR at Risk by Industry', columnCount: 7 },
  { id: '5', label: 'Churn Probability Distribution', columnCount: 5 },
  { id: '6', label: 'Support Ticket Trends', columnCount: 4 },
];

/**
 * Pane1 - Dashboard Builder Side Panel
 *
 * A side panel with toggle between Dashboard (components) and Data (sources) views.
 * Used for dragging chart components onto a dashboard canvas.
 */
export const Pane1: React.FC<Pane1Props> = ({
  chartComponents = defaultChartComponents,
  dataSources = defaultDataSources,
  searchPlaceholder,
  onDragStart,
  onDataSourceClick,
  defaultTab = 'dashboard',
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'dashboard'>(defaultTab);
  const [searchValue, setSearchValue] = useState('');

  const filteredDataSources = dataSources.filter((d) =>
    d.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-white rounded-xl flex flex-col overflow-hidden antialiased font-sf text-sm">
      {/* Header with Toggle */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Database size={18} weight="duotone" className="text-gray-500" />
          <span className="font-semibold text-gray-900">
            {activeTab === 'dashboard' ? 'Components' : 'Data Sources'}
          </span>
        </div>

        {/* Toggle Pills */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'data'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('data')}
          >
            Data
          </button>
          <button
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Search - Only show on Data tab */}
      {activeTab === 'data' && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <MagnifyingGlass size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder || 'Search tables...'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {activeTab === 'dashboard' ? (
          <>
            {/* Drag to Add Section */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Drag to Add
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {chartComponents.map((component) => {
                  const IconComponent = iconMap[component.icon];
                  return (
                    <div
                      key={component.id}
                      draggable
                      onDragStart={() => onDragStart?.(component)}
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm cursor-grab hover:shadow-md hover:border-gray-300 hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                    >
                      <IconComponent size={24} weight="light" className="text-gray-500" />
                      <span className="text-xs text-gray-600 text-center font-medium">{component.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </>
        ) : (
          /* Data Sources View */
          <div className="flex flex-col gap-1">
            {filteredDataSources.map((source) => (
              <button
                key={source.id}
                onClick={() => onDataSourceClick?.(source.id)}
                className="flex items-center gap-2 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left group"
              >
                <CaretRight size={14} weight="bold" className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                <Table size={16} weight="regular" className="text-gray-400" />
                <span className="flex-1 text-sm text-gray-700 truncate">{source.label}</span>
                {source.columnCount && (
                  <span className="text-xs text-gray-400">{source.columnCount}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pane1;
