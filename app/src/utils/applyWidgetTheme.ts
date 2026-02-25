import type {
  WidgetConfig,
  ChartWidgetConfig,
  CounterWidgetConfig,
  TableWidgetConfig,
  TableColumn,
} from "../types/dashboard";
import {
  CHART_PALETTE,
  SPARKLINE_COLOR,
  CHART_BG,
  AXIS_LABEL_COLOR,
  THRESHOLD_COLORS,
  BADGE_TEXT_COLOR,
  ROW_SENTIMENT_BG,
} from "../constants/chartPalette";

// ─── Helpers ────────────────────────────────────────────────────

export function hasNamedDataPoints(series: { data?: unknown[] }): boolean {
  return (
    Array.isArray(series.data) &&
    series.data.some((d) => typeof d === "object" && d !== null && "name" in d)
  );
}

/** Deep-merge axis label color into an axis config object. */
export function injectAxisLabelColor(
  axis: Record<string, unknown>,
): Record<string, unknown> {
  const labels = (axis.labels ?? {}) as Record<string, unknown>;
  const style = (labels.style ?? {}) as Record<string, string>;
  return {
    ...axis,
    labels: { ...labels, style: { ...style, color: AXIS_LABEL_COLOR } },
  };
}

// ─── Chart Theme ────────────────────────────────────────────────

export function applyChartTheme(
  hcOptions: Record<string, unknown>,
): Record<string, unknown> {
  const chart = (hcOptions.chart ?? {}) as Record<string, unknown>;

  // Inject axis label colors
  const xAxis = hcOptions.xAxis as Record<string, unknown> | undefined;
  const yAxis = hcOptions.yAxis as Array<Record<string, unknown>> | undefined;

  // Auto-detect series that need colorByPoint
  const series = hcOptions.series as Array<Record<string, unknown>> | undefined;
  const patchedSeries = series?.map((s) => {
    if (hasNamedDataPoints(s as { data?: unknown[] }) && !s.colorByPoint) {
      return { ...s, colorByPoint: true };
    }
    return s;
  });

  return {
    ...hcOptions,
    chart: { ...chart, backgroundColor: CHART_BG },
    colors: CHART_PALETTE,
    ...(xAxis ? { xAxis: injectAxisLabelColor(xAxis) } : {}),
    ...(yAxis ? { yAxis: yAxis.map((y) => injectAxisLabelColor(y)) } : {}),
    ...(patchedSeries ? { series: patchedSeries } : {}),
  };
}

// ─── Table Theme ────────────────────────────────────────────────

export function applyColumnColors(col: TableColumn): TableColumn {
  if (!col.format) return col;
  const format = { ...col.format };

  // Badge: assign palette colors per badge key
  if (format.badge) {
    let idx = 0;
    const mapping: typeof format.badge.mapping = {};
    for (const [key, val] of Object.entries(format.badge.mapping)) {
      mapping[key] = {
        ...val,
        color: val.color ?? BADGE_TEXT_COLOR,
        backgroundColor:
          val.backgroundColor ?? CHART_PALETTE[idx % CHART_PALETTE.length],
      };
      idx++;
    }
    format.badge = { mapping };
  }

  // ColorScale thresholds: assign red → amber → green
  if (format.colorScale?.thresholds) {
    format.colorScale = {
      ...format.colorScale,
      thresholds: format.colorScale.thresholds.map((t, i) => ({
        ...t,
        color: t.color ?? THRESHOLD_COLORS[i % THRESHOLD_COLORS.length],
      })),
    };
  }

  // ProgressBar thresholds: same pattern
  if (format.progressBar?.colorThresholds) {
    format.progressBar = {
      ...format.progressBar,
      colorThresholds: format.progressBar.colorThresholds.map((t, i) => ({
        ...t,
        color: t.color ?? THRESHOLD_COLORS[i % THRESHOLD_COLORS.length],
      })),
    };
  }

  return { ...col, format };
}

export function applyTableTheme(config: TableWidgetConfig): TableWidgetConfig {
  const columns = config.columns.map(applyColumnColors);

  const rowStyles = config.rowStyles?.map((rs) => ({
    ...rs,
    style: {
      ...rs.style,
      backgroundColor:
        rs.style.backgroundColor ?? ROW_SENTIMENT_BG[rs.sentiment ?? "neutral"],
    },
  }));

  return { ...config, columns, ...(rowStyles ? { rowStyles } : {}) };
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Injects the frontend color palette into all widget configurations.
 * - Chart widgets: background, axis labels, series colors, colorByPoint
 * - Counter widgets: sparkline accent color
 * - Table widgets: badge colors, threshold colors, row highlight colors
 */
export function applyWidgetTheme(
  widgets: Record<string, WidgetConfig>,
): Record<string, WidgetConfig> {
  const result: Record<string, WidgetConfig> = {};

  for (const [key, widget] of Object.entries(widgets)) {
    if (widget.type === "chart") {
      const chartConfig = widget.config as ChartWidgetConfig;
      const hcOptions = chartConfig.highchartsOptions as unknown as Record<
        string,
        unknown
      >;
      result[key] = {
        ...widget,
        config: {
          ...chartConfig,
          highchartsOptions: applyChartTheme(hcOptions),
        } as unknown as ChartWidgetConfig,
      };
    } else if (widget.type === "counter") {
      const counterConfig = widget.config as CounterWidgetConfig;
      result[key] = {
        ...widget,
        config: { ...counterConfig, accentColor: SPARKLINE_COLOR },
      };
    } else if (widget.type === "table") {
      result[key] = {
        ...widget,
        config: applyTableTheme(widget.config as TableWidgetConfig),
      };
    } else {
      result[key] = widget;
    }
  }

  return result;
}
