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

export const CHART_BG = "transparent";
export const AXIS_LABEL_COLOR = "#6b7280";

/** Ordered worst → best for threshold-based indicators (colorScale, progressBar). */
export const THRESHOLD_COLORS = ["#ef4444", "#f59e0b", "#10b981"]; // red → amber → green

export const BADGE_TEXT_COLOR = "#fff";

export const ROW_SENTIMENT_BG: Record<string, string> = {
  positive: "#f0fdf4",
  negative: "#fef2f2",
  neutral: "#f9fafb",
};
