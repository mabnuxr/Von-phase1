import React, { useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilSimple, ArrowsOut, DotsThree, Trash } from '@phosphor-icons/react';
import type { DashboardWidget, ChartConfig } from './types';
import {
  accountsAtRiskData,
  engagementTimelineData,
  riskByRegionData,
  arrAtRiskByIndustry,
  churnProbabilityData,
} from './mockData';

export interface ChartWidgetProps {
  /**
   * Widget configuration
   */
  widget: DashboardWidget;

  /**
   * Callback when widget is clicked
   */
  onClick?: () => void;

  /**
   * Callback when edit is clicked
   */
  onEdit?: () => void;

  /**
   * Callback when expand is clicked
   */
  onExpand?: () => void;

  /**
   * Callback when delete is clicked
   */
  onDelete?: () => void;

  /**
   * Hide the header (title, subtitle, actions) when used inside WidgetLayout
   */
  hideHeader?: boolean;
}

// Color palette matching Von brand
const chartColors = ['#8039e9', '#FF9042', '#0071e3', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

// Get data for a specific table ID
const getDataForTable = (tableId: string): Record<string, unknown>[] => {
  switch (tableId) {
    case 'tbl-accounts-at-risk':
      return accountsAtRiskData as Record<string, unknown>[];
    case 'tbl-engagement-timeline':
      return engagementTimelineData as Record<string, unknown>[];
    case 'tbl-risk-by-region':
      return riskByRegionData as Record<string, unknown>[];
    case 'tbl-arr-by-industry':
      return arrAtRiskByIndustry as Record<string, unknown>[];
    case 'tbl-churn-distribution':
      return churnProbabilityData as Record<string, unknown>[];
    default:
      return [];
  }
};

/**
 * ChartWidget - Renders a Highcharts visualization
 */
export const ChartWidget: React.FC<ChartWidgetProps> = ({
  widget,
  onClick,
  onEdit,
  onExpand,
  onDelete,
  hideHeader = false,
}) => {
  const config = widget.config as ChartConfig;
  const data = getDataForTable(config.dataTableId);
  const [showMenu, setShowMenu] = useState(false);

  const chartOptions: Highcharts.Options = useMemo(() => {
    const baseOptions: Highcharts.Options = {
      chart: {
        type: config.type === 'column' ? 'column' : config.type,
        height: 280,
        style: {
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
        },
        backgroundColor: 'transparent',
      },
      title: {
        text: undefined,
      },
      credits: {
        enabled: false,
      },
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: {
          color: '#6e6e73',
          fontSize: '11px',
          fontWeight: '500',
        },
      },
      colors: chartColors,
      plotOptions: {
        series: {
          animation: {
            duration: 800,
          },
        },
        column: {
          borderRadius: 4,
          borderWidth: 0,
        },
        bar: {
          borderRadius: 4,
          borderWidth: 0,
        },
        pie: {
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f}%',
            style: {
              fontSize: '11px',
              fontWeight: '500',
              color: '#6e6e73',
            },
          },
        },
      },
    };

    // Build chart-specific options
    switch (config.type) {
      case 'bar':
      case 'column': {
        const categories = data.map((d) => String(d[config.xAxis || '']));
        const series = config.series?.map((seriesKey) => ({
          name: seriesKey.charAt(0).toUpperCase() + seriesKey.slice(1),
          data: data.map((d) => Number(d[seriesKey]) || 0),
        })) || [
          {
            name: config.yAxis || 'Value',
            data: data.map((d) => Number(d[config.yAxis || '']) || 0),
          },
        ];

        return {
          ...baseOptions,
          xAxis: {
            categories,
            labels: {
              style: { color: '#6e6e73', fontSize: '11px' },
            },
            lineColor: '#e8e8ed',
          },
          yAxis: {
            title: { text: undefined },
            labels: {
              style: { color: '#6e6e73', fontSize: '11px' },
              formatter: function (this: Highcharts.AxisLabelsFormatterContextObject): string {
                const value = Number(this.value);
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                return String(value);
              },
            },
            gridLineColor: '#f5f5f7',
          },
          series: series as Highcharts.SeriesOptionsType[],
        };
      }

      case 'line':
      case 'area': {
        const categories = data.map((d) => String(d[config.xAxis || '']));
        const series =
          config.series?.map((seriesKey) => ({
            name: seriesKey.charAt(0).toUpperCase() + seriesKey.slice(1).replace(/([A-Z])/g, ' $1'),
            data: data.map((d) => Number(d[seriesKey]) || 0),
            type: config.type as 'line' | 'area',
          })) || [];

        return {
          ...baseOptions,
          chart: {
            ...baseOptions.chart,
            type: config.type,
          },
          xAxis: {
            categories,
            labels: {
              style: { color: '#6e6e73', fontSize: '11px' },
            },
            lineColor: '#e8e8ed',
          },
          yAxis: {
            title: { text: undefined },
            labels: {
              style: { color: '#6e6e73', fontSize: '11px' },
            },
            gridLineColor: '#f5f5f7',
          },
          series: series as Highcharts.SeriesOptionsType[],
        };
      }

      case 'pie':
      case 'donut': {
        const pieData = data.map((d) => ({
          name: String(d[config.xAxis || '']),
          y: Number(d[config.yAxis || '']) || 0,
        }));

        return {
          ...baseOptions,
          chart: {
            ...baseOptions.chart,
            type: 'pie',
          },
          plotOptions: {
            ...baseOptions.plotOptions,
            pie: {
              ...baseOptions.plotOptions?.pie,
              innerSize: config.type === 'donut' ? '50%' : '0%',
            },
          },
          series: [
            {
              type: 'pie',
              name: config.title,
              data: pieData,
            },
          ] as Highcharts.SeriesOptionsType[],
        };
      }

      default:
        return baseOptions;
    }
  }, [config, data]);

  // When hideHeader is true, render only the chart content (for use inside WidgetLayout)
  if (hideHeader) {
    return (
      <div className="p-4 h-full">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{config.title}</h3>
          {config.subtitle && <p className="text-xs text-gray-500 mt-0.5">{config.subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <PencilSimple size={14} weight="duotone" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand?.();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowsOut size={14} weight="duotone" />
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <DotsThree size={14} weight="bold" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete?.();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash size={14} weight="duotone" />
                      Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
    </div>
  );
};

export default ChartWidget;
