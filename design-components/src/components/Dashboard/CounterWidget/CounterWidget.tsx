import { useMemo, useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react';
import type { CounterWidgetProps } from '../types';

function formatValue(
  value: string | number,
  format: string,
  prefix?: string,
  suffix?: string,
  decimals?: number
): string {
  if (typeof value === 'string') return `${prefix ?? ''}${value}${suffix ?? ''}`;

  let formatted: string;
  const dec = decimals ?? 0;

  switch (format) {
    case 'currency': {
      if (value >= 1_000_000) formatted = `${(value / 1_000_000).toFixed(1)}M`;
      else if (value >= 1_000) formatted = `${(value / 1_000).toFixed(0)}K`;
      else formatted = value.toFixed(dec);
      break;
    }
    case 'percentage':
      formatted = value.toFixed(dec);
      break;
    default:
      formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
  }

  return `${prefix ?? ''}${formatted}${suffix ?? ''}`;
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return 'bg-emerald-500';
  if (progress >= 75) return 'bg-indigo-500';
  if (progress >= 50) return 'bg-amber-500';
  return 'bg-red-400';
}

const DEFAULT_ACCENT = '#8039e9';

const Sparkline: React.FC<{ data: number[]; type: 'line' | 'bar'; accentColor?: string }> = ({
  data,
  type,
  accentColor,
}) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);

  useEffect(() => {
    const chart = chartRef.current?.chart;
    if (!chart) return;

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (chart) chart.reflow();
      });
    });

    const container = chart.container?.parentElement;
    if (container) resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const options: Highcharts.Options = useMemo(
    () => ({
      chart: {
        type: type === 'bar' ? 'column' : 'line',
        backgroundColor: 'transparent',
        spacing: [0, 0, 0, 0],
        margin: [2, 0, 2, 0],
      },
      title: { text: undefined },
      xAxis: { visible: false },
      yAxis: { visible: false },
      legend: { enabled: false },
      credits: { enabled: false },
      tooltip: { enabled: false },
      plotOptions: {
        series: {
          animation: false,
          enableMouseTracking: false,
          states: { hover: { enabled: false } },
        },
        line: { lineWidth: 1.5, marker: { enabled: false }, color: accentColor ?? DEFAULT_ACCENT },
        column: {
          borderWidth: 0,
          borderRadius: 1,
          color: accentColor ?? DEFAULT_ACCENT,
          pointPadding: 0.1,
          groupPadding: 0,
        },
      },
      series: [{ type: type === 'bar' ? 'column' : 'line', data, name: '' }],
    }),
    [data, type, accentColor]
  );

  return (
    <div className="h-8 w-full">
      <HighchartsReact
        ref={chartRef}
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: '100%', width: '100%' } }}
      />
    </div>
  );
};

/**
 * Counter / KPI metric widget.
 * Matches storybook KPICard design: inline title, value, change badge,
 * optional progress bar with target, and optional sparkline.
 */
const CounterWidget: React.FC<CounterWidgetProps> = ({ config, title, subtitle }) => {
  const { value, format, prefix, suffix, decimals, trend, sparkline, progress, target } = config;
  const displayValue = formatValue(value, format, prefix, suffix, decimals);

  return (
    <div className="h-full bg-white rounded-xl border border-gray-100 p-4 flex flex-col justify-center">
      {title && <p className="text-xs text-gray-500 mb-1 truncate">{title}</p>}
      {subtitle && <p className="text-[10px] text-gray-400 -mt-0.5 mb-1 truncate">{subtitle}</p>}

      <p className="text-2xl font-semibold text-gray-900 tabular-nums truncate">{displayValue}</p>

      {trend && (
        <div className="flex items-center gap-1 mt-1">
          {trend.direction === 'up' && (
            <ArrowUp size={12} weight="bold" className="text-emerald-600" />
          )}
          {trend.direction === 'down' && (
            <ArrowDown size={12} weight="bold" className="text-red-600" />
          )}
          {trend.direction === 'neutral' && (
            <Minus size={12} weight="bold" className="text-gray-500" />
          )}
          <span
            className={`text-xs font-medium ${
              trend.sentiment === 'positive'
                ? 'text-emerald-600'
                : trend.sentiment === 'negative'
                  ? 'text-red-600'
                  : 'text-gray-500'
            }`}
          >
            {trend.direction === 'up' ? '+' : ''}
            {trend.value}
            {trend.unit ?? ''}
          </span>
          {trend.label && <span className="text-xs text-gray-500">{trend.label}</span>}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">Progress</span>
            {target && <span className="text-[10px] text-gray-500">Target: {target}</span>}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor(progress)}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="flex items-center justify-end mt-0.5">
            <span className="text-[10px] font-medium text-gray-600">{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {sparkline && (
        <div className="mt-2">
          <Sparkline data={sparkline.data} type={sparkline.type} accentColor={config.accentColor} />
        </div>
      )}
    </div>
  );
};

export { CounterWidget };
