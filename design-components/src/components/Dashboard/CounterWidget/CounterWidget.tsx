import { useMemo, useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react';
import type { CounterWidgetProps } from '../types';
import { useDashboardCustomization } from '../DashboardCustomization';

function formatValue(
  value: string | number | null,
  format: string,
  prefix?: string,
  suffix?: string,
  decimals?: number
): string {
  if (value == null) return '—';
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

const DEFAULT_ACCENT = '#8039e9';

/** Try to read the theme primary color, fallback gracefully */
function useThemePrimary(): string | undefined {
  return useDashboardCustomization().palette.primary;
}

const Sparkline: React.FC<{ data: number[]; type: 'line' | 'bar'; accentColor?: string }> = ({
  data,
  type,
  accentColor,
}) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const themeColor = useThemePrimary();
  const color = accentColor ?? themeColor ?? DEFAULT_ACCENT;

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
        line: { lineWidth: 1.5, marker: { enabled: false }, color },
        column: {
          borderWidth: 0,
          borderRadius: 1,
          color,
          pointPadding: 0.1,
          groupPadding: 0,
        },
      },
      series: [{ type: type === 'bar' ? 'column' : 'line', data, name: '' }],
    }),
    [data, type, color]
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
  const primaryColor = useThemePrimary();

  return (
    <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-xs px-3 py-2.5 flex flex-col justify-center cursor-pointer hover:border-gray-200 transition-colors">
      {title && <p className="text-xs text-gray-700 mb-1 truncate">{title}</p>}
      {subtitle && <p className="text-[10px] text-gray-400 -mt-0.5 mb-1 truncate">{subtitle}</p>}

      <p className="text-2xl font-semibold text-gray-900 tabular-nums truncate">{displayValue}</p>

      {trend && (
        <div className="flex items-center gap-1 mt-1">
          {trend.direction === 'up' && (
            <ArrowUp
              size={12}
              weight="bold"
              style={primaryColor ? { color: primaryColor } : undefined}
              className={primaryColor ? '' : 'text-emerald-600'}
            />
          )}
          {trend.direction === 'down' && (
            <ArrowDown size={12} weight="bold" className="text-gray-400" />
          )}
          {trend.direction === 'neutral' && (
            <Minus size={12} weight="bold" className="text-gray-500" />
          )}
          <span
            className={`text-xs font-medium ${
              trend.direction === 'up'
                ? ''
                : trend.direction === 'down'
                  ? 'text-gray-400'
                  : 'text-gray-500'
            }`}
            style={trend.direction === 'up' && primaryColor ? { color: primaryColor } : undefined}
          >
            {trend.direction === 'up' ? '+' : ''}
            {trend.value}
            {trend.unit ?? ''}
          </span>
          {trend.label && <span className="text-xs text-gray-700">{trend.label}</span>}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-700">Progress</span>
            {target && <span className="text-[10px] text-gray-700">Target: {target}</span>}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                backgroundColor: primaryColor ?? '#29a395',
              }}
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
