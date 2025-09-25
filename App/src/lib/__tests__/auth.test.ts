import { describe, it, expect, beforeEach } from "vitest";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  setTokens,
  getAccessToken,
  clearTokens,
  storeCodeVerifier,
  readCodeVerifier,
  clearCodeVerifier,
} from "../auth";

describe("auth storage helpers", () => {
  beforeEach(() => sessionStorage.clear());

  it("stores and reads access token", () => {
    setTokens("test-token");
    expect(getAccessToken()).toBe("test-token");
  });

  it("stores access and refresh tokens", () => {
    setTokens("access", "refresh");
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe("access");
    expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe("refresh");
  });

  it("clears tokens", () => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, "a");
    sessionStorage.setItem(REFRESH_TOKEN_KEY, "r");
    clearTokens();
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it("stores and reads code verifier", () => {
    storeCodeVerifier("verifier123");
    expect(readCodeVerifier()).toBe("verifier123");
  });

  it("clears code verifier", () => {
    storeCodeVerifier("verifier123");
    clearCodeVerifier();
    expect(readCodeVerifier()).toBeNull();
  });

  it("returns null for missing tokens", () => {
    expect(getAccessToken()).toBeNull();
    expect(readCodeVerifier()).toBeNull();
  });
});
