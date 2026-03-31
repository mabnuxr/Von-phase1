import { describe, it, expect } from "vitest";
import type { GridOptions } from "@highcharts/grid-lite-react";
import { applyColumnFormats } from "@vonlabs/design-components";

// ─── Helpers ─────────────────────────────────────────────────────────────

function makeGridOptions(columns: Array<Record<string, unknown>>): GridOptions {
  return { columns } as GridOptions;
}

function callFormatter(
  opts: GridOptions,
  colIndex: number,
  value: unknown,
): string {
  const col = (opts.columns as Array<Record<string, unknown>>)[colIndex];
  const cells = col.cells as {
    formatter?: (this: { value: unknown }) => string;
  };
  if (!cells?.formatter) throw new Error("No formatter on column");
  return cells.formatter.call({ value });
}

// ─── applyColumnFormats ──────────────────────────────────────────────────

describe("applyColumnFormats", () => {
  it("injects formatter for columns with a format field", () => {
    const opts = makeGridOptions([{ id: "amount", format: "$,.2f" }]);
    applyColumnFormats(opts);
    const html = callFormatter(opts, 0, 1234.5);
    expect(html).toContain("$1,234.50");
  });

  it("leaves columns without format untouched", () => {
    const opts = makeGridOptions([{ id: "name", header: { format: "Name" } }]);
    applyColumnFormats(opts);
    const col = (opts.columns as Array<Record<string, unknown>>)[0];
    const cells = col.cells as { formatter?: unknown } | undefined;
    expect(cells?.formatter).toBeUndefined();
  });

  it("preserves existing cells.formatter", () => {
    const custom = function (this: { value: unknown }) {
      return "custom";
    };
    const opts = makeGridOptions([
      { id: "x", format: "$,.2f", cells: { formatter: custom } },
    ]);
    applyColumnFormats(opts);
    const col = (opts.columns as Array<Record<string, unknown>>)[0];
    const cells = col.cells as { formatter: unknown };
    expect(cells.formatter).toBe(custom);
  });

  it("renders null/undefined as em-dash", () => {
    const opts = makeGridOptions([{ id: "a", format: ",.2f" }]);
    applyColumnFormats(opts);
    expect(callFormatter(opts, 0, null)).toContain("—");
    expect(callFormatter(opts, 0, undefined)).toContain("—");
  });

  it("renders empty string as em-dash (not formatted 0)", () => {
    const opts = makeGridOptions([{ id: "a", format: ",.2f" }]);
    applyColumnFormats(opts);
    expect(callFormatter(opts, 0, "")).toContain("—");
    expect(callFormatter(opts, 0, "  ")).toContain("—");
  });

  it("renders non-numeric strings as escaped text", () => {
    const opts = makeGridOptions([{ id: "a", format: ",.2f" }]);
    applyColumnFormats(opts);
    const html = callFormatter(opts, 0, "hello");
    expect(html).toContain("hello");
    expect(html).not.toContain("NaN");
  });

  it("escapes XSS payloads in non-numeric values", () => {
    const opts = makeGridOptions([{ id: "a", format: ",.2f" }]);
    applyColumnFormats(opts);
    const html = callFormatter(opts, 0, "<img onerror=alert(1) src=x>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("applies cell template with {value} substitution", () => {
    const opts = makeGridOptions([
      { id: "rate", format: ".2f", cells: { format: "{value}%" } },
    ]);
    applyColumnFormats(opts);
    const html = callFormatter(opts, 0, 45.3);
    expect(html).toContain("45.30%");
  });

  it("handles integer format", () => {
    const opts = makeGridOptions([{ id: "count", format: ",.0f" }]);
    applyColumnFormats(opts);
    const html = callFormatter(opts, 0, 1234567);
    expect(html).toContain("1,234,567");
  });

  it("falls back gracefully on invalid format string", () => {
    const opts = makeGridOptions([{ id: "a", format: "%%%invalid" }]);
    applyColumnFormats(opts);
    // Should not throw, should render something
    const html = callFormatter(opts, 0, 42);
    expect(html).toBeTruthy();
  });
});
