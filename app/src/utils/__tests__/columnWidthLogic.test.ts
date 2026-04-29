import { describe, it, expect } from "vitest";
import {
  pickColumnCandidates,
  computeColumnWidths,
  buildProbeColumns,
  humanizeColumnId,
  PROBE_CANDIDATE_LIMIT,
  MAX_COL_WIDTH,
  MIN_COL_WIDTH,
  WIDTH_BUFFER,
} from "@vonlabs/design-components";
import type { GridOptions } from "@highcharts/grid-lite-react";

// ─── humanizeColumnId ────────────────────────────────────────────────────

describe("humanizeColumnId", () => {
  it("strips a leading 'col_' prefix", () => {
    expect(humanizeColumnId("col_userId")).toBe("user Id");
  });

  it("converts snake_case to spaces", () => {
    expect(humanizeColumnId("first_query_date")).toBe("first query date");
  });

  it("inserts a space between camelCase boundaries", () => {
    expect(humanizeColumnId("displayName")).toBe("display Name");
  });

  it("leaves already-humanized strings alone", () => {
    expect(humanizeColumnId("amount")).toBe("amount");
  });
});

// ─── pickColumnCandidates ────────────────────────────────────────────────

describe("pickColumnCandidates", () => {
  it("returns an empty array for missing data", () => {
    expect(pickColumnCandidates(undefined, undefined)).toEqual([]);
  });

  it("returns at most CANDIDATE_LIMIT longest unique values", () => {
    const data = [
      "ant",
      "bear",
      "cat",
      "dolphin",
      "elephant",
      "fox",
      "giraffe",
      "horse",
    ];
    const result = pickColumnCandidates(data, undefined);
    expect(result.length).toBe(PROBE_CANDIDATE_LIMIT);
    // Sorted descending by length: elephant > dolphin > giraffe > horse > bear
    expect(result).toEqual(["elephant", "dolphin", "giraffe", "horse", "bear"]);
  });

  it("dedupes repeated values", () => {
    const data = ["alpha", "alpha", "beta", "beta", "gamma"];
    const result = pickColumnCandidates(data, undefined);
    expect(result).toEqual(["alpha", "gamma", "beta"]);
  });

  it("skips null and undefined", () => {
    const data = [null, "foo", undefined, "bar", null];
    const result = pickColumnCandidates(data, undefined);
    expect(result).toEqual(["foo", "bar"]);
  });

  it("samples only the first 100 rows by default", () => {
    const data = [
      ...Array.from({ length: 100 }, (_, i) => `row${i}`),
      "ABSENT_LATER_ROW_LONGER_THAN_ANY_OF_THE_FIRST_100",
    ];
    const result = pickColumnCandidates(data, undefined);
    expect(result).not.toContain(
      "ABSENT_LATER_ROW_LONGER_THAN_ANY_OF_THE_FIRST_100",
    );
  });

  it("formats numeric values with d3 format when provided", () => {
    const data = [1234.5, 0, 9876.1];
    const result = pickColumnCandidates(data, "$,.2f");
    // formatD3Pattern adds thousands separators and 2 decimals.
    expect(result).toContain("$1,234.50");
    expect(result).toContain("$9,876.10");
  });

  it("falls back to String() for non-numeric values when format is provided", () => {
    const data = ["not-a-number"];
    const result = pickColumnCandidates(data, "$,.2f");
    expect(result).toEqual(["not-a-number"]);
  });

  it("respects a custom limit and sample size", () => {
    const data = ["one", "two", "three", "four", "five", "six"];
    const result = pickColumnCandidates(data, undefined, 2, 4);
    // Only first 4 rows sampled: one, two, three, four — top 2 by length: three, four
    expect(result).toEqual(["three", "four"]);
  });

  it("keeps insertion order for equal-length candidates", () => {
    // Both 10 chars but different first-occurrence order.
    const data = ["Electrical", "Mechanical", "Electronic"];
    const result = pickColumnCandidates(data, undefined);
    // sort is stable in V8 so insertion order is preserved among equal-length.
    expect(result).toEqual(["Electrical", "Mechanical", "Electronic"]);
  });
});

// ─── computeColumnWidths ─────────────────────────────────────────────────

describe("computeColumnWidths", () => {
  // Mirrors the production input shape.
  const col = (
    probeTdWidth: number,
    probeThWidth: number,
    explicitWidth = 0,
  ) => ({ probeTdWidth, probeThWidth, explicitWidth });

  it("returns empty array for empty input", () => {
    expect(computeColumnWidths([], 1000)).toEqual([]);
  });

  it("uses max of td/th plus the buffer when there's no surplus", () => {
    // Container narrower than natural total → no surplus distribution.
    const inputs = [col(200, 100), col(150, 80), col(300, 100)];
    const result = computeColumnWidths(inputs, 100);
    expect(result).toEqual([
      200 + WIDTH_BUFFER,
      150 + WIDTH_BUFFER,
      300 + WIDTH_BUFFER,
    ]);
  });

  it("respects the MIN_COL_WIDTH floor", () => {
    const result = computeColumnWidths([col(10, 5)], 0);
    expect(result[0]).toBe(MIN_COL_WIDTH + WIDTH_BUFFER);
  });

  it("caps any single column at MAX_COL_WIDTH", () => {
    const result = computeColumnWidths([col(2000, 100)], 0);
    expect(result[0]).toBe(MAX_COL_WIDTH);
  });

  it("uses explicit width as a floor", () => {
    // Probe says 50, explicit says 200 → final 200.
    const result = computeColumnWidths([col(50, 30, 200)], 0);
    expect(result[0]).toBe(200);
  });

  it("does not let explicit width exceed the container short-circuit", () => {
    // Explicit 200 still wins over 50 + buffer regardless of container.
    const result = computeColumnWidths([col(50, 30, 200)], 999);
    // No surplus distribution because total (200) < container (999):
    //   surplus = 799 → all goes to last (only) column.
    expect(result[0]).toBe(200 + 799);
  });

  it("distributes surplus proportionally when natural total fits", () => {
    // Two columns: 100 + 100 = 200. Container 400 → surplus 200.
    // Each probe is 92px → +8 buffer → 100 each. Equal weight → +100 each.
    const result = computeColumnWidths([col(92, 92), col(92, 92)], 400);
    expect(result.reduce((a, b) => a + b, 0)).toBe(400);
    expect(result[0]).toBe(result[1]);
  });

  it("absorbs rounding remainder into the last column so the sum lands exactly on container", () => {
    // Three columns each natural 92+8 = 100. Container 1001 → surplus 701.
    // Proportional split rounds to 234, 234 → distributed = 468, last = 701-468 = 233.
    // Final widths sum: 100+234 + 100+234 + 100+233 = 1001.
    const result = computeColumnWidths(
      [col(92, 92), col(92, 92), col(92, 92)],
      1001,
    );
    expect(result.reduce((a, b) => a + b, 0)).toBe(1001);
  });

  it("distributes more surplus to wider columns (proportional, not equal)", () => {
    // Wide=200, narrow=50. Container 1000 → surplus 750. Wide:narrow weight 4:1.
    // Wide gets 750 * 208/266 = 587 more, narrow gets remainder.
    const inputs = [col(200, 100), col(50, 30)];
    const result = computeColumnWidths(inputs, 1000);
    const [wide, narrow] = result;
    expect(wide - 208).toBeGreaterThan(narrow - 58);
    expect(wide + narrow).toBe(1000);
  });

  it("does not distribute surplus when container is 0 (e.g. measured before layout)", () => {
    const result = computeColumnWidths([col(100, 50)], 0);
    expect(result[0]).toBe(100 + WIDTH_BUFFER);
  });

  it("does not distribute when natural total exceeds container (table will scroll)", () => {
    const inputs = [col(400, 100), col(400, 100), col(400, 100)];
    const result = computeColumnWidths(inputs, 500);
    expect(result.every((w) => w === 400 + WIDTH_BUFFER)).toBe(true);
  });

  it("respects custom buffer/cap/min options", () => {
    const inputs = [col(50, 50)];
    const result = computeColumnWidths(inputs, 0, {
      buffer: 0,
      minColWidth: 80,
      maxColWidth: 200,
    });
    // max(50, 50, 80) + 0 = 80, capped by 200 → 80.
    expect(result[0]).toBe(80);
  });
});

// ─── buildProbeColumns ───────────────────────────────────────────────────

describe("buildProbeColumns", () => {
  function makeOptions(
    columns: Array<{
      id: string;
      format?: string;
      width?: number;
      enabled?: boolean;
    }>,
    dataColumns: Record<string, unknown[]>,
  ): GridOptions {
    return {
      columns,
      dataTable: { columns: dataColumns },
    } as GridOptions;
  }

  it("returns null when columns are missing", () => {
    expect(
      buildProbeColumns({ dataTable: { columns: {} } } as GridOptions),
    ).toBeNull();
  });

  it("returns null when data table is missing", () => {
    expect(
      buildProbeColumns({ columns: [{ id: "a" }] } as GridOptions),
    ).toBeNull();
  });

  it("builds one ProbeColumn per data column with humanized headers", () => {
    const opts = makeOptions([{ id: "first_query_date" }, { id: "userId" }], {
      first_query_date: ["2026-01-01", "2026-02-01"],
      userId: ["abc", "xyz"],
    });
    const probe = buildProbeColumns(opts);
    expect(probe).toHaveLength(2);
    expect(probe![0].header).toBe("first query date");
    expect(probe![1].header).toBe("user Id");
  });

  it("flags hasExplicitWidth when the column carries a width field", () => {
    const opts = makeOptions([{ id: "a", width: 120 }, { id: "b" }], {
      a: ["x"],
      b: ["y"],
    });
    const probe = buildProbeColumns(opts)!;
    expect(probe[0].hasExplicitWidth).toBe(true);
    expect(probe[1].hasExplicitWidth).toBe(false);
  });

  it("collects the candidate values per column", () => {
    const opts = makeOptions([{ id: "type" }], {
      type: ["Electrical", "Mechanical", "Electronic", "Structural"],
    });
    const probe = buildProbeColumns(opts)!;
    // All 4 are 10 chars; all should make the candidate list (limit=5).
    expect(probe[0].candidates).toHaveLength(4);
    expect(probe[0].candidates).toContain("Mechanical");
  });

  it("records originalIndex matching the column's slot in options.columns", () => {
    const opts = makeOptions(
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      { a: ["x"], b: ["y"], c: ["z"] },
    );
    const probe = buildProbeColumns(opts)!;
    expect(probe.map((p) => p.originalIndex)).toEqual([0, 1, 2]);
  });

  it("filters out columns with enabled === false", () => {
    const opts = makeOptions(
      [
        { id: "name" },
        { id: "accountid", enabled: false },
        { id: "stage" },
      ],
      { name: ["Alice"], accountid: ["xyz"], stage: ["new"] },
    );
    const probe = buildProbeColumns(opts)!;
    expect(probe.map((p) => p.id)).toEqual(["name", "stage"]);
    // originalIndex skips the disabled slot — name=0, stage=2.
    expect(probe.map((p) => p.originalIndex)).toEqual([0, 2]);
  });

  it("does not filter when enabled is true or omitted", () => {
    const opts = makeOptions(
      [{ id: "a", enabled: true }, { id: "b" }],
      { a: ["x"], b: ["y"] },
    );
    const probe = buildProbeColumns(opts)!;
    expect(probe).toHaveLength(2);
  });
});
