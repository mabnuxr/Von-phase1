import { describe, it, expect, vi } from "vitest";
import { randomString, base64UrlEncode, sha256 } from "../../pkce";

describe("PKCE Snapshots", () => {
  it("should match random string patterns", () => {
    // Use vi.spyOn for crypto mocking
    const mockGetRandomValues = vi
      .spyOn(crypto, "getRandomValues")
      .mockImplementation((array) => {
        // Fill with deterministic values for snapshot testing
        if (array && array instanceof Uint8Array) {
          for (let i = 0; i < array.length; i++) {
            array[i] = i % 256;
          }
        }
        return array;
      });

    const patterns = {
      length_8: randomString(8),
      length_16: randomString(16),
      length_32: randomString(32),
    };

    mockGetRandomValues.mockRestore();
    expect(patterns).toMatchSnapshot();
  });

  it("should match base64 encoding results", () => {
    const testCases = [
      { name: "hello", input: [72, 101, 108, 108, 111] },
      { name: "empty", input: [] },
      { name: "numbers", input: [0, 1, 2, 3, 4, 5] },
      { name: "special", input: [255, 254, 253, 252] },
    ];

    const encodingResults: Record<string, string> = {};
    testCases.forEach((testCase) => {
      const buffer = new Uint8Array(testCase.input).buffer;
      encodingResults[testCase.name] = base64UrlEncode(buffer);
    });

    expect(encodingResults).toMatchSnapshot();
  });

  it("should match SHA256 hash structure", async () => {
    const inputs = ["hello", "test", "", "🔐"];
    const hashResults: Record<
      string,
      { byteLength: number; firstFourBytes: number[]; lastFourBytes: number[] }
    > = {};

    for (const input of inputs) {
      const hash = await sha256(input);
      const bytes = new Uint8Array(hash);
      hashResults[input || "empty"] = {
        byteLength: hash.byteLength,
        firstFourBytes: Array.from(bytes.slice(0, 4)),
        lastFourBytes: Array.from(bytes.slice(-4)),
      };
    }

    expect(hashResults).toMatchSnapshot();
  });

  it("should match PKCE flow structure", async () => {
    // Mock crypto methods for deterministic results
    const mockGetRandomValues = vi
      .spyOn(crypto, "getRandomValues")
      .mockImplementation((array) => {
        if (array && array instanceof Uint8Array) {
          for (let i = 0; i < array.length; i++) {
            array[i] = (i * 17) % 256; // Deterministic pattern
          }
        }
        return array;
      });

    const mockDigest = vi
      .spyOn(crypto.subtle, "digest")
      .mockImplementation(async () => {
        // Return deterministic hash
        const result = new ArrayBuffer(32);
        const view = new Uint8Array(result);
        for (let i = 0; i < 32; i++) {
          view[i] = (i * 7) % 256;
        }
        return result;
      });

    const verifier = randomString(32);
    const challengeBuffer = await sha256(verifier);
    const challenge = base64UrlEncode(challengeBuffer);

    const pkceFlow = {
      verifier: {
        value: verifier,
        length: verifier.length,
      },
      challenge: {
        value: challenge,
        length: challenge.length,
      },
      hashByteLength: challengeBuffer.byteLength,
    };

    mockGetRandomValues.mockRestore();
    mockDigest.mockRestore();
    expect(pkceFlow).toMatchSnapshot();
  });

  it("should match URL encoding characteristics", () => {
    const urlUnsafeBytes = [62, 63, 47, 43]; // Creates characters that need URL encoding
    const buffer = new Uint8Array(urlUnsafeBytes).buffer;
    const encoded = base64UrlEncode(buffer);

    const characteristics = {
      encoded,
      hasPlus: encoded.includes("+"),
      hasSlash: encoded.includes("/"),
      hasEquals: encoded.includes("="),
      length: encoded.length,
    };

    expect(characteristics).toMatchSnapshot();
  });
});
