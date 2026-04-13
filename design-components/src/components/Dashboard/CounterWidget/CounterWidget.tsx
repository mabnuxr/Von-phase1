import { useMemo, useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, TableIcon } from '@phosphor-icons/react';
import type { CounterWidgetProps } from '../types';
import { QueryInfoPopover } from '../QueryInfoPopover';
import { WidgetFiltersPopover } from '../WidgetFiltersPopover';
import {
  formatKpiDisplay,
  computeProgress,
  getComparisonColor,
} from '../../../utils/formatKpiValue';

const DEFAULT_ACCENT = '#8039e9';

const Sparkline: React.FC<{ data: number[]; type: 'line' | 'bar'; accentColor?: string }> = ({
  data,
  type,
  accentColor,
}) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const color = accentColor ?? DEFAULT_ACCENT;

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

const CounterWidget: React.FC<CounterWidgetProps> = ({
  config,
  title,
  subtitle,
  onDrillDown,
  queryInfo,
  appliedFilters,
  filterSlot,
}) => {
  const { value, format, prefix, suffix, comparison, target, sparkline } = config;

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

  // Comparison arrows/text always use green (good) / red (bad) regardless of theme
  const arrowClassName = COMPARISON_COLOR_CLASS[comparisonColor];
  const textClassName = `text-xs font-medium ${COMPARISON_COLOR_CLASS[comparisonColor]}`;

  return (
    <div
      className="group relative h-full bg-white border border-gray-200 px-4 py-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 transition-all"
      onClick={onDrillDown}
    >
      {(filterSlot || appliedFilters || queryInfo || onDrillDown) && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 z-10">
          {filterSlot
            ? filterSlot
            : appliedFilters && <WidgetFiltersPopover filters={appliedFilters} />}
          {queryInfo && <QueryInfoPopover queryInfo={queryInfo} />}
          {onDrillDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer"
              title="View data"
            >
              <TableIcon size={14} />
            </button>
          )}
        </div>
      )}
      {title && (
        <p className="text-xs font-medium text-gray-500 mb-1.5 truncate max-w-full">{title}</p>
      )}
      {subtitle && (
        <p className="text-[10px] text-gray-400 -mt-1 mb-1.5 truncate max-w-full">{subtitle}</p>
      )}

      <p className="text-2xl font-bold text-gray-900 tabular-nums truncate max-w-full">
        {displayValue}
      </p>

      {hasComparison && comparisonText && (
        <div className="flex items-center gap-1 mt-2">
          {cmpVal > 0 && <ArrowUpIcon size={12} weight="bold" className={arrowClassName} />}
          {cmpVal < 0 && <ArrowDownIcon size={12} weight="bold" className={arrowClassName} />}
          {cmpVal === 0 && <MinusIcon size={12} weight="bold" className="text-gray-500" />}
          <span className={textClassName}>{comparisonText}</span>
          {comparison.label && (
            <span className="text-xs text-gray-400 font-normal">{comparison.label}</span>
          )}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3 w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">Progress</span>
            {targetDisplay && target && (
              <span className="text-[10px] text-gray-500">
                {target.label}: {targetDisplay}
              </span>
            )}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                backgroundColor: '#29a395',
              }}
            />
          </div>
          <div className="flex items-center justify-end mt-0.5">
            <span className="text-[10px] font-medium text-gray-500">{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {sparkline && (
        <div className="mt-2 w-full">
          <Sparkline data={sparkline.data} type={sparkline.type} accentColor={config.accentColor} />
        </div>
      )}
    </div>
  );
};

export { CounterWidget };
