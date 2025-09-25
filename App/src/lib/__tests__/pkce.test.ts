import { describe, it, expect } from "vitest";
import { randomString, base64UrlEncode } from "../pkce";

describe("PKCE utilities", () => {
  it("generates random string of correct length", () => {
    const str = randomString(32);
    expect(str).toHaveLength(64); // hex encoding doubles length
    expect(str).toMatch(/^[0-9a-f]+$/);
  });

  it("base64 URL encodes properly", () => {
    const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
    const encoded = base64UrlEncode(buffer);
    expect(encoded).toBe("SGVsbG8");
  });

  it("generates different random strings each time", () => {
    const str1 = randomString(16);
    const str2 = randomString(16);
    expect(str1).not.toBe(str2);
  });

  it("handles empty buffer", () => {
    const buffer = new Uint8Array([]).buffer;
    const encoded = base64UrlEncode(buffer);
    expect(encoded).toBe("");
  });
});
