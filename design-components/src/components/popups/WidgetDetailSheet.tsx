import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  XIcon,
  ArrowsOutIcon,
  FunnelIcon,
  CaretDownIcon,
  SparkleIcon,
} from '@phosphor-icons/react';
import { Select } from '../forms/dropdown';

// ============================================================================
// Types
// ============================================================================

export interface WidgetDetailData {
  id: string;
  name: string;
  chartType: 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';
  dataSourceName: string;
  dataSourceType: 'report' | 'subreport';
}

export interface DrillDownFilter {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface SourceDataColumn {
  id: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  isAI?: boolean;
}

export interface SourceDataRow {
  id: string;
  [key: string]: unknown;
}

export interface WidgetDetailSheetProps {
  /**
   * Whether the sheet is open
   */
  isOpen: boolean;

  /**
   * Widget data to display
   */
  widget: WidgetDetailData | null;

  /**
   * Available drill-down filters (region, owner, etc.)
   */
  drillDownFilters?: DrillDownFilter[];

  /**
   * Current drill-down filter values
   */
  filterValues?: Record<string, string>;

  /**
   * Callback when drill-down filter changes
   */
  onFilterChange?: (filterId: string, value: string) => void;

  /**
   * Source data columns
   */
  sourceColumns?: SourceDataColumn[];

  /**
   * Source data rows
   */
  sourceData?: SourceDataRow[];

  /**
   * Callback when user closes the sheet
   */
  onClose: () => void;

  /**
   * Callback when user wants to expand to full screen
   */
  onExpand?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

// ============================================================================
// Sub-components
// ============================================================================

interface ChartVisualizationProps {
  chartType: 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';
  data: SourceDataRow[];
  columns: SourceDataColumn[];
}

/**
 * ChartVisualization - Renders HighCharts based on widget configuration
 */
const ChartVisualization: React.FC<ChartVisualizationProps> = ({ chartType, data, columns }) => {
  const chartOptions: Highcharts.Options = useMemo(() => {
    // For metric cards, show the first numeric value
    if (chartType === 'metric') {
      const numericCol = columns.find((c) => c.type === 'number' || c.type === 'currency' || c.type === 'percentage');
      const value = numericCol ? data[0]?.[numericCol.id] : 0;
      return {
        chart: { type: 'solidgauge', height: '100%', backgroundColor: 'transparent' },
        title: { text: undefined },
        credits: { enabled: false },
        pane: { startAngle: 0, endAngle: 360, background: [{ outerRadius: '112%', innerRadius: '88%', backgroundColor: '#f3f4f6', borderWidth: 0 }] },
        yAxis: { min: 0, max: 100, lineWidth: 0, tickPositions: [] },
        plotOptions: { solidgauge: { dataLabels: { enabled: true, format: `<div style="text-align:center"><span style="font-size:32px;font-weight:600;color:#1f2937">${value}</span></div>` } } },
        series: [{ type: 'solidgauge', data: [75], innerRadius: '88%', radius: '112%', dataLabels: { y: -25 } }],
      };
    }

    // For table type, return empty config (table is shown separately)
    if (chartType === 'table') {
      return { chart: { type: 'column' }, title: { text: 'Table View' }, credits: { enabled: false } };
    }

    // Get first text column for categories and first numeric column for values
    const categoryCol = columns.find((c) => c.type === 'text');
    const valueCol = columns.find((c) => c.type === 'number' || c.type === 'currency' || c.type === 'percentage');

    if (!categoryCol || !valueCol) {
      return { chart: { type: 'column' }, title: { text: 'No data' }, credits: { enabled: false } };
    }

    const categories = data.map((row) => String(row[categoryCol.id]));
    const values = data.map((row) => Number(row[valueCol.id]) || 0);

    const baseOptions: Highcharts.Options = {
      chart: { type: chartType === 'bar' ? 'column' : chartType === 'donut' ? 'pie' : chartType, height: '100%', backgroundColor: 'transparent' },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: chartType === 'pie' || chartType === 'donut', align: 'center', verticalAlign: 'bottom' },
      colors: ['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff'],
      plotOptions: {
        pie: { innerSize: chartType === 'donut' ? '50%' : '0%', dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.percentage:.1f}%' } },
        column: { borderRadius: 4, borderWidth: 0 },
      },
    };

    if (chartType === 'pie' || chartType === 'donut') {
      return {
        ...baseOptions,
        series: [{ type: 'pie', name: valueCol.label, data: categories.map((cat, i) => ({ name: cat, y: values[i] })) }],
      };
    }

    return {
      ...baseOptions,
      xAxis: { categories, labels: { style: { fontSize: '11px' } } },
      yAxis: { title: { text: valueCol.label }, labels: { style: { fontSize: '11px' } } },
      series: [{ type: chartType === 'bar' ? 'column' : chartType, name: valueCol.label, data: values }],
    };
  }, [chartType, data, columns]);

  return <HighchartsReact highcharts={Highcharts} options={chartOptions} containerProps={{ style: { height: '100%', width: '100%' } }} />;
};

interface GlassDataTableProps {
  columns: SourceDataColumn[];
  data: SourceDataRow[];
}

/**
 * GlassDataTable - Apple's frosted glass aesthetic data table
 */
const GlassDataTable: React.FC<GlassDataTableProps> = ({ columns, data }) => {
  const formatValue = (value: unknown, type: string): string => {
    if (value === null || value === undefined) return '—';

    switch (type) {
      case 'currency':
        return typeof value === 'number'
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
            }).format(value)
          : String(value);
      case 'percentage':
        return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : `${value}%`;
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value);
      case 'date':
        if (typeof value === 'string') {
          const date = new Date(value);
          return isNaN(date.getTime())
            ? value
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return String(value);
      default:
        return String(value);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/20 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
      {/* Table Header */}
      <div className="bg-white/60 border-b border-white/30">
        <div className="flex">
          {columns.map((col) => (
            <div
              key={col.id}
              className="flex-1 px-4 py-2.5 text-[11px] font-medium text-gray-600 uppercase tracking-wide"
            >
              <div className="flex items-center gap-1.5">
                {col.isAI && <SparkleIcon size={12} className="text-orange-500" />}
                <span className={col.isAI ? 'text-orange-600' : ''}>{col.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-white/20 max-h-64 overflow-y-auto">
        {data.map((row, rowIndex) => (
          <div
            key={row.id || rowIndex}
            className="flex hover:bg-white/30 transition-colors"
          >
            {columns.map((col) => (
              <div key={col.id} className="flex-1 px-4 py-3 text-[13px] text-gray-900">
                {formatValue(row[col.id], col.type)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * WidgetDetailSheet - Slide-up modal for widget drill-down
 *
 * Features:
 * - Expanded chart view
 * - Drill-down filters (region, owner, etc.)
 * - Supporting data table with glass morphism aesthetic
 * - Shows data source attribution
 */
export const WidgetDetailSheet: React.FC<WidgetDetailSheetProps> = ({
  isOpen,
  widget,
  drillDownFilters = [],
  filterValues = {},
  onFilterChange,
  sourceColumns = [],
  sourceData = [],
  onClose,
  onExpand,
}) => {
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(filterValues);

  if (!widget) return null;

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [filterId]: value }));
    onFilterChange?.(filterId, value);
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[99] bg-black/5 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Sheet panel - slides up from bottom */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="absolute bottom-0 left-0 right-0 h-[85%] z-[100] flex flex-col rounded-t-2xl overflow-hidden"
          >
            {/* Background gradient - premium subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/95 to-gray-100/90" />

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/80">
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">{widget.name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {onExpand && (
                    <button
                      onClick={onExpand}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Expand"
                    >
                      <ArrowsOutIcon size={18} className="text-gray-600" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <XIcon size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Drill-Down Filters */}
              {drillDownFilters.length > 0 && (
                <div className="px-5 py-3 border-b border-gray-100/80 bg-white/50">
                  <div className="flex items-center justify-end gap-2">
                    <FunnelIcon size={14} className="text-gray-500" />
                    {drillDownFilters.map((filter) => (
                      <div key={filter.id} className="w-40">
                        <Select
                          options={[{ value: '', label: `All ${filter.label}` }, ...filter.options]}
                          value={activeFilters[filter.id] || ''}
                          onChange={(value) => handleFilterChange(filter.id, value)}
                          placeholder={filter.label}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Expanded Chart View */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-gray-900">{widget.name}</span>
                    <button className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 cursor-pointer">
                      <span>Options</span>
                      <CaretDownIcon size={12} />
                    </button>
                  </div>
                  <div className="h-80 p-4">
                    {sourceData.length > 0 ? (
                      <ChartVisualization
                        chartType={widget.chartType}
                        data={sourceData}
                        columns={sourceColumns}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-[13px] text-gray-500">No data available</p>
                          <p className="text-[11px] text-gray-400 mt-1">Configure this widget with a data source</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supporting Data Section */}
                {sourceColumns.length > 0 && sourceData.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide px-2">
                        Supporting Data
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>

                    <p className="text-[12px] text-gray-500 text-center">
                      Source: <span className="font-medium text-gray-700">{widget.dataSourceName}</span>
                      <span className="text-gray-400"> • </span>
                      {sourceData.length} rows
                    </p>

                    {/* Glass morphism data table */}
                    <GlassDataTable columns={sourceColumns} data={sourceData} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide px-2">
                        Supporting Data
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>
                    <div className="text-center py-8">
                      <p className="text-[13px] text-gray-500">No data source configured</p>
                      <p className="text-[11px] text-gray-400 mt-1">Configure this widget with a report to see data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WidgetDetailSheet;
