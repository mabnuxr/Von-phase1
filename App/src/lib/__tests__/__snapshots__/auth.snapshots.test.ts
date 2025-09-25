import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setTokens,
  getAccessToken,
  storeCodeVerifier,
  readCodeVerifier,
  logCurrentToken,
} from "../../auth";

describe("Auth Snapshots", () => {
  beforeEach(() => sessionStorage.clear());

  it("should match token storage structure", () => {
    setTokens("sample-access-token", "sample-refresh-token");

    const tokenStructure = {
      access_token: getAccessToken(),
      refresh_token: sessionStorage.getItem("refresh_token"),
      code_verifier: readCodeVerifier(),
    };

    expect(tokenStructure).toMatchSnapshot();
  });

  it("should match empty auth state", () => {
    const emptyState = {
      access_token: getAccessToken(),
      refresh_token: sessionStorage.getItem("refresh_token"),
      code_verifier: readCodeVerifier(),
    };

    expect(emptyState).toMatchSnapshot();
  });

  it("should match code verifier storage", () => {
    const verifier = "test-code-verifier-12345";
    storeCodeVerifier(verifier);

    const verifierState = {
      stored_verifier: readCodeVerifier(),
      length: readCodeVerifier()?.length,
    };

    expect(verifierState).toMatchSnapshot();
  });

  it("should match console log output format", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    setTokens("snapshot-token-123");
    logCurrentToken("snapshot test");

    const logCall = consoleSpy.mock.calls[0];
    const logStructure = {
      context: logCall[0],
      token: logCall[1],
    };

    expect(logStructure).toMatchSnapshot();
    consoleSpy.mockRestore();
  });

  it("should match sessionStorage keys after token operations", () => {
    setTokens("access-123", "refresh-456");
    storeCodeVerifier("verifier-789");

    const storageKeys = Object.keys(sessionStorage).sort();
    const storageSnapshot = {
      keys: storageKeys,
      keyCount: storageKeys.length,
    };

    expect(storageSnapshot).toMatchSnapshot();
  });
});
