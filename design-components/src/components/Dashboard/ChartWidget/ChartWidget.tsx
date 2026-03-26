import { useRef, useEffect, useMemo } from 'react';
import Highcharts from 'highcharts';
import 'highcharts/modules/xrange';
import 'highcharts/modules/funnel';
import 'highcharts/modules/pattern-fill';
import HighchartsReact from 'highcharts-react-official';
import type { ChartWidgetConfig } from '../types';
import { useOptionalDashboardCustomization } from '../DashboardCustomization';

// ── Pattern helpers ───────────────────────────────────────────

function hatchPattern(lightBase: string, darkStroke: string, id: string): Highcharts.PatternObject {
  return {
    pattern: {
      id,
      path: {
        d: 'M 0 10 L 10 0 M -2 2 L 2 -2 M 8 12 L 12 8',
        stroke: darkStroke,
        strokeWidth: 1,
      },
      width: 10,
      height: 10,
      backgroundColor: lightBase,
      opacity: 0.85,
    },
  };
}

function dotPattern(lightBase: string, dotColor: string, id: string): Highcharts.PatternObject {
  return {
    pattern: {
      id,
      path: {
        d: 'M 3 3 m -0.75 0 a 0.75 0.75 0 1 0 1.5 0 a 0.75 0.75 0 1 0 -1.5 0 M 9 9 m -0.75 0 a 0.75 0.75 0 1 0 1.5 0 a 0.75 0.75 0 1 0 -1.5 0',
        fill: dotColor,
        stroke: dotColor,
        strokeWidth: 0.25,
      },
      width: 12,
      height: 12,
      backgroundColor: lightBase,
      opacity: 0.85,
    },
  };
}

function gridDotPattern(baseColor: string, dotColor: string, id: string): Highcharts.PatternObject {
  return {
    pattern: {
      id,
      path: {
        d: 'M 5 5 m -0.7 0 a 0.7 0.7 0 1 0 1.4 0 a 0.7 0.7 0 1 0 -1.4 0',
        fill: dotColor,
        stroke: dotColor,
        strokeWidth: 0.2,
      },
      width: 10,
      height: 10,
      backgroundColor: baseColor,
    },
  };
}

// ── Chart type detection ──────────────────────────────────────

type ChartCategory = 'bar' | 'line' | 'donut' | 'other';

function detectChartCategory(config: ChartWidgetConfig): ChartCategory {
  const ct = config.chartType?.toLowerCase() ?? '';
  if (['bar', 'column'].includes(ct)) return 'bar';
  if (['line', 'area', 'line-bar', 'column-line', 'line-line'].includes(ct)) return 'line';
  if (['pie', 'donut'].includes(ct)) return 'donut';
  return 'other';
}

// ── Theme-aware options ───────────────────────────────────────

const BASE_CHART_OPTIONS: Highcharts.Options = {
  chart: {
    backgroundColor: 'transparent',
    style: { fontFamily: 'inherit' },
    spacing: [8, 8, 8, 8],
  },
  title: { text: undefined },
  credits: { enabled: false },
  legend: {
    enabled: true,
    align: 'center',
    verticalAlign: 'bottom',
    margin: 4,
    padding: 4,
    itemStyle: { fontSize: '11px', fontWeight: '400', color: '#374151' },
  },
  tooltip: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    borderRadius: 8,
    style: { color: '#fff', fontSize: '11px' },
  },
  responsive: {
    rules: [
      {
        condition: { maxHeight: 250 },
        chartOptions: {
          legend: { enabled: false },
          xAxis: { labels: { style: { fontSize: '8px' } } },
          yAxis: { labels: { style: { fontSize: '8px' } } },
        },
      },
    ],
  },
};

const AXIS_LABEL_STYLE: Highcharts.CSSObject = { fontSize: '10px', color: '#6b7280' };
const GRID_LINE_COLOR = '#f3f4f6';
const LINE_COLOR = '#e5e7eb';
const TICK_COLOR = '#e5e7eb';

export interface ChartWidgetProps {
  config: ChartWidgetConfig;
}

/**
 * Single chart component that accepts a highcharts config and applies
 * the active dashboard theme (patterns, colors) from context.
 * Falls back gracefully if no provider is present.
 */
const ChartWidget: React.FC<ChartWidgetProps> = ({ config }) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const sizeRef = useRef<HTMLDivElement>(null);

  // Read theme — returns null if no provider is present
  const customization = useOptionalDashboardCustomization();

  const category = detectChartCategory(config);
  const palette = customization?.palette;

  const options = useMemo(() => {
    const raw = config.highchartsOptions as Highcharts.Options;

    // If no theme palette, use raw options with base styling
    if (!palette) {
      return {
        ...BASE_CHART_OPTIONS,
        ...raw,
        chart: {
          ...BASE_CHART_OPTIONS.chart,
          ...(raw.chart ?? {}),
          reflow: false,
        },
        title: { text: undefined },
      };
    }

    const themeId = palette.id;

    // Apply themed patterns based on chart category
    let themedSeries = raw.series;

    if (category === 'bar' && raw.series) {
      themedSeries = (raw.series as Highcharts.SeriesColumnOptions[]).map((s, i) => {
        const [light, dark] = palette.hatchPairs[i % palette.hatchPairs.length];
        return {
          ...s,
          color: hatchPattern(light, dark, `bar-hatch-${themeId}-${i}`),
          borderColor: dark,
        };
      }) as Highcharts.SeriesOptionsType[];
    } else if (category === 'line' && raw.series) {
      themedSeries = (raw.series as Highcharts.SeriesAreaOptions[]).flatMap((s, i) => {
        const color = palette.chartColors[i % palette.chartColors.length];
        return [
          // Gradient fill layer
          {
            ...s,
            name: s.name,
            color: 'transparent',
            lineWidth: 0,
            marker: { enabled: false },
            enableMouseTracking: false,
            showInLegend: false,
            fillOpacity: 1,
            fillColor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                [0, `${color}30`],
                [1, `${color}00`],
              ] as [number, string][],
            },
          },
          // Line + dot pattern layer
          {
            ...s,
            color,
            fillColor: gridDotPattern('transparent', `${color}35`, `line-grid-dot-${themeId}-${i}`),
          },
        ];
      }) as Highcharts.SeriesOptionsType[];
    } else if (category === 'donut' && raw.series) {
      themedSeries = (raw.series as Highcharts.SeriesPieOptions[]).map((s) => ({
        ...s,
        data: ((s.data ?? []) as Array<{ name?: string; y?: number }>).map((d, i) => {
          const [base, dot] = palette.dotPairs[i % palette.dotPairs.length];
          return {
            ...d,
            color: dotPattern(base, dot, `donut-dot-${themeId}-${i}`),
          };
        }),
      })) as Highcharts.SeriesOptionsType[];
    }

    // Build themed axis options
    const xAxisDefaults = {
      labels: { style: AXIS_LABEL_STYLE },
      lineColor: LINE_COLOR,
      tickColor: TICK_COLOR,
    };
    const yAxisDefaults = {
      title: { text: undefined },
      labels: { style: AXIS_LABEL_STYLE },
      gridLineColor: GRID_LINE_COLOR,
    };

    return {
      ...BASE_CHART_OPTIONS,
      ...raw,
      chart: {
        ...BASE_CHART_OPTIONS.chart,
        ...(raw.chart ?? {}),
        reflow: false,
      },
      xAxis: { ...xAxisDefaults, ...((raw.xAxis as object) ?? {}) },
      yAxis: raw.yAxis
        ? (Array.isArray(raw.yAxis) ? raw.yAxis : [raw.yAxis]).map((y) => ({
            ...yAxisDefaults,
            ...(y as object),
          }))
        : yAxisDefaults,
      colors: palette.chartColors,
      title: { text: undefined },
      series: themedSeries,
      plotOptions: {
        ...(raw.plotOptions ?? {}),
        column: {
          borderRadius: 6,
          borderWidth: 1,
          groupPadding: 0.1,
          pointPadding: 0.05,
          ...(((raw.plotOptions as Record<string, unknown>)?.column as object) ?? {}),
        },
        area: {
          lineWidth: 2.5,
          marker: { enabled: true, radius: 3, symbol: 'circle' },
          fillOpacity: 1,
          linecap: 'round',
          ...(((raw.plotOptions as Record<string, unknown>)?.area as object) ?? {}),
        },
        pie: {
          innerSize: '55%',
          size: '80%',
          borderWidth: 2,
          borderColor: '#ffffff',
          center: ['50%', '50%'],
          dataLabels: {
            enabled: true,
            format: '{point.name}: {point.percentage:.0f}%',
            style: { fontSize: '10px', fontWeight: '400', color: '#374151' },
            distance: 15,
            connectorWidth: 1,
          },
          ...(((raw.plotOptions as Record<string, unknown>)?.pie as object) ?? {}),
        },
      },
    };
  }, [config.highchartsOptions, palette, category]);

  useEffect(() => {
    const el = sizeRef.current;
    if (!el) return;

    const syncSize = () => {
      const chart = chartRef.current?.chart;
      if (!chart) return;
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        try {
          chart.setSize(Math.floor(width), Math.floor(height), false);
        } catch {
          // Chart was destroyed between rAF scheduling and execution
        }
      }
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(syncSize);
    });

    observer.observe(el);
    requestAnimationFrame(syncSize);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-full w-full min-h-0 overflow-hidden p-2">
      <div ref={sizeRef} className="h-full w-full">
        <HighchartsReact
          ref={chartRef}
          highcharts={Highcharts}
          options={options}
          containerProps={{ style: { height: '100%', width: '100%' } }}
        />
      </div>
    </div>
  );
};

export { ChartWidget };
