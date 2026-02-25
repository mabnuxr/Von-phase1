import { describe, it, expect } from "vitest";
import type {
  WidgetConfig,
  ChartWidgetConfig,
  CounterWidgetConfig,
  TableWidgetConfig,
} from "../../types/dashboard";
import {
  CHART_PALETTE,
  SPARKLINE_COLOR,
  CHART_BG,
  AXIS_LABEL_COLOR,
  THRESHOLD_COLORS,
  BADGE_TEXT_COLOR,
  ROW_SENTIMENT_BG,
} from "../../constants/chartPalette";
import {
  hasNamedDataPoints,
  injectAxisLabelColor,
  applyChartTheme,
  applyColumnColors,
  applyTableTheme,
  applyWidgetTheme,
} from "../applyWidgetTheme";

// ─── hasNamedDataPoints ─────────────────────────────────────────

describe("hasNamedDataPoints", () => {
  it("returns true when data contains objects with a name key", () => {
    expect(
      hasNamedDataPoints({
        data: [
          { name: "A", y: 10 },
          { name: "B", y: 20 },
        ],
      }),
    ).toBe(true);
  });

  it("returns false for plain numeric arrays", () => {
    expect(hasNamedDataPoints({ data: [10, 20, 30] })).toBe(false);
  });

  it("returns false for tuple arrays", () => {
    expect(
      hasNamedDataPoints({
        data: [
          ["Jan", 10],
          ["Feb", 20],
        ],
      }),
    ).toBe(false);
  });

  it("returns false when data is undefined", () => {
    expect(hasNamedDataPoints({})).toBe(false);
  });

  it("returns false for empty data array", () => {
    expect(hasNamedDataPoints({ data: [] })).toBe(false);
  });

  it("returns true even if only some points have name", () => {
    expect(hasNamedDataPoints({ data: [10, { name: "A", y: 20 }] })).toBe(true);
  });
});

// ─── injectAxisLabelColor ───────────────────────────────────────

describe("injectAxisLabelColor", () => {
  it("adds label color to an axis with no labels", () => {
    const result = injectAxisLabelColor({ categories: ["A", "B"] });
    expect(result).toEqual({
      categories: ["A", "B"],
      labels: { style: { color: AXIS_LABEL_COLOR } },
    });
  });

  it("preserves existing label styles and adds color", () => {
    const result = injectAxisLabelColor({
      categories: ["A"],
      labels: { style: { fontSize: "12px" } },
    });
    expect(result).toEqual({
      categories: ["A"],
      labels: { style: { fontSize: "12px", color: AXIS_LABEL_COLOR } },
    });
  });

  it("preserves existing label properties beyond style", () => {
    const result = injectAxisLabelColor({
      labels: { rotation: -45, style: { fontSize: "11px" } },
    });
    expect(result).toEqual({
      labels: {
        rotation: -45,
        style: { fontSize: "11px", color: AXIS_LABEL_COLOR },
      },
    });
  });

  it("overwrites existing color with the palette color", () => {
    const result = injectAxisLabelColor({
      labels: { style: { color: "#ff0000" } },
    });
    expect(result.labels as Record<string, unknown>).toEqual({
      style: { color: AXIS_LABEL_COLOR },
    });
  });
});

// ─── applyChartTheme ────────────────────────────────────────────

describe("applyChartTheme", () => {
  it("injects backgroundColor, colors, and axis label colors", () => {
    const result = applyChartTheme({
      chart: { type: "line" },
      xAxis: { categories: ["Q1", "Q2"] },
      yAxis: [{ title: { text: "Revenue" } }],
      series: [{ name: "Revenue", data: [100, 200] }],
    });

    expect(result.chart).toEqual({
      type: "line",
      backgroundColor: CHART_BG,
    });
    expect(result.colors).toEqual(CHART_PALETTE);

    const xAxis = result.xAxis as Record<string, unknown>;
    expect(
      (
        (xAxis.labels as Record<string, unknown>).style as Record<
          string,
          string
        >
      ).color,
    ).toBe(AXIS_LABEL_COLOR);

    const yAxis = result.yAxis as Array<Record<string, unknown>>;
    expect(
      (
        (yAxis[0].labels as Record<string, unknown>).style as Record<
          string,
          string
        >
      ).color,
    ).toBe(AXIS_LABEL_COLOR);
  });

  it("does not add xAxis/yAxis keys when they are absent", () => {
    const result = applyChartTheme({
      chart: { type: "pie" },
      series: [{ name: "A", data: [{ name: "X", y: 10 }] }],
    });

    expect(result).not.toHaveProperty("xAxis");
    expect(result).not.toHaveProperty("yAxis");
  });

  it("sets colorByPoint for series with named data points", () => {
    const result = applyChartTheme({
      chart: { type: "column" },
      series: [
        {
          name: "Pipeline",
          data: [
            { name: "Prospecting", y: 100 },
            { name: "Discovery", y: 200 },
          ],
        },
      ],
    });

    const series = result.series as Array<Record<string, unknown>>;
    expect(series[0].colorByPoint).toBe(true);
  });

  it("does not set colorByPoint for plain numeric data", () => {
    const result = applyChartTheme({
      chart: { type: "line" },
      series: [{ name: "MRR", data: [100, 200, 300] }],
    });

    const series = result.series as Array<Record<string, unknown>>;
    expect(series[0]).not.toHaveProperty("colorByPoint");
  });

  it("does not override existing colorByPoint", () => {
    const result = applyChartTheme({
      chart: { type: "column" },
      series: [
        {
          name: "Pipeline",
          colorByPoint: true,
          data: [{ name: "A", y: 10 }],
        },
      ],
    });

    const series = result.series as Array<Record<string, unknown>>;
    expect(series[0].colorByPoint).toBe(true);
  });

  it("preserves other highcharts options", () => {
    const result = applyChartTheme({
      chart: { type: "bar" },
      tooltip: { shared: true },
      legend: { enabled: false },
      credits: { enabled: false },
      series: [{ name: "X", data: [1] }],
    });

    expect(result.tooltip).toEqual({ shared: true });
    expect(result.legend).toEqual({ enabled: false });
    expect(result.credits).toEqual({ enabled: false });
  });
});

// ─── applyColumnColors ──────────────────────────────────────────

describe("applyColumnColors", () => {
  it("returns column unchanged if it has no format", () => {
    const col = {
      id: "c1",
      field: "name",
      header: "Name",
      dataType: "string" as const,
    };
    expect(applyColumnColors(col)).toEqual(col);
  });

  it("assigns badge colors from palette", () => {
    const col = applyColumnColors({
      id: "c1",
      field: "team",
      header: "Team",
      dataType: "string",
      format: {
        badge: {
          mapping: {
            Enterprise: {},
            "Mid-Market": {},
            SMB: {},
          },
        },
      },
    });

    const mapping = col.format!.badge!.mapping;
    expect(mapping.Enterprise).toEqual({
      color: BADGE_TEXT_COLOR,
      backgroundColor: CHART_PALETTE[0],
    });
    expect(mapping["Mid-Market"]).toEqual({
      color: BADGE_TEXT_COLOR,
      backgroundColor: CHART_PALETTE[1],
    });
    expect(mapping.SMB).toEqual({
      color: BADGE_TEXT_COLOR,
      backgroundColor: CHART_PALETTE[2],
    });
  });

  it("does not override pre-existing badge colors", () => {
    const col = applyColumnColors({
      id: "c1",
      field: "team",
      header: "Team",
      dataType: "string",
      format: {
        badge: {
          mapping: {
            Custom: { color: "#000", backgroundColor: "#e0e7ff" },
          },
        },
      },
    });

    expect(col.format!.badge!.mapping.Custom).toEqual({
      color: "#000",
      backgroundColor: "#e0e7ff",
    });
  });

  it("assigns colorScale threshold colors in order", () => {
    const col = applyColumnColors({
      id: "c1",
      field: "quota",
      header: "Quota",
      dataType: "percentage",
      format: {
        colorScale: {
          type: "threshold",
          thresholds: [
            { value: 60, label: "Below" },
            { value: 90, label: "Near" },
            { value: 200, label: "Above" },
          ],
        },
      },
    });

    const thresholds = col.format!.colorScale!.thresholds!;
    expect(thresholds[0].color).toBe(THRESHOLD_COLORS[0]); // red
    expect(thresholds[1].color).toBe(THRESHOLD_COLORS[1]); // amber
    expect(thresholds[2].color).toBe(THRESHOLD_COLORS[2]); // green
  });

  it("assigns progressBar threshold colors in order", () => {
    const col = applyColumnColors({
      id: "c1",
      field: "probability",
      header: "Prob %",
      dataType: "percentage",
      format: {
        progressBar: {
          maxValue: 100,
          colorThresholds: [{ value: 30 }, { value: 60 }, { value: 100 }],
        },
      },
    });

    const thresholds = col.format!.progressBar!.colorThresholds;
    expect(thresholds[0].color).toBe(THRESHOLD_COLORS[0]);
    expect(thresholds[1].color).toBe(THRESHOLD_COLORS[1]);
    expect(thresholds[2].color).toBe(THRESHOLD_COLORS[2]);
  });

  it("does not override pre-existing threshold colors", () => {
    const col = applyColumnColors({
      id: "c1",
      field: "quota",
      header: "Quota",
      dataType: "percentage",
      format: {
        colorScale: {
          type: "threshold",
          thresholds: [{ value: 50, color: "#custom", label: "Half" }],
        },
      },
    });

    expect(col.format!.colorScale!.thresholds![0].color).toBe("#custom");
  });
});

// ─── applyTableTheme ────────────────────────────────────────────

describe("applyTableTheme", () => {
  it("applies column colors and row sentiment backgrounds", () => {
    const config: TableWidgetConfig = {
      columns: [
        { id: "c1", field: "name", header: "Name", dataType: "string" },
      ],
      rowStyles: [
        {
          condition: { field: "score", operator: "gte", value: 100 },
          sentiment: "positive",
          style: {},
        },
        {
          condition: { field: "days", operator: "gt", value: 30 },
          sentiment: "negative",
          style: {},
        },
      ],
    };

    const result = applyTableTheme(config);
    expect(result.rowStyles![0].style.backgroundColor).toBe(
      ROW_SENTIMENT_BG.positive,
    );
    expect(result.rowStyles![1].style.backgroundColor).toBe(
      ROW_SENTIMENT_BG.negative,
    );
  });

  it("defaults to neutral sentiment when no sentiment is specified", () => {
    const config: TableWidgetConfig = {
      columns: [],
      rowStyles: [
        {
          condition: { field: "x", operator: "eq", value: 1 },
          style: {},
        },
      ],
    };

    const result = applyTableTheme(config);
    expect(result.rowStyles![0].style.backgroundColor).toBe(
      ROW_SENTIMENT_BG.neutral,
    );
  });

  it("does not override pre-existing row backgroundColor", () => {
    const config: TableWidgetConfig = {
      columns: [],
      rowStyles: [
        {
          condition: { field: "x", operator: "eq", value: 1 },
          sentiment: "positive",
          style: { backgroundColor: "#custom" },
        },
      ],
    };

    const result = applyTableTheme(config);
    expect(result.rowStyles![0].style.backgroundColor).toBe("#custom");
  });

  it("preserves non-color style properties", () => {
    const config: TableWidgetConfig = {
      columns: [],
      rowStyles: [
        {
          condition: { field: "x", operator: "gte", value: 80 },
          sentiment: "positive",
          style: { fontWeight: "600" },
        },
      ],
    };

    const result = applyTableTheme(config);
    expect(result.rowStyles![0].style.fontWeight).toBe("600");
    expect(result.rowStyles![0].style.backgroundColor).toBe(
      ROW_SENTIMENT_BG.positive,
    );
  });

  it("returns config unchanged when there are no rowStyles", () => {
    const config: TableWidgetConfig = {
      columns: [
        { id: "c1", field: "name", header: "Name", dataType: "string" },
      ],
    };

    const result = applyTableTheme(config);
    expect(result.rowStyles).toBeUndefined();
  });
});

// ─── applyWidgetTheme (integration) ─────────────────────────────

describe("applyWidgetTheme", () => {
  it("themes chart widgets", () => {
    const widgets: Record<string, WidgetConfig> = {
      w1: {
        id: "w1",
        type: "chart",
        title: "Revenue",
        config: {
          chartType: "line",
          highchartsOptions: {
            chart: { type: "line" },
            title: { text: null },
            series: [{ name: "MRR", data: [100, 200] }],
          },
        },
      },
    };

    const result = applyWidgetTheme(widgets);
    const chartConfig = result.w1.config as ChartWidgetConfig;
    const hcOptions = chartConfig.highchartsOptions as unknown as Record<
      string,
      unknown
    >;

    expect(hcOptions.colors).toEqual(CHART_PALETTE);
    expect((hcOptions.chart as Record<string, unknown>).backgroundColor).toBe(
      CHART_BG,
    );
  });

  it("themes counter widgets with accent color", () => {
    const widgets: Record<string, WidgetConfig> = {
      w1: {
        id: "w1",
        type: "counter",
        title: "ARR",
        config: {
          value: 1000,
          format: "currency",
          sparkline: { data: [1, 2, 3], type: "line" },
        },
      },
    };

    const result = applyWidgetTheme(widgets);
    const counterConfig = result.w1.config as CounterWidgetConfig;
    expect(counterConfig.accentColor).toBe(SPARKLINE_COLOR);
  });

  it("themes table widgets", () => {
    const widgets: Record<string, WidgetConfig> = {
      w1: {
        id: "w1",
        type: "table",
        title: "Deals",
        config: {
          columns: [
            {
              id: "c1",
              field: "stage",
              header: "Stage",
              dataType: "string",
              format: {
                badge: { mapping: { Open: {}, Closed: {} } },
              },
            },
          ],
          rowStyles: [
            {
              condition: { field: "score", operator: "gte", value: 80 },
              sentiment: "positive",
              style: {},
            },
          ],
        },
      },
    };

    const result = applyWidgetTheme(widgets);
    const config = result.w1.config as TableWidgetConfig;

    // Badge colors assigned
    expect(config.columns[0].format!.badge!.mapping.Open.backgroundColor).toBe(
      CHART_PALETTE[0],
    );
    expect(
      config.columns[0].format!.badge!.mapping.Closed.backgroundColor,
    ).toBe(CHART_PALETTE[1]);

    // Row sentiment
    expect(config.rowStyles![0].style.backgroundColor).toBe(
      ROW_SENTIMENT_BG.positive,
    );
  });

  it("passes through text widgets unchanged", () => {
    const widgets: Record<string, WidgetConfig> = {
      w1: {
        id: "w1",
        type: "text",
        title: "Header",
        config: { content: "Hello", variant: "heading" },
      },
    };

    const result = applyWidgetTheme(widgets);
    expect(result.w1).toEqual(widgets.w1);
  });

  it("handles empty widget map", () => {
    expect(applyWidgetTheme({})).toEqual({});
  });

  it("handles mixed widget types in a single call", () => {
    const widgets: Record<string, WidgetConfig> = {
      chart: {
        id: "chart",
        type: "chart",
        title: "C",
        config: {
          chartType: "bar",
          highchartsOptions: {
            chart: { type: "bar" },
            title: { text: null },
            series: [{ name: "X", data: [1] }],
          },
        },
      },
      counter: {
        id: "counter",
        type: "counter",
        title: "K",
        config: { value: 42, format: "number" },
      },
      text: {
        id: "text",
        type: "text",
        title: "T",
        config: { content: "Hi", variant: "body" },
      },
      table: {
        id: "table",
        type: "table",
        title: "Tbl",
        config: { columns: [] },
      },
    };

    const result = applyWidgetTheme(widgets);

    // Chart has palette
    const chartConfig = result.chart.config as ChartWidgetConfig;
    const hcOptions = chartConfig.highchartsOptions as unknown as Record<
      string,
      unknown
    >;
    expect(hcOptions.colors).toEqual(CHART_PALETTE);

    // Counter has accent
    const counterConfig = result.counter.config as CounterWidgetConfig;
    expect(counterConfig.accentColor).toBe(SPARKLINE_COLOR);

    // Text unchanged
    expect(result.text).toEqual(widgets.text);

    // Table processed (columns array still empty)
    expect((result.table.config as TableWidgetConfig).columns).toEqual([]);
  });
});
