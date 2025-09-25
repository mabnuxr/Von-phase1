import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  setTokens,
  getAccessToken,
  clearTokens,
  storeCodeVerifier,
  readCodeVerifier,
  clearCodeVerifier,
  clearAllAuth,
  logCurrentToken,
} from "../auth";

describe("Auth Extended Tests", () => {
  beforeEach(() => sessionStorage.clear());

  describe("Token Management", () => {
    it("stores both access and refresh tokens", () => {
      setTokens("access-123", "refresh-456");
      expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe("access-123");
      expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe("refresh-456");
    });

    it("stores only access token when refresh not provided", () => {
      setTokens("access-only");
      expect(getAccessToken()).toBe("access-only");
      expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    });

    it("overwrites existing tokens", () => {
      setTokens("old-access", "old-refresh");
      setTokens("new-access", "new-refresh");

      expect(getAccessToken()).toBe("new-access");
      expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe("new-refresh");
    });
  });

  describe("Code Verifier Management", () => {
    it("stores and retrieves code verifier", () => {
      const verifier = "test-verifier-12345";
      storeCodeVerifier(verifier);
      expect(readCodeVerifier()).toBe(verifier);
    });

    it("clears code verifier independently", () => {
      storeCodeVerifier("test-verifier");
      setTokens("test-token");

      clearCodeVerifier();

      expect(readCodeVerifier()).toBeNull();
      expect(getAccessToken()).toBe("test-token");
    });
  });

  describe("Comprehensive Clearing", () => {
    it("clearAllAuth removes all auth-related data", () => {
      setTokens("access", "refresh");
      storeCodeVerifier("verifier");

      clearAllAuth();

      expect(getAccessToken()).toBeNull();
      expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
      expect(readCodeVerifier()).toBeNull();
    });

    it("clearTokens only removes tokens, not verifier", () => {
      setTokens("access", "refresh");
      storeCodeVerifier("verifier");

      clearTokens();

      expect(getAccessToken()).toBeNull();
      expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
      expect(readCodeVerifier()).toBe("verifier");
    });
  });

  describe("Logging", () => {
    it("logs token when present", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      setTokens("test-token");
      logCurrentToken("test context");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Auth] test context - access_token:",
        "test-token",
      );

      consoleSpy.mockRestore();
    });

    it("logs no token message when absent", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      logCurrentToken("empty context");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Auth] empty context - no access_token found",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty string values", () => {
      setTokens("");
      storeCodeVerifier("");

      expect(getAccessToken()).toBe("");
      expect(readCodeVerifier()).toBe("");
    });

    it("handles special characters in tokens", () => {
      const specialToken = "token.with-special_chars+/=123";
      setTokens(specialToken);
      expect(getAccessToken()).toBe(specialToken);
    });

    it("preserves non-auth sessionStorage items", () => {
      sessionStorage.setItem("other-key", "other-value");

      setTokens("test");
      clearAllAuth();

      expect(sessionStorage.getItem("other-key")).toBe("other-value");
    });
  });
});
