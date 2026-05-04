import { useMemo } from 'react';
import type Highcharts from 'highcharts';
import type {
  ChartWidgetConfig,
  DrilldownConfig,
  DrilldownColumnMapping,
  DrillFilters,
  PanelDrilldownV2,
} from '../types';

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
    ...raw,
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
      ...((raw.tooltip ?? {}) as object),
    },
    plotOptions: {
      ...((raw.plotOptions ?? {}) as object),
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

/**
 * Resolve the effective column_map for a chart's point click — V2 (when
 * present) takes precedence over the legacy V1 ``drilldown.column_map`` so
 * V2-authored panels keep V1-style "click a bar to filter by stage"
 * behavior.
 *
 * For V2 the column_map is read off ``levels[0]``'s default variant. Deeper
 * levels are descended into via the drilldown panel UI, not via widget point
 * clicks — every chart click always opens drilldown at depth 0.
 */
function resolveEffectiveColumnMap(
  drilldown: DrilldownConfig | null | undefined,
  drilldownV2: PanelDrilldownV2 | null | undefined
): DrilldownColumnMapping[] {
  // V2 pyramid model: chart parent clicks always live at L0 = levels[0].
  // Read its default variant's column_map to find which Highcharts properties
  // map to which SQL columns. Deeper levels are unreachable from a widget click;
  // descent happens via the drilldown panel UI.
  const l0 = drilldownV2?.levels?.[0];
  if (l0?.variants?.length) {
    const defaultVariant = l0.variants.find((v) => v.is_default) ?? l0.variants[0];
    if (defaultVariant?.column_map?.length) {
      return defaultVariant.column_map;
    }
  }
  return drilldown?.column_map ?? [];
}

function injectDrilldown(
  options: Highcharts.Options,
  drilldown: DrilldownConfig | null | undefined,
  drilldownV2: PanelDrilldownV2 | null | undefined,
  onPointClick: ((drillFilters: DrillFilters) => void) | undefined
): Highcharts.Options {
  const columnMap = resolveEffectiveColumnMap(drilldown, drilldownV2);
  if (!columnMap.length || !onPointClick) return options;

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

              // Resolve each column_map entry against the click event:
              //  - If `extract_from` is set, read from that Highcharts property
              //    path (the V2 unified-data_key shape — `data_key` is the SQL
              //    column name, `extract_from` is the bridge to the click event).
              //  - Otherwise fall back to looking up `data_key` as a path on the
              //    point. This handles V1 dashboards where data_key was a
              //    dotted Highcharts path like `point.name` directly, AND L1+
              //    cell clicks where data_key matches a result-row column name.
              //
              // Robustness fallback: when ``extract_from`` is ``point.name`` or
              // ``point.x`` and resolves to undefined, fall back to
              // ``point.category``. Highcharts only populates ``point.name`` when
              // the data array uses the explicit shape ``[{name, y}, ...]``.
              // For the common categorical-bar pattern (``data: [71, 9]`` + the
              // labels living on ``xAxis.categories``), Highcharts leaves
              // ``point.name`` undefined but always sets ``point.category`` to
              // the category label. Falling back here keeps drill clicks
              // working for both data shapes without requiring sub-agent prompt
              // perfection.
              // Emit the filter keyed by `data_key` (single-namespace at the wire).
              const filters: Record<string, unknown> = {};
              const lookupPointValue = (lookupPath: string): unknown => {
                if (lookupPath === 'series.name') {
                  return this.series?.name;
                }
                const direct = getNestedValue(this, lookupPath);
                if (direct != null) return direct;
                // Category-axis fallback for the common bar/column shape
                if (lookupPath === 'point.name' || lookupPath === 'point.x') {
                  const cat = (this as unknown as { category?: unknown }).category;
                  if (cat != null) return cat;
                }
                return direct;
              };
              for (const cm of columnMap) {
                const lookupPath = cm.extract_from || cm.data_key;
                const value = lookupPointValue(lookupPath);
                if (value != null) {
                  filters[cm.data_key] = value;
                } else {
                  console.warn(
                    `[ChartWidget] drilldown data_key "${cm.data_key}" (lookup "${lookupPath}") resolved to null/undefined on point click`
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
  drilldownV2?: PanelDrilldownV2 | null;
  onPointClick?: (drillFilters: DrillFilters) => void;
}

export function useChartOptions({
  config,
  drilldown,
  drilldownV2,
  onPointClick,
}: UseChartOptionsParams) {
  const isGantt = config.chartType === 'gantt';
  const constructorType: 'chart' | 'ganttChart' = isGantt ? 'ganttChart' : 'chart';

  const options = useMemo(() => {
    const raw = config.highchartsOptions as Highcharts.Options;
    return isGantt ? buildGanttOptions(raw) : buildStandardOptions(raw);
  }, [config.highchartsOptions, isGantt]);

  const finalOptions = useMemo(
    () => injectDrilldown(options, drilldown, drilldownV2, onPointClick),
    [options, drilldown, drilldownV2, onPointClick]
  );

  return { options: finalOptions, constructorType };
}
