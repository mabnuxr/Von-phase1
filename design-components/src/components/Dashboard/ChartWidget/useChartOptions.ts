import { useMemo } from 'react';
import type Highcharts from 'highcharts';
import type { ChartWidgetConfig, DrilldownConfig, DrillFilters } from '../types';

// ── Shared defaults ─────────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Resolve a dot-separated property path against a Highcharts point object.
 *
 * Paths starting with "point." are stripped since the caller already holds
 * the point reference (e.g. "point.name" → reads point["name"]).
 */
function getNestedValue(point: Highcharts.Point, path: string): unknown {
  const effectivePath = path.startsWith('point.') ? path.slice(6) : path;
  const parts = effectivePath.split('.');
  let current: unknown = point;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

// ── Gantt options builder ───────────────────────────────────────

function buildGanttOptions(raw: Highcharts.Options): Highcharts.Options {
  return {
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: 'inherit' },
      ...((raw.chart ?? {}) as object),
      animation: false,
      reflow: false,
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: { enabled: false },
    tooltip: {
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      borderRadius: 8,
      style: { color: '#fff', fontSize: '11px' },
    },
    xAxis: raw.xAxis,
    yAxis: raw.yAxis,
    series: raw.series,
    plotOptions: {
      series: {
        animation: false,
        ...(((raw.plotOptions as Record<string, unknown>)?.series as object) ?? {}),
      },
    },
  };
}

// ── Standard chart options builder ──────────────────────────────

function buildStandardOptions(raw: Highcharts.Options): Highcharts.Options {
  const cleanSeries = ((raw.series ?? []) as Record<string, unknown>[]).map((s) => {
    const { color, fillColor, fillOpacity, ...rest } = s;
    const cleaned: Record<string, unknown> = {
      ...rest,
      borderColor: '#ffffff',
      borderWidth: 1,
    };
    if (typeof color === 'string') cleaned.color = color;
    if (
      fillColor != null &&
      !(typeof fillColor === 'object' && (fillColor as Record<string, unknown>).pattern)
    ) {
      cleaned.fillColor = fillColor;
    }
    if (typeof fillOpacity === 'number') cleaned.fillOpacity = fillOpacity;
    if (Array.isArray(cleaned.data)) {
      cleaned.data = (cleaned.data as Record<string, unknown>[]).map((d) => {
        if (d && typeof d === 'object' && d.color && typeof d.color !== 'string') {
          const dCopy = { ...d };
          delete dCopy.color;
          return dCopy;
        }
        return d;
      });
    }
    return cleaned;
  }) as unknown as Highcharts.SeriesOptionsType[];

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
      animation: false,
      reflow: false,
    },
    xAxis: Array.isArray(raw.xAxis)
      ? raw.xAxis.map((x) => ({ ...xAxisDefaults, ...(x as object) }))
      : { ...xAxisDefaults, ...((raw.xAxis as object) ?? {}) },
    yAxis: raw.yAxis
      ? (Array.isArray(raw.yAxis) ? raw.yAxis : [raw.yAxis]).map((y) => ({
          ...yAxisDefaults,
          ...(y as object),
        }))
      : yAxisDefaults,
    title: { text: undefined },
    series: cleanSeries,
    plotOptions: {
      ...(raw.plotOptions ?? {}),
      series: {
        animation: false,
        ...(((raw.plotOptions as Record<string, unknown>)?.series as object) ?? {}),
      },
      column: {
        borderRadius: 6,
        borderWidth: 0,
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
}

// ── Drilldown injection ─────────────────────────────────────────

function injectDrilldown(
  options: Highcharts.Options,
  drilldown: DrilldownConfig | null | undefined,
  onPointClick: ((drillFilters: DrillFilters) => void) | undefined,
): Highcharts.Options {
  const columnMap = drilldown?.column_map;
  if (!columnMap?.length || !onPointClick) return options;

  const existingPlotOptions = (options.plotOptions ?? {}) as Record<string, unknown>;
  const existingSeriesOpts = (existingPlotOptions.series ?? {}) as Record<string, unknown>;
  const existingPointOpts = (existingSeriesOpts.point as Record<string, unknown>) ?? {};
  const existingPointEvents = (existingPointOpts.events as Record<string, unknown>) ?? {};
  const existingClickHandler = existingPointEvents.click as
    | ((this: Highcharts.Point, event: Highcharts.PointClickEventObject) => void)
    | undefined;

  return {
    ...options,
    plotOptions: {
      ...existingPlotOptions,
      series: {
        ...existingSeriesOpts,
        cursor: 'pointer',
        point: {
          ...existingPointOpts,
          events: {
            ...existingPointEvents,
            click(this: Highcharts.Point, event: Highcharts.PointClickEventObject) {
              // Preserve any existing click handler from backend config
              if (existingClickHandler) {
                existingClickHandler.call(this, event);
              }

              const filters: Record<string, unknown> = {};
              for (const { data_key } of columnMap) {
                // Special-case series.name — access the typed accessor directly
                // rather than traversing via generic property lookup on a class instance
                const value =
                  data_key === 'series.name' ? this.series?.name : getNestedValue(this, data_key);
                if (value != null) {
                  filters[data_key] = value;
                } else {
                  console.warn(
                    `[ChartWidget] drilldown data_key "${data_key}" resolved to null/undefined on point click`
                  );
                }
              }
              if (Object.keys(filters).length > 0) {
                onPointClick(filters);
              }
            },
          },
        },
      },
    },
  } as Highcharts.Options;
}

// ── Hook ────────────────────────────────────────────────────────

interface UseChartOptionsParams {
  config: ChartWidgetConfig;
  drilldown?: DrilldownConfig | null;
  onPointClick?: (drillFilters: DrillFilters) => void;
}

export function useChartOptions({ config, drilldown, onPointClick }: UseChartOptionsParams) {
  const isGantt = config.chartType === 'gantt';
  const constructorType: 'chart' | 'ganttChart' = isGantt ? 'ganttChart' : 'chart';

  const options = useMemo(() => {
    const raw = config.highchartsOptions as Highcharts.Options;
    return isGantt ? buildGanttOptions(raw) : buildStandardOptions(raw);
  }, [config.highchartsOptions, isGantt]);

  const finalOptions = useMemo(
    () => injectDrilldown(options, drilldown, onPointClick),
    [options, drilldown, onPointClick],
  );

  return { options: finalOptions, constructorType };
}
