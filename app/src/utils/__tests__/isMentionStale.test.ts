import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isMentionStale } from "../isMentionStale";

describe("isMentionStale", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-27T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for mentions less than 24h old", () => {
    // 23h 59m 59s ago
    const ts = new Date("2026-04-26T12:00:01Z").toISOString();
    expect(isMentionStale(ts)).toBe(false);
  });

  it("returns true for mentions exactly 24h old", () => {
    const ts = new Date("2026-04-26T12:00:00Z").toISOString();
    expect(isMentionStale(ts)).toBe(true);
  });

  it("returns true for mentions older than 24h", () => {
    const ts = new Date("2026-04-20T12:00:00Z").toISOString();
    expect(isMentionStale(ts)).toBe(true);
  });

  it("returns false for undefined", () => {
    expect(isMentionStale(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isMentionStale(null)).toBe(false);
  });

  it("returns false for an unparseable string", () => {
    expect(isMentionStale("not-a-date")).toBe(false);
  });

  it("treats a timestamp without timezone as UTC via ensureUTC", () => {
    // Timestamp string without explicit Z — design-components ensureUTC normalizes it
    const ts = "2026-04-26T12:00:00";
    expect(isMentionStale(ts)).toBe(true);
  });
});
