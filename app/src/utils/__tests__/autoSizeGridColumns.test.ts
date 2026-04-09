import { describe, it, expect } from "vitest";
import type { GridOptions } from "@highcharts/grid-lite-react";
import {
  autoSizeGridColumns,
  buildGridOptions,
} from "@vonlabs/design-components";
import type { ReportColumn } from "@vonlabs/design-components";

// ─── Helpers ─────────────────────────────────────────────────────────────

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

// ─── autoSizeGridColumns ──────────────────────────────────────────────────

describe("autoSizeGridColumns", () => {
  it("preserves existing column widths", () => {
    const opts = makeGridOptions(
      [
        { id: "name", width: 200 },
        { id: "status", width: 150 },
      ],
      { name: ["Alice"], status: ["Active"] },
    );

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBe(200);
    expect(cols[1].width).toBe(150);
  });

  it("does not add widths to columns without them (DOM measurement handles sizing)", () => {
    const opts = makeGridOptions([{ id: "name" }, { id: "amount" }], {
      name: ["Alice"],
      amount: [100],
    });

    const result = autoSizeGridColumns(opts);
    const cols = result.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBeUndefined();
    expect(cols[1].width).toBeUndefined();
  });

  it("enables column resizing", () => {
    const opts = makeGridOptions([{ id: "name" }], { name: ["Alice"] });

    const result = autoSizeGridColumns(opts);
    const rendering = result.rendering as {
      columns?: { resizing?: { enabled: boolean } };
    };

    expect(rendering?.columns?.resizing?.enabled).toBe(true);
  });

  it("returns options unchanged when columns array is missing", () => {
    const opts = { dataTable: { columns: { x: [1] } } } as GridOptions;
    const result = autoSizeGridColumns(opts);
    expect(result).toBe(opts);
  });
});

// ─── buildGridOptions ─────────────────────────────────────────────────────

describe("buildGridOptions column widths", () => {
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

  it("does not set width when no explicit width or minWidth is provided", () => {
    const columns: ReportColumn[] = [
      makeCol({ id: "name", label: "Name", type: "text" }),
    ];
    const data = [{ name: "Acme Corp" }];

    const opts = buildGridOptions(columns, data);
    const cols = opts.columns as Array<{ id: string; width?: number }>;

    expect(cols[0].width).toBeUndefined();
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

  it("enables column resizing by default", () => {
    const columns: ReportColumn[] = [
      makeCol({ id: "name", label: "Name", type: "text" }),
    ];
    const data = [{ name: "Alice" }];

    const opts = buildGridOptions(columns, data);
    const rendering = opts.rendering as {
      columns?: { resizing?: { enabled: boolean } };
    };

    expect(rendering?.columns?.resizing?.enabled).toBe(true);
  });
});
