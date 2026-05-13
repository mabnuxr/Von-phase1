import { useMemo } from 'react';
import Highcharts from 'highcharts';
import type {
  ChartWidgetConfig,
  DrilldownV2ColumnMapping,
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

  // Smart tooltip: read each series' ``dataLabels.format`` and apply it
  // to the hover value so the tooltip mirrors what's printed on the bar
  // (e.g. "$447,500" rather than the raw "447500"). Highcharts'
  // ``pointFormatter`` takes precedence over ``pointFormat`` when both
  // are set, so this overrides any agent-authored
  // ``tooltip.pointFormat: "<b>{point.y}</b>"`` template that ships
  // raw values.
  //
  // Falls back to ``Number.toLocaleString()`` when no ``dataLabels.format``
  // is declared on the series. Non-numeric ``point.y`` (categorical
  // labels) passes through verbatim. Dot-glyph color matches Highcharts'
  // default tooltip styling so the visual is unchanged besides the value.
  const smartPointFormatter = function (
    this: Highcharts.Point & {
      series: Highcharts.Series & {
        options: { dataLabels?: { format?: string } | Array<{ format?: string }> };
      };
    }
  ): string {
    const seriesName = this.series?.name ?? '';
    const colorAny = (this as unknown as { color?: unknown }).color;
    const color =
      typeof colorAny === 'string'
        ? colorAny
        : (this.series as unknown as { color?: string })?.color || '#7c3aed';
    const dl = this.series?.options?.dataLabels;
    const dlFormat = Array.isArray(dl) ? dl[0]?.format : dl?.format;
    let valueStr: string;
    if (typeof this.y !== 'number' || !Number.isFinite(this.y)) {
      valueStr = String(this.y ?? '');
    } else if (dlFormat && typeof dlFormat === 'string') {
      try {
        valueStr = Highcharts.format(
          dlFormat,
          { point: this, series: this.series, value: this.y },
          undefined
        );
      } catch {
        valueStr = this.y.toLocaleString();
      }
    } else {
      valueStr = this.y.toLocaleString();
    }
    return `<span style="color:${color}">●</span> ${seriesName}: <b>${valueStr}</b><br/>`;
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
    tooltip: {
      ...(BASE_CHART_OPTIONS.tooltip ?? {}),
      ...((raw.tooltip ?? {}) as object),
      pointFormatter: smartPointFormatter,
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
 * Resolve the effective column_map for a chart's point click.
 *
 * Chart parent clicks always live at L0 = ``levels[0]`` of the pyramid.
 * Read its default variant's column_map to find which Highcharts
 * properties map to which SQL columns. Deeper levels are unreachable
 * from a widget click; descent happens via the drilldown panel UI.
 */
function resolveEffectiveColumnMap(
  drilldownV2: PanelDrilldownV2 | null | undefined
): DrilldownV2ColumnMapping[] {
  const l0 = drilldownV2?.levels?.[0];
  if (!l0?.variants?.length) return [];
  const defaultVariant = l0.variants.find((v) => v.is_default) ?? l0.variants[0];
  return defaultVariant?.column_map ?? [];
}

function injectDrilldown(
  options: Highcharts.Options,
  drilldownV2: PanelDrilldownV2 | null | undefined,
  onPointClick: ((drillFilters: DrillFilters, metricValue?: unknown) => void) | undefined
): Highcharts.Options {
  const columnMap = resolveEffectiveColumnMap(drilldownV2);
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
                // Capture the metric value behind this point so the drill
                // breadcrumb can show "Stage: Negotiation ($47K)" instead
                // of just "Stage: Negotiation". Highcharts stores the
                // numeric value at ``point.y`` for cartesian + pie series;
                // Sankey and similar weighted-edge series surface it as
                // ``point.weight``. We pull whichever is non-null.
                //
                // Format the numeric so the breadcrumb mirrors what the
                // user actually sees on the chart — matching the
                // KPI/table affordance.
                //
                // Highcharts charts expose three different formatting
                // templates, each with different reach:
                //   - ``series.dataLabels.format`` — what the per-bar /
                //     per-point labels render. Templates like
                //     ``"${point.y:,.0f}"`` produce ``"$80,000"``. When
                //     the agent enabled data labels, this is the most
                //     user-visible format because the bar literally
                //     shows it.
                //   - ``yAxis.labels.format`` — y-axis tick labels
                //     (e.g. ``"200k"``). Often unset; Highcharts uses
                //     k/M auto-abbreviation by default.
                //   - ``tooltip.pointFormat`` — hover tooltip body.
                //     Often ``<b>{point.y}</b>`` (raw), which is why
                //     the tooltip can show an unformatted value while
                //     the bar shows a formatted one.
                //
                // Resolution order: dataLabels.format → yAxis labels
                // (string format or function formatter) → toLocaleString.
                // ``Highcharts.format`` evaluates the template string
                // against ``{point, series, value}`` so both
                // ``{point.y:,.0f}`` and ``{value:,.0f}`` resolve.
                //
                // Non-numeric points (categorical labels) pass through
                // verbatim.
                const point = this as unknown as {
                  y?: unknown;
                  weight?: unknown;
                  value?: unknown;
                  series?: {
                    options?: {
                      dataLabels?: { format?: string } | Array<{ format?: string }>;
                    };
                    yAxis?: {
                      options?: {
                        labels?: {
                          format?: string;
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter?: (this: any) => string;
                        };
                      };
                    };
                  };
                };
                const rawValue = point.y ?? point.weight ?? point.value ?? null;
                let metricValue: unknown = rawValue;
                if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
                  const dl = point.series?.options?.dataLabels;
                  const dlFormat = Array.isArray(dl) ? dl[0]?.format : dl?.format;
                  const axisLabels = point.series?.yAxis?.options?.labels;
                  try {
                    if (dlFormat && typeof dlFormat === 'string') {
                      metricValue = Highcharts.format(
                        dlFormat,
                        { point, series: point.series, value: rawValue },
                        undefined
                      );
                    } else if (axisLabels?.format && typeof axisLabels.format === 'string') {
                      metricValue = Highcharts.format(
                        axisLabels.format,
                        { value: rawValue },
                        undefined
                      );
                    } else if (typeof axisLabels?.formatter === 'function') {
                      metricValue = axisLabels.formatter.call({
                        value: rawValue,
                        axis: point.series?.yAxis,
                      });
                    } else {
                      metricValue = rawValue.toLocaleString();
                    }
                  } catch {
                    metricValue = rawValue.toLocaleString();
                  }
                }
                onPointClick(filters, metricValue);
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
  drilldownV2?: PanelDrilldownV2 | null;
  onPointClick?: (drillFilters: DrillFilters) => void;
}

export function useChartOptions({ config, drilldownV2, onPointClick }: UseChartOptionsParams) {
  const isGantt = config.chartType === 'gantt';
  const constructorType: 'chart' | 'ganttChart' = isGantt ? 'ganttChart' : 'chart';

  const options = useMemo(() => {
    const raw = config.highchartsOptions as Highcharts.Options;
    return isGantt ? buildGanttOptions(raw) : buildStandardOptions(raw);
  }, [config.highchartsOptions, isGantt]);

  const finalOptions = useMemo(
    () => injectDrilldown(options, drilldownV2, onPointClick),
    [options, drilldownV2, onPointClick]
  );

  return { options: finalOptions, constructorType };
}
