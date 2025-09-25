import { describe, it, expect } from "vitest";
import { randomString, base64UrlEncode, sha256 } from "../pkce";

describe("PKCE Extended Tests", () => {
  describe("Random String Generation", () => {
    it("generates strings of various lengths", () => {
      const lengths = [8, 16, 32, 64, 128];

      lengths.forEach((length) => {
        const str = randomString(length);
        expect(str).toHaveLength(length * 2); // hex doubles the length
        expect(str).toMatch(/^[0-9a-f]+$/);
      });
    });

    it("generates unique strings consistently", () => {
      const strings = Array.from({ length: 100 }, () => randomString(32));
      const uniqueStrings = new Set(strings);

      // Should be all unique (extremely high probability)
      expect(uniqueStrings.size).toBe(100);
    });

    it("handles minimum length", () => {
      const str = randomString(1);
      expect(str).toHaveLength(2);
      expect(str).toMatch(/^[0-9a-f]{2}$/);
    });

    it("handles zero length", () => {
      const str = randomString(0);
      expect(str).toBe("");
    });
  });

  describe("Base64 URL Encoding", () => {
    it("encodes various byte sequences", () => {
      const testCases = [
        { input: [72, 101, 108, 108, 111], expected: "SGVsbG8" },
        { input: [0, 1, 2, 3], expected: "AAECAw" },
        { input: [255, 254, 253], expected: "__79" },
        { input: [], expected: "" },
      ];

      testCases.forEach(({ input, expected }) => {
        const buffer = new Uint8Array(input).buffer;
        const result = base64UrlEncode(buffer);
        expect(result).toBe(expected);
      });
    });

    it("removes padding characters", () => {
      // Test cases that would normally have padding
      const buffer1 = new Uint8Array([72]).buffer; // Would be "SA==" in regular base64
      const result1 = base64UrlEncode(buffer1);
      expect(result1).not.toContain("=");

      const buffer2 = new Uint8Array([72, 101]).buffer; // Would be "SGU=" in regular base64
      const result2 = base64UrlEncode(buffer2);
      expect(result2).not.toContain("=");
    });

    it("replaces URL-unsafe characters", () => {
      // Create a buffer that would produce + and / in regular base64
      const buffer = new Uint8Array([62, 63, 64]); // This creates >?@ which encodes to Pj9A
      const result = base64UrlEncode(buffer.buffer);

      expect(result).not.toContain("+");
      expect(result).not.toContain("/");
    });
  });

  describe("SHA256 Hashing", () => {
    it("produces consistent hashes for same input", async () => {
      const input = "test-string";
      const hash1 = await sha256(input);
      const hash2 = await sha256(input);

      const bytes1 = new Uint8Array(hash1);
      const bytes2 = new Uint8Array(hash2);

      expect(bytes1).toEqual(bytes2);
    });

    it("produces different hashes for different inputs", async () => {
      const hash1 = await sha256("string1");
      const hash2 = await sha256("string2");

      const bytes1 = new Uint8Array(hash1);
      const bytes2 = new Uint8Array(hash2);

      expect(bytes1).not.toEqual(bytes2);
    });

    it("handles empty string", async () => {
      const hash = await sha256("");
      expect(hash.byteLength).toBe(32);
    });

    it("handles unicode characters", async () => {
      const hash = await sha256("🔐 Security 安全");
      expect(hash.byteLength).toBe(32);
    });

    it("handles very long strings", async () => {
      const longString = "a".repeat(10000);
      const hash = await sha256(longString);
      expect(hash.byteLength).toBe(32);
    });
  });

  describe("PKCE Integration", () => {
    it("creates valid PKCE challenge from verifier", async () => {
      const verifier = randomString(64);
      const challengeBuffer = await sha256(verifier);
      const challenge = base64UrlEncode(challengeBuffer);

      expect(verifier).toHaveLength(128); // 64 bytes as hex
      expect(challenge).toBeTruthy();
      expect(challenge).not.toContain("=");
      expect(challenge).not.toContain("+");
      expect(challenge).not.toContain("/");
    });

    it("generates different challenges for different verifiers", async () => {
      const verifier1 = randomString(64);
      const verifier2 = randomString(64);

      const challenge1Buffer = await sha256(verifier1);
      const challenge2Buffer = await sha256(verifier2);

      const challenge1 = base64UrlEncode(challenge1Buffer);
      const challenge2 = base64UrlEncode(challenge2Buffer);

      expect(challenge1).not.toBe(challenge2);
    });
  });
});
