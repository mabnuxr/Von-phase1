import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  ChartLineIcon,
  ChartPieIcon,
  ChartDonutIcon,
  HashIcon,
  TableIcon,
  XIcon,
  DatabaseIcon,
  LinkIcon,
  CaretDownIcon,
  FunnelIcon,
} from '@phosphor-icons/react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { PrimaryButton, GhostButton, TertiaryIconButton, AddButton } from '../forms/buttons';
import { FilterRow } from '../forms/filter';

// ============================================================================
// Types
// ============================================================================

export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';

export interface DataSourceOption {
  id: string;
  name: string;
  type: 'report' | 'subreport';
  columnCount?: number;
  /** Sample data for preview */
  sampleData?: {
    columns: { id: string; label: string; type?: 'string' | 'number' | 'currency' | 'date' }[];
    rows: Record<string, unknown>[];
  };
  /** Chart data for preview */
  chartData?: unknown;
}

export interface WidgetFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface WidgetConfigData {
  id: string;
  name: string;
  chartType: ChartType;
  dataSourceId: string;
  dataSourceType: 'report' | 'subreport';
  filters?: WidgetFilter[];
  gridPosition?: { x: number; y: number };
  gridSize?: { width: number; height: number };
}

export interface WidgetEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WidgetConfigData) => void;
  existingConfig?: Partial<WidgetConfigData>;
  dataSources?: DataSourceOption[];
  widgetId?: string;
  mode?: 'create' | 'edit';
  /** Available fields for filtering */
  availableFilterFields?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const chartOptions: { value: ChartType; label: string; icon: React.ReactNode }[] = [
  { value: 'bar', label: 'Bar Chart', icon: <ChartBarIcon size={16} /> },
  { value: 'line', label: 'Line Chart', icon: <ChartLineIcon size={16} /> },
  { value: 'pie', label: 'Pie Chart', icon: <ChartPieIcon size={16} /> },
  { value: 'donut', label: 'Donut Chart', icon: <ChartDonutIcon size={16} /> },
  { value: 'metric', label: 'Metric Card', icon: <HashIcon size={16} /> },
  { value: 'table', label: 'Data Table', icon: <TableIcon size={16} /> },
];

const defaultDataSources: DataSourceOption[] = [
  {
    id: 'ds-1',
    name: 'Opportunity Report',
    type: 'report',
    columnCount: 12,
    sampleData: {
      columns: [
        { id: 'name', label: 'Deal Name', type: 'string' },
        { id: 'account', label: 'Account', type: 'string' },
        { id: 'amount', label: 'Amount', type: 'currency' },
        { id: 'stage', label: 'Stage', type: 'string' },
        { id: 'closeDate', label: 'Close Date', type: 'date' },
      ],
      rows: [
        {
          name: 'Enterprise Deal',
          account: 'Acme Corp',
          amount: 150000,
          stage: 'Negotiation',
          closeDate: '2026-02-15',
        },
        {
          name: 'Mid-Market Expansion',
          account: 'TechStart Inc',
          amount: 75000,
          stage: 'Proposal',
          closeDate: '2026-01-30',
        },
        {
          name: 'SMB Upsell',
          account: 'Local Biz',
          amount: 25000,
          stage: 'Discovery',
          closeDate: '2026-03-01',
        },
        {
          name: 'Strategic Partnership',
          account: 'Global Corp',
          amount: 500000,
          stage: 'Closed Won',
          closeDate: '2026-01-10',
        },
        {
          name: 'Renewal Deal',
          account: 'Existing Co',
          amount: 45000,
          stage: 'Closed Won',
          closeDate: '2026-02-28',
        },
      ],
    },
    chartData: {
      categories: ['Discovery', 'Proposal', 'Negotiation', 'Closed Won'],
      series: [{ name: 'Value', data: [25, 75, 150, 545] }],
    },
  },
  {
    id: 'ds-2',
    name: 'Pipeline by Stage',
    type: 'subreport',
    columnCount: 5,
    sampleData: {
      columns: [
        { id: 'stage', label: 'Stage', type: 'string' },
        { id: 'count', label: 'Count', type: 'number' },
        { id: 'value', label: 'Value', type: 'currency' },
      ],
      rows: [
        { stage: 'Discovery', count: 15, value: 450000 },
        { stage: 'Proposal', count: 8, value: 320000 },
        { stage: 'Negotiation', count: 5, value: 750000 },
        { stage: 'Closed Won', count: 12, value: 1200000 },
      ],
    },
    chartData: {
      categories: ['Discovery', 'Proposal', 'Negotiation', 'Closed Won'],
      series: [{ name: 'Value', data: [450, 320, 750, 1200] }],
    },
  },
];

// ============================================================================
// Preview Toggle Component
// ============================================================================

interface PreviewToggleProps {
  mode: 'table' | 'chart';
  chartType: ChartType;
  onChange: (mode: 'table' | 'chart') => void;
}

const PreviewToggle: React.FC<PreviewToggleProps> = ({ mode, chartType, onChange }) => {
  const chartIcon = useMemo(() => {
    switch (chartType) {
      case 'bar':
        return <ChartBarIcon size={16} />;
      case 'line':
        return <ChartLineIcon size={16} />;
      case 'pie':
        return <ChartPieIcon size={16} />;
      case 'donut':
        return <ChartDonutIcon size={16} />;
      default:
        return <ChartBarIcon size={16} />;
    }
  }, [chartType]);

  return (
    <div className="flex gap-1">
      <button
        onClick={() => onChange('table')}
        className={`
          flex items-center justify-center w-8 h-8 rounded-lg border transition-colors cursor-pointer
          ${mode === 'table' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
        `}
        title="View as table"
      >
        <TableIcon size={16} />
      </button>
      <button
        onClick={() => onChange('chart')}
        className={`
          flex items-center justify-center w-8 h-8 rounded-lg border transition-colors cursor-pointer
          ${mode === 'chart' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
        `}
        title="View as chart"
      >
        {chartIcon}
      </button>
    </div>
  );
};

// ============================================================================
// Data Table Preview Component
// ============================================================================

interface DataTablePreviewProps {
  columns: { id: string; label: string; type?: string }[];
  rows: Record<string, unknown>[];
}

const DataTablePreview: React.FC<DataTablePreviewProps> = ({ columns, rows }) => {
  const formatValue = (value: unknown, type?: string): string => {
    if (value === null || value === undefined) return '—';
    if (type === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    if (type === 'date' && typeof value === 'string') {
      return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (type === 'number' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    return String(value);
  };

  return (
    <div className="overflow-auto h-full bg-white">
      <table className="w-full text-[13px]">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={`px-4 py-2.5 text-gray-900 whitespace-nowrap ${
                    col.type === 'currency' || col.type === 'number' ? 'tabular-nums' : ''
                  }`}
                >
                  {formatValue(row[col.id], col.type)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// Chart Preview Component
// ============================================================================

interface ChartPreviewProps {
  chartType: ChartType;
  chartData: unknown;
}

const ChartPreview: React.FC<ChartPreviewProps> = ({ chartType, chartData }) => {
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

    if (chartType === 'bar' || chartType === 'line') {
      const data = chartData as {
        categories: string[];
        series: { name: string; data: number[] }[];
      };
      return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: chartType === 'bar' ? 'column' : 'line' },
        xAxis: {
          categories: data?.categories || [],
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
          column: { borderRadius: 4, borderWidth: 0 },
          line: { marker: { radius: 4 } },
        },
        colors: ['#4f46e5', '#818cf8'],
        series: (data?.series || []) as Highcharts.SeriesOptionsType[],
      };
    }

    if (chartType === 'pie' || chartType === 'donut') {
      const data = chartData as {
        categories: string[];
        series: { name: string; data: number[] }[];
      };
      const pieData = (data?.categories || []).map((name, i) => ({
        name,
        y: data?.series?.[0]?.data?.[i] || 0,
      }));
      return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'pie' },
        plotOptions: {
          pie: {
            innerSize: chartType === 'donut' ? '50%' : '0%',
            borderWidth: 0,
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.percentage:.0f}%',
              style: { fontSize: '10px', fontWeight: '400', color: '#374151' },
            },
          },
        },
        colors: ['#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe'],
        series: [{ type: 'pie', name: 'Distribution', data: pieData }],
      };
    }

    return baseOptions;
  }, [chartType, chartData]);

  if (chartType === 'metric' || chartType === 'table') {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-[13px] bg-white">
        Chart preview not available for this type
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
        containerProps={{ style: { height: '100%', width: '100%' } }}
      />
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const WidgetEditSheet: React.FC<WidgetEditSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  existingConfig,
  dataSources = defaultDataSources,
  widgetId,
  mode = 'edit',
  availableFilterFields = [],
}) => {
  const [name, setName] = useState(existingConfig?.name || '');
  const [chartType, setChartType] = useState<ChartType>(existingConfig?.chartType || 'bar');
  const [dataSourceId, setDataSourceId] = useState(existingConfig?.dataSourceId || '');
  const [filters, setFilters] = useState<WidgetFilter[]>(existingConfig?.filters || []);
  const [errors, setErrors] = useState<{ name?: string; dataSource?: string }>({});
  const [previewMode, setPreviewMode] = useState<'table' | 'chart'>('chart');
  const [showFilters, setShowFilters] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(existingConfig?.name || '');
      setChartType(existingConfig?.chartType || 'bar');
      setDataSourceId(existingConfig?.dataSourceId || '');
      setFilters(existingConfig?.filters || []);
      setErrors({});
      setPreviewMode('chart');
      setShowFilters(false);
    }
  }, [isOpen, existingConfig]);

  const selectedDataSource = dataSources.find((ds) => ds.id === dataSourceId);

  // Derive field options from selected data source or provided fields
  const fieldOptions = useMemo(() => {
    if (availableFilterFields.length > 0) {
      return availableFilterFields.map((f) => ({ value: f, label: f }));
    }
    if (selectedDataSource?.sampleData?.columns) {
      return selectedDataSource.sampleData.columns.map((c) => ({ value: c.label, label: c.label }));
    }
    return [];
  }, [availableFilterFields, selectedDataSource]);

  // Filter management
  const handleAddFilter = () => {
    const newFilter: WidgetFilter = {
      id: `filter-${Date.now()}`,
      field: fieldOptions[0]?.value || '',
      operator: 'equals',
      value: '',
    };
    setFilters([...filters, newFilter]);
  };

  const handleUpdateFilter = (id: string, updates: Partial<WidgetFilter>) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleRemoveFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    const newErrors: { name?: string; dataSource?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Widget name is required';
    }

    if (!dataSourceId) {
      newErrors.dataSource = 'Please select a data source';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onSave({
      id: widgetId || `widget-${Date.now()}`,
      name: name.trim(),
      chartType,
      dataSourceId,
      dataSourceType: selectedDataSource?.type || 'report',
      filters,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 h-[90%] bg-white rounded-t-2xl shadow-xl border-t border-gray-200 flex flex-col z-50"
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">
                  {mode === 'create' ? 'Add Widget' : 'Edit Widget'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure widget settings and preview the result
                </p>
              </div>
              <TertiaryIconButton icon={<XIcon size={18} />} onClick={onClose} title="Close" />
            </div>

            {/* Content - Split View */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Form (30%) */}
              <div className="w-[30%] border-r border-gray-100 overflow-y-auto flex flex-col">
                <div className="p-4 space-y-4 flex-1">
                  {/* Widget Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="Enter widget name..."
                      className={`
                        w-full px-3 py-2 text-[13px] text-gray-900 bg-white border rounded-lg
                        placeholder:text-gray-400 outline-none transition-colors
                        ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}
                      `}
                    />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  {/* Data Source */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Data Source
                    </label>
                    <div className="relative">
                      <select
                        value={dataSourceId}
                        onChange={(e) => {
                          setDataSourceId(e.target.value);
                          if (errors.dataSource)
                            setErrors((prev) => ({ ...prev, dataSource: undefined }));
                        }}
                        className={`
                          w-full px-3 py-2 text-[13px] text-gray-900 bg-white border rounded-lg
                          appearance-none cursor-pointer outline-none transition-colors
                          ${errors.dataSource ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}
                        `}
                      >
                        <option value="">Select a data source...</option>
                        {dataSources.map((ds) => (
                          <option key={ds.id} value={ds.id}>
                            {ds.name}
                          </option>
                        ))}
                      </select>
                      <CaretDownIcon
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                    {errors.dataSource && (
                      <p className="text-xs text-red-600 mt-1">{errors.dataSource}</p>
                    )}
                    {selectedDataSource && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        {selectedDataSource.type === 'subreport' ? (
                          <LinkIcon size={12} />
                        ) : (
                          <DatabaseIcon size={12} />
                        )}
                        <span>{selectedDataSource.columnCount} columns available</span>
                      </div>
                    )}
                  </div>

                  {/* Filters Section */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-700">Filters</label>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`
                          flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors cursor-pointer
                          ${showFilters || filters.length > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}
                        `}
                      >
                        <FunnelIcon size={12} />
                        {filters.length > 0 && <span>{filters.length}</span>}
                      </button>
                    </div>
                    <AnimatePresence>
                      {showFilters && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 mt-2">
                            {filters.length === 0 ? (
                              <p className="text-xs text-gray-500 text-center py-2">
                                No filters applied
                              </p>
                            ) : (
                              filters.map((filter) => (
                                <FilterRow
                                  key={filter.id}
                                  fields={fieldOptions}
                                  field={filter.field}
                                  operator={filter.operator}
                                  value={filter.value}
                                  onFieldChange={(field) =>
                                    handleUpdateFilter(filter.id, { field })
                                  }
                                  onOperatorChange={(operator) =>
                                    handleUpdateFilter(filter.id, { operator })
                                  }
                                  onValueChange={(value) =>
                                    handleUpdateFilter(filter.id, { value })
                                  }
                                  onRemove={() => handleRemoveFilter(filter.id)}
                                  usePortal
                                />
                              ))
                            )}
                            <AddButton onClick={handleAddFilter}>Add Filter</AddButton>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Chart Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Visualization Type
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {chartOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setChartType(option.value)}
                          className={`
                            flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-all cursor-pointer
                            ${
                              chartType === option.value
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                            }
                          `}
                        >
                          <span
                            className={
                              chartType === option.value ? 'text-indigo-600' : 'text-gray-500'
                            }
                          >
                            {option.icon}
                          </span>
                          <span className="text-[10px] font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer - Buttons in left panel */}
                <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 flex-shrink-0">
                  <GhostButton onClick={onClose} className="flex-1">
                    Cancel
                  </GhostButton>
                  <PrimaryButton onClick={handleSave} className="flex-1">
                    {mode === 'create' ? 'Add Widget' : 'Save Changes'}
                  </PrimaryButton>
                </div>
              </div>

              {/* Right Panel - Preview (70%) */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Preview Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                  <span className="text-[13px] font-medium text-gray-900">
                    {name || 'Widget Preview'}
                  </span>
                  {selectedDataSource && chartType !== 'table' && chartType !== 'metric' && (
                    <PreviewToggle
                      mode={previewMode}
                      chartType={chartType}
                      onChange={setPreviewMode}
                    />
                  )}
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-hidden">
                  {!selectedDataSource ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-[13px] bg-white">
                      Select a data source to preview
                    </div>
                  ) : previewMode === 'table' || chartType === 'table' ? (
                    <DataTablePreview
                      columns={selectedDataSource.sampleData?.columns || []}
                      rows={selectedDataSource.sampleData?.rows || []}
                    />
                  ) : (
                    <ChartPreview chartType={chartType} chartData={selectedDataSource.chartData} />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WidgetEditSheet;
