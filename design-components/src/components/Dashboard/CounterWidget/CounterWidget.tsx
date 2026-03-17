import { useMemo, useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react';
import type { CounterWidgetProps } from '../types';
import { useDashboardCustomization } from '../DashboardCustomization';
import {
  formatKpiDisplay,
  computeProgress,
  getComparisonColor,
} from '../../../utils/formatKpiValue';

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
 * Renders a primary value with d3-format pattern, comparison delta
 * with positive_is_good semantics, target progress bar, and optional sparkline.
 */
const COMPARISON_COLOR_CLASS = {
  good: 'text-emerald-600',
  bad: 'text-red-600',
  neutral: 'text-gray-500',
} as const;

const CounterWidget: React.FC<CounterWidgetProps> = ({ config, title, subtitle }) => {
  const { value, format, prefix, suffix, comparison, target, sparkline } = config;
  const primaryColor = useThemePrimary();

  const displayValue = formatKpiDisplay(value, format, prefix, suffix);

  const cmpVal = comparison?.value ?? null;
  const hasComparison = comparison != null && cmpVal !== null;
  const comparisonColor = hasComparison
    ? getComparisonColor(cmpVal, comparison.positive_is_good)
    : 'neutral';
  const comparisonText = hasComparison
    ? `${cmpVal > 0 ? '+' : ''}${formatKpiDisplay(cmpVal, comparison.format, null, comparison.suffix, false)}`
    : undefined;

  const progress = target ? computeProgress(value, target.value, target.inverted) : undefined;
  const targetDisplay =
    target && target.value !== null
      ? formatKpiDisplay(target.value, target.format, prefix, suffix)
      : undefined;

  // Theme-aware color: "good" uses primaryColor if set, otherwise emerald
  const arrowClassName =
    comparisonColor === 'good' && primaryColor ? '' : COMPARISON_COLOR_CLASS[comparisonColor];
  const arrowStyle =
    comparisonColor === 'good' && primaryColor ? { color: primaryColor } : undefined;
  const textClassName =
    comparisonColor === 'good' && primaryColor
      ? 'text-xs font-medium'
      : `text-xs font-medium ${COMPARISON_COLOR_CLASS[comparisonColor]}`;
  const textStyle =
    comparisonColor === 'good' && primaryColor ? { color: primaryColor } : undefined;

  return (
    <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-xs px-3 py-2.5 flex flex-col justify-center cursor-pointer hover:border-gray-200 transition-colors">
      {title && <p className="text-xs text-gray-700 mb-1 truncate">{title}</p>}
      {subtitle && <p className="text-[10px] text-gray-400 -mt-0.5 mb-1 truncate">{subtitle}</p>}

      <p className="text-2xl font-semibold text-gray-900 tabular-nums truncate">{displayValue}</p>

      {hasComparison && comparisonText && (
        <div className="flex items-center gap-1 mt-1">
          {cmpVal > 0 && (
            <ArrowUp size={12} weight="bold" className={arrowClassName} style={arrowStyle} />
          )}
          {cmpVal < 0 && (
            <ArrowDown size={12} weight="bold" className={arrowClassName} style={arrowStyle} />
          )}
          {cmpVal === 0 && <Minus size={12} weight="bold" className="text-gray-500" />}
          <span className={textClassName} style={textStyle}>
            {comparisonText}
          </span>
          {comparison.label && <span className="text-xs text-gray-700">{comparison.label}</span>}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-700">Progress</span>
            {targetDisplay && target && (
              <span className="text-[10px] text-gray-700">
                {target.label}: {targetDisplay}
              </span>
            )}
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
