import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ChartBar, Sparkle, GearSix, Check } from '@phosphor-icons/react';
import { TypingText } from './TypingText';
import type { ChartConfig, DashboardWidget, MetricConfig } from '../types';
import {
  accountsAtRiskData,
  engagementTimelineData,
  riskByRegionData,
  arrAtRiskByIndustry,
  churnProbabilityData,
} from '../mockData';

export interface AnimatedChartProps {
  /**
   * Widget configuration
   */
  widget: DashboardWidget;

  /**
   * Whether to animate the chart appearing
   */
  animate?: boolean;

  /**
   * Delay before starting animation (ms)
   */
  delay?: number;

  /**
   * Callback when chart animation is complete
   */
  onComplete?: () => void;

  /**
   * Whether to show the configuration panel animation
   */
  showConfigAnimation?: boolean;
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
 * ConfigurationPanel - Animated configuration panel for chart setup
 */
const ConfigurationPanel: React.FC<{
  title: string;
  onComplete?: () => void;
  isActive: boolean;
}> = ({ title, onComplete, isActive }) => {
  const [phase, setPhase] = useState<'title' | 'fields' | 'complete'>('title');
  const hasStartedRef = useRef(false);

  const startSequence = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Title typing complete, show fields
    setTimeout(() => setPhase('fields'), 1000);

    // After fields appear, mark complete
    setTimeout(() => {
      setPhase('complete');
      onComplete?.();
    }, 2000);
  }, [onComplete]);

  React.useLayoutEffect(() => {
    if (isActive) {
      startSequence();
    }
  }, [isActive, startSequence]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute right-0 top-0 bottom-0 w-64 bg-white border-l border-gray-200 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
        <div className="flex items-center gap-2">
          <GearSix size={16} weight="duotone" className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Configure</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title field */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Chart Title</label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            {phase === 'title' ? (
              <TypingText
                text={title}
                speed={40}
                showCursor={true}
                className="text-sm text-gray-900"
              />
            ) : (
              <span className="text-sm text-gray-900">{title}</span>
            )}
          </div>
        </div>

        {/* Other fields appear after title */}
        <AnimatePresence>
          {(phase === 'fields' || phase === 'complete') && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-xs font-medium text-gray-600 mb-1">Data Source</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-gray-900">Auto-selected</span>
                  <Check size={14} weight="bold" className="text-green-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-xs font-medium text-gray-600 mb-1">X-Axis</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-gray-900">Configured</span>
                  <Check size={14} weight="bold" className="text-green-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-xs font-medium text-gray-600 mb-1">Y-Axis</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-gray-900">Configured</span>
                  <Check size={14} weight="bold" className="text-green-500" />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Apply button */}
        <AnimatePresence>
          {phase === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white text-sm font-medium rounded-lg"
              >
                Applied
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/**
 * AnimatedMetricCard - Metric card with animation
 */
const AnimatedMetricCard: React.FC<{
  config: MetricConfig;
  delay: number;
  onComplete?: () => void;
}> = ({ config, delay, onComplete }) => {
  const [phase, setPhase] = useState<'hidden' | 'appear' | 'value' | 'complete'>('hidden');

  React.useLayoutEffect(() => {
    const t1 = setTimeout(() => setPhase('appear'), delay);
    const t2 = setTimeout(() => setPhase('value'), delay + 400);
    const t3 = setTimeout(() => {
      setPhase('complete');
      onComplete?.();
    }, delay + 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [delay, onComplete]);

  if (phase === 'hidden') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-4"
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {phase === 'appear' ? (
          <TypingText text={config.label} speed={30} showCursor={false} />
        ) : (
          config.label
        )}
      </p>
      <AnimatePresence>
        {(phase === 'value' || phase === 'complete') && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold text-gray-900"
          >
            {config.value}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * AnimatedChart - Chart component with progressive animation
 */
export const AnimatedChart: React.FC<AnimatedChartProps> = ({
  widget,
  animate = true,
  delay = 0,
  onComplete,
  showConfigAnimation = true,
}) => {
  const [phase, setPhase] = useState<'hidden' | 'container' | 'config' | 'chart' | 'complete'>(
    animate ? 'hidden' : 'complete'
  );
  const hasStartedRef = useRef(false);

  const isMetric = widget.type === 'metric';
  const config = widget.config as ChartConfig;
  const metricConfig = widget.config as MetricConfig;

  const startAnimation = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    setTimeout(() => setPhase('container'), delay);
    setTimeout(() => setPhase('config'), delay + 300);
    setTimeout(() => setPhase('chart'), delay + (showConfigAnimation ? 2500 : 500));
    setTimeout(() => {
      setPhase('complete');
      onComplete?.();
    }, delay + (showConfigAnimation ? 3500 : 1500));
  }, [delay, showConfigAnimation, onComplete]);

  React.useLayoutEffect(() => {
    if (animate) {
      startAnimation();
    }
  }, [animate, startAnimation]);

  // Build chart options
  const chartOptions: Highcharts.Options = useMemo(() => {
    if (isMetric) return {};

    const data = getDataForTable(config.dataTableId);

    const baseOptions: Highcharts.Options = {
      chart: {
        type: config.type === 'column' ? 'column' : config.type,
        height: 240,
        style: {
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
        },
        backgroundColor: 'transparent',
        animation: {
          duration: 1000,
        },
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: { color: '#6e6e73', fontSize: '11px', fontWeight: '500' },
      },
      colors: chartColors,
      plotOptions: {
        series: {
          animation: { duration: 1000 },
        },
        column: { borderRadius: 4, borderWidth: 0 },
        bar: { borderRadius: 4, borderWidth: 0 },
        pie: {
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f}%',
            style: { fontSize: '11px', fontWeight: '500', color: '#6e6e73' },
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
            labels: { style: { color: '#6e6e73', fontSize: '11px' } },
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
        const series = config.series?.map((seriesKey) => ({
          name: seriesKey.charAt(0).toUpperCase() + seriesKey.slice(1).replace(/([A-Z])/g, ' $1'),
          data: data.map((d) => Number(d[seriesKey]) || 0),
          type: config.type as 'line' | 'area',
        })) || [];

        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: config.type },
          xAxis: {
            categories,
            labels: { style: { color: '#6e6e73', fontSize: '11px' } },
            lineColor: '#e8e8ed',
          },
          yAxis: {
            title: { text: undefined },
            labels: { style: { color: '#6e6e73', fontSize: '11px' } },
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
          chart: { ...baseOptions.chart, type: 'pie' },
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
  }, [config, isMetric]);

  // Render metric card
  if (isMetric) {
    return (
      <AnimatedMetricCard
        config={metricConfig}
        delay={delay}
        onComplete={onComplete}
      />
    );
  }

  if (phase === 'hidden') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm relative"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-orange-400 flex items-center justify-center">
            <ChartBar size={14} weight="fill" className="text-white" />
          </div>
          <div>
            {phase === 'container' || phase === 'config' ? (
              <h3 className="text-sm font-semibold text-gray-900">
                <TypingText text={config.title} speed={40} showCursor={true} />
              </h3>
            ) : (
              <h3 className="text-sm font-semibold text-gray-900">{config.title}</h3>
            )}
          </div>
        </div>
        {(phase === 'container' || phase === 'config') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkle size={12} weight="fill" className="text-purple-600" />
            </motion.div>
            <span className="text-xs font-medium text-purple-700">Building</span>
          </motion.div>
        )}
      </div>

      {/* Chart Area */}
      <div className="p-4 relative" style={{ minHeight: 280 }}>
        <AnimatePresence>
          {(phase === 'chart' || phase === 'complete') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton placeholder before chart */}
        {(phase === 'container' || phase === 'config') && (
          <div className="absolute inset-4 flex items-center justify-center">
            <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
              <motion.div
                className="w-12 h-12 rounded-full border-3 border-gray-200 border-t-purple-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Configuration Panel Overlay */}
      <AnimatePresence>
        {phase === 'config' && showConfigAnimation && (
          <ConfigurationPanel
            title={config.title}
            isActive={phase === 'config'}
            onComplete={() => {}}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnimatedChart;
