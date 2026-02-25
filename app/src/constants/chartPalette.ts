import type {
  WidgetConfig,
  TableWidgetConfig,
  TableColumn,
} from "../types/dashboard";

// ─── Color Constants ────────────────────────────────────────────

/**
 * Professional color palette for chart visualizations.
 * Frontend owns the palette — backend sends only widget config + data, no colors.
 * Highcharts uses the `colors` array to auto-assign colors to series and data points.
 */
export const CHART_PALETTE = [
  "#8039e9", // purple (primary brand)
  "#FF9042", // orange
  "#0071e3", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // deep orange
];

export const SPARKLINE_COLOR = CHART_PALETTE[0];

const CHART_BG = "transparent";
const AXIS_LABEL_COLOR = "#6b7280";

/** Ordered worst → best for threshold-based indicators (colorScale, progressBar). */
const THRESHOLD_COLORS = ["#ef4444", "#f59e0b", "#10b981"]; // red → amber → green

const BADGE_TEXT_COLOR = "#fff";

const ROW_SENTIMENT_BG: Record<string, string> = {
  positive: "#f0fdf4",
  negative: "#fef2f2",
  neutral: "#f9fafb",
};

// ─── Helpers ────────────────────────────────────────────────────

function hasNamedDataPoints(series: { data?: unknown[] }): boolean {
  return (
    Array.isArray(series.data) &&
    series.data.some((d) => typeof d === "object" && d !== null && "name" in d)
  );
}

/** Deep-merge axis label color into an axis config object. */
function injectAxisLabelColor(
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

function applyChartTheme(
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

function applyColumnColors(col: TableColumn): TableColumn {
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

function applyTableTheme(config: TableWidgetConfig): TableWidgetConfig {
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
export function applyChartPalette(
  widgets: Record<string, WidgetConfig>,
): Record<string, WidgetConfig> {
  const result: Record<string, WidgetConfig> = {};

  for (const [key, widget] of Object.entries(widgets)) {
    if (widget.type === "chart") {
      const config = widget.config as {
        highchartsOptions: Record<string, unknown>;
        [k: string]: unknown;
      };
      result[key] = {
        ...widget,
        config: {
          ...config,
          highchartsOptions: applyChartTheme(config.highchartsOptions),
        },
      };
    } else if (widget.type === "counter") {
      result[key] = {
        ...widget,
        config: { ...widget.config, accentColor: SPARKLINE_COLOR },
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
