import { useMemo, useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react';
import type { CounterWidgetProps } from '../types';

function formatValue(
  value: string | number,
  format: string,
  prefix?: string,
  suffix?: string,
  decimals?: number,
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

const sentimentColors = {
  positive: { text: 'text-green-600', bg: 'bg-green-50' },
  negative: { text: 'text-red-600', bg: 'bg-red-50' },
  neutral: { text: 'text-gray-500', bg: 'bg-gray-50' },
};

const TrendIcon: React.FC<{ direction: 'up' | 'down' | 'neutral'; className?: string }> = ({
  direction,
  className,
}) => {
  switch (direction) {
    case 'up':
      return <TrendUp size={14} weight="bold" className={className} />;
    case 'down':
      return <TrendDown size={14} weight="bold" className={className} />;
    default:
      return <Minus size={14} weight="bold" className={className} />;
  }
};

const DEFAULT_ACCENT = '#8039e9';

const Sparkline: React.FC<{ data: number[]; type: 'line' | 'bar'; accentColor?: string }> = ({ data, type, accentColor }) => {
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
        series: { animation: false, enableMouseTracking: false, states: { hover: { enabled: false } } },
        line: { lineWidth: 1.5, marker: { enabled: false }, color: accentColor ?? DEFAULT_ACCENT },
        column: { borderWidth: 0, borderRadius: 1, color: accentColor ?? DEFAULT_ACCENT, pointPadding: 0.1, groupPadding: 0 },
      },
      series: [{ type: type === 'bar' ? 'column' : 'line', data, name: '' }],
    }),
    [data, type, accentColor],
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
 * Displays a formatted value, optional trend indicator, and optional sparkline.
 */
const CounterWidget: React.FC<CounterWidgetProps> = ({ config }) => {
  const { value, format, prefix, suffix, decimals, trend, sparkline } = config;
  const displayValue = formatValue(value, format, prefix, suffix, decimals);
  const colors = trend ? sentimentColors[trend.sentiment] : null;

  return (
    <div className="flex flex-col justify-center h-full px-4 py-3 gap-2">
      <div className="text-2xl font-bold text-gray-900 truncate">{displayValue}</div>

      {trend && colors && (
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${colors.text} ${colors.bg}`}
          >
            <TrendIcon direction={trend.direction} className={colors.text} />
            {trend.value}%
          </span>
          {trend.label && <span className="text-xs text-gray-400">{trend.label}</span>}
        </div>
      )}

      {sparkline && <Sparkline data={sparkline.data} type={sparkline.type} accentColor={config.accentColor} />}
    </div>
  );
};

export { CounterWidget };
