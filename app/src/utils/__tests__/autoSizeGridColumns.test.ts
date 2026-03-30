import { describe, it, expect } from "vitest";
import type { GridOptions } from "@highcharts/grid-lite-react";
import {
  autoSizeGridColumns,
  buildGridOptions,
} from "@vonlabs/design-components";
import type { ReportColumn } from "@vonlabs/design-components";

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Backend-style gridOptions using deprecated `dataTable` (still sent by API) */
function makeGridOptions(
  columns: Array<{ id: string; width?: number }>,
  dataColumns: Record<string, unknown[]>,
): GridOptions {
  return {
    columns: columns.map((c) => ({
      id: c.id,
      ...(c.width !== undefined ? { width: c.width } : {}),
      sorting: { enabled: true },
    })),
    dataTable: { columns: dataColumns },
  } as GridOptions;
}

/** New-style gridOptions using `data.columns` (Grid Lite local data provider) */
function makeNewFormatGridOptions(
  columns: Array<{ id: string; width?: number }>,
  dataColumns: Record<string, unknown[]>,
): GridOptions {
  return {
    columns: columns.map((c) => ({
      id: c.id,
      ...(c.width !== undefined ? { width: c.width } : {}),
      sorting: { enabled: true },
    })),
    data: { columns: dataColumns },
  } as GridOptions;
}

// ─── autoSizeGridColumns ──────────────────────────────────────────────────

describe("autoSizeGridColumns", () => {
  it("assigns widths to columns that have no explicit width", () => {
    const opts = makeGridOptions([{ id: "name" }, { id: "amount" }], {
      name: ["Alice", "Bob", "Charlie"],
      amount: [100, 25000, 500],
    });

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBeTypeOf("number");
    expect(cols[0].width).toBeGreaterThan(0);
    expect(cols[1].width).toBeTypeOf("number");
    expect(cols[1].width).toBeGreaterThan(0);
  });

  it("does not override columns that already have an explicit width", () => {
    const opts = makeGridOptions(
      [{ id: "name", width: 200 }, { id: "status" }],
      {
        name: ["Alice", "Bob"],
        status: ["Active", "Inactive"],
      },
    );

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBe(200); // preserved
    expect(cols[1].width).toBeTypeOf("number");
    expect(cols[1].width).not.toBe(200);
  });

  it("caps column width at 280px maximum", () => {
    const longValue = "A".repeat(200); // very long string
    const opts = makeGridOptions([{ id: "description" }], {
      description: [longValue],
    });

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBeLessThanOrEqual(280);
  });

  it("enforces a minimum width of 80px", () => {
    const opts = makeGridOptions(
      [{ id: "x" }],
      { x: ["a"] }, // very short content
    );

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBeGreaterThanOrEqual(80);
  });

  it("wider content produces wider columns", () => {
    const opts = makeGridOptions([{ id: "short_col" }, { id: "long_col" }], {
      short_col: ["$0", "$0", "$0"],
      long_col: [
        "Enterprise Annual Subscription",
        "Professional Monthly Plan",
        "Premium Plus Package Deal",
      ],
    });

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[1].width).toBeGreaterThan(cols[0].width!);
  });

  it("returns options unchanged when columns array is missing", () => {
    const opts = { dataTable: { columns: { x: [1] } } } as GridOptions;
    const result = autoSizeGridColumns(opts);
    expect(result).toBe(opts); // same reference — no mutation
  });

  it("returns options unchanged when dataTable is missing", () => {
    const opts = { columns: [{ id: "x" }] } as GridOptions;
    const result = autoSizeGridColumns(opts);
    expect(result).toBe(opts);
  });

  it("handles null/undefined values in data gracefully", () => {
    const opts = makeGridOptions([{ id: "val" }], {
      val: [null, undefined, null, "hello"] as unknown[],
    });

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBeTypeOf("number");
    expect(cols[0].width).toBeGreaterThanOrEqual(80);
  });

  it("handles empty data array", () => {
    const opts = makeGridOptions([{ id: "col1" }], { col1: [] });

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    // Should still assign a width based on header
    expect(cols[0].width).toBeTypeOf("number");
    expect(cols[0].width).toBeGreaterThanOrEqual(80);
  });

  it("accounts for header label length from column id", () => {
    // A column with a very long id (which becomes the header label proxy)
    // should be wider than one with a short id, even with same data
    const opts = makeGridOptions(
      [{ id: "a" }, { id: "thisIsAVeryLongColumnName" }],
      {
        a: ["x"],
        thisIsAVeryLongColumnName: ["x"],
      },
    );

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[1].width).toBeGreaterThan(cols[0].width!);
  });

  it("works with new data.columns format", () => {
    const opts = makeNewFormatGridOptions([{ id: "name" }, { id: "amount" }], {
      name: ["Alice", "Bob", "Charlie"],
      amount: [100, 25000, 500],
    });

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBeTypeOf("number");
    expect(cols[0].width).toBeGreaterThan(0);
    expect(cols[1].width).toBeTypeOf("number");
    expect(cols[1].width).toBeGreaterThan(0);
  });

  it("new format: wider content produces wider columns", () => {
    const opts = makeNewFormatGridOptions(
      [{ id: "short_col" }, { id: "long_col" }],
      {
        short_col: ["$0"],
        long_col: ["Enterprise Annual Subscription Plan"],
      },
    );

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[1].width).toBeGreaterThan(cols[0].width!);
  });

  it("new format: preserves explicit widths", () => {
    const opts = makeNewFormatGridOptions([{ id: "name", width: 200 }], {
      name: ["Alice"],
    });

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBe(200);
  });
});

// ─── buildGridOptions + estimateColumnWidth (tested indirectly) ───────────

describe("buildGridOptions content-based widths", () => {
  const makeCol = (
    overrides: Partial<ReportColumn> & {
      id: string;
      label: string;
      type: ReportColumn["type"];
    },
  ): ReportColumn => ({
    sortable: true,
    ...overrides,
  });

  it("assigns content-based widths when col has no width or minWidth", () => {
    const columns: ReportColumn[] = [
      makeCol({ id: "name", label: "Name", type: "text" }),
      makeCol({ id: "amount", label: "Amount", type: "currency" }),
    ];
    const data = [
      { name: "Acme Corp", amount: 150000 },
      { name: "Globex", amount: 2500 },
    ];

    const opts = buildGridOptions(columns, data);
    const cols = opts.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBeTypeOf("number");
    expect(cols[0].width).toBeGreaterThan(0);
    expect(cols[1].width).toBeTypeOf("number");
    expect(cols[1].width).toBeGreaterThan(0);
  });

  it("preserves explicit width from ReportColumn", () => {
    const columns: ReportColumn[] = [
      makeCol({ id: "name", label: "Name", type: "text", width: 250 }),
    ];
    const data = [{ name: "Short" }];

    const opts = buildGridOptions(columns, data);
    const cols = opts.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBe(250);
  });

  it("preserves minWidth from ReportColumn", () => {
    const columns: ReportColumn[] = [
      makeCol({ id: "name", label: "Name", type: "text", minWidth: 180 }),
    ];
    const data = [{ name: "X" }];

    const opts = buildGridOptions(columns, data);
    const cols = opts.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBe(180);
  });

  it("currency columns are sized to fit formatted values", () => {
    const columns: ReportColumn[] = [
      makeCol({ id: "small", label: "Small", type: "currency" }),
      makeCol({ id: "large", label: "Large", type: "currency" }),
    ];
    const data = [
      { small: 0, large: 1500000 },
      { small: 5, large: 9999999 },
    ];

    const opts = buildGridOptions(columns, data);
    const cols = opts.columns as Array<{ id: string; width?: number }>;

    // $9,999,999 is wider than $0
    expect(cols[1].width).toBeGreaterThan(cols[0].width!);
  });

  it("boolean columns get fixed-width based on type min", () => {
    const columns: ReportColumn[] = [
      makeCol({ id: "active", label: "Active", type: "boolean" }),
    ];
    const data = [{ active: true }, { active: false }];

    const opts = buildGridOptions(columns, data);
    const cols = opts.columns as Array<{ id: string; width?: number }>;

    // Should be capped — not content-driven for boolean
    expect(cols[0].width).toBeGreaterThanOrEqual(70);
    expect(cols[0].width).toBeLessThanOrEqual(280);
  });

  it("very long text values are capped at MAX_COL_WIDTH (280px)", () => {
    const columns: ReportColumn[] = [
      makeCol({ id: "desc", label: "Description", type: "text" }),
    ];
    const data = [{ desc: "A".repeat(500) }];

    const opts = buildGridOptions(columns, data);
    const cols = opts.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBeLessThanOrEqual(280);
  });

  it("AI columns get extra width for reasoning button", () => {
    const colsNoAI: ReportColumn[] = [
      makeCol({ id: "score", label: "Score", type: "number" }),
    ];
    const colsAI: ReportColumn[] = [
      makeCol({ id: "score", label: "Score", type: "number", isAI: true }),
    ];
    const data = [{ score: 42 }, { score: 88 }];

    const optsNoAI = buildGridOptions(colsNoAI, data);
    const optsAI = buildGridOptions(colsAI, data);
    const wNoAI = (optsNoAI.columns as Array<{ width?: number }>)[0].width!;
    const wAI = (optsAI.columns as Array<{ width?: number }>)[0].width!;

    expect(wAI).toBeGreaterThan(wNoAI);
  });

  it("owner columns include avatar space in width", () => {
    const columns: ReportColumn[] = [
      makeCol({ id: "rep", label: "Rep", type: "owner" }),
    ];
    const data = [{ rep: "Jane Smith" }];

    const opts = buildGridOptions(columns, data);
    const cols = opts.columns as Array<{ id: string; width?: number }>;

    // Owner min is 130, and avatar adds 32px
    expect(cols[0].width).toBeGreaterThanOrEqual(130);
  });

  it("uses new data.columns format instead of deprecated dataTable", () => {
    const columns: ReportColumn[] = [
      makeCol({ id: "name", label: "Name", type: "text" }),
    ];
    const data = [{ name: "Alice" }];

    const opts = buildGridOptions(columns, data);

    // Should use new format
    const dataOpt = (opts as Record<string, unknown>).data as
      | { columns?: Record<string, unknown[]> }
      | undefined;
    expect(dataOpt).toBeDefined();
    expect(dataOpt?.columns).toBeDefined();
    expect(dataOpt?.columns?.name).toEqual(["Alice"]);

    // Should NOT have deprecated dataTable at top level
    expect((opts as Record<string, unknown>).dataTable).toBeUndefined();
  });
});
