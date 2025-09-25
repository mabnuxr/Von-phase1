import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the dependencies
const mockRandomString = vi.fn();
const mockSha256 = vi.fn();
const mockBase64UrlEncode = vi.fn();
const mockStoreCodeVerifier = vi.fn();
const mockClearAllAuth = vi.fn();

vi.mock("../pkce", () => ({
  randomString: mockRandomString,
  sha256: mockSha256,
  base64UrlEncode: mockBase64UrlEncode,
}));

vi.mock("../auth", () => ({
  storeCodeVerifier: mockStoreCodeVerifier,
  clearAllAuth: mockClearAllAuth,
}));

vi.mock("../config", () => ({
  config: {
    authBase: "https://vonlabs-afcu5dgbaafqi.scalekit.dev",
    authorizePath: "/oauth/authorize",
    logoutPath: "/logout",
    clientId: "test-client-id",
    redirectUri: "http://localhost:5173/callback",
    apiBase: "http://localhost:5176",
  },
}));

// Mock window.location
const mockLocation = {
  href: "",
  origin: "http://localhost:5173",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("Enhanced Logout Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";

    // Setup default mock implementations
    mockRandomString.mockReturnValue("mock-random-verifier");
    mockSha256.mockResolvedValue(new ArrayBuffer(32));
    mockBase64UrlEncode.mockReturnValue("mock-challenge");
  });

  describe("startProviderLogout", () => {
    it("clears auth and generates PKCE for post-logout flow", async () => {
      const { startProviderLogout } = await import("../authFlow");

      await startProviderLogout();

      // Should clear all auth first
      expect(mockClearAllAuth).toHaveBeenCalled();

      // Should generate new PKCE parameters for post-logout auth
      expect(mockRandomString).toHaveBeenCalledWith(64);
      expect(mockSha256).toHaveBeenCalledWith("mock-random-verifier");
      expect(mockBase64UrlEncode).toHaveBeenCalled();
      expect(mockStoreCodeVerifier).toHaveBeenCalledWith(
        "mock-random-verifier",
      );
    });

    it("constructs logout URL with ScaleKit auth URL as post_logout_redirect_uri", async () => {
      const { startProviderLogout } = await import("../authFlow");

      await startProviderLogout();

      // Should redirect to logout endpoint
      expect(mockLocation.href).toContain(
        "https://vonlabs-afcu5dgbaafqi.scalekit.dev/logout",
      );

      // Should have post_logout_redirect_uri parameter
      expect(mockLocation.href).toContain("post_logout_redirect_uri=");

      // Extract the post_logout_redirect_uri value
      const urlMatch = mockLocation.href.match(
        /post_logout_redirect_uri=([^&]+)/,
      );
      expect(urlMatch).toBeTruthy();

      const redirectUri = decodeURIComponent(urlMatch![1]);

      // Should redirect to ScaleKit auth URL, not just root
      expect(redirectUri).toContain(
        "https://vonlabs-afcu5dgbaafqi.scalekit.dev/oauth/authorize",
      );
      expect(redirectUri).toContain("response_type=code");
      expect(redirectUri).toContain("client_id="); // Just check client_id param exists
      expect(redirectUri).toContain(
        "redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fcallback",
      );
      expect(redirectUri).toContain("scope=openid+profile+offline_access");
      expect(redirectUri).toContain("code_challenge=mock-challenge");
      expect(redirectUri).toContain("code_challenge_method=S256");
      expect(redirectUri).toContain("state=");
    });

    it("includes proper PKCE parameters in post-logout auth URL", async () => {
      const { startProviderLogout } = await import("../authFlow");

      await startProviderLogout();

      const urlMatch = mockLocation.href.match(
        /post_logout_redirect_uri=([^&]+)/,
      );
      const redirectUri = decodeURIComponent(urlMatch![1]);

      // Should include PKCE challenge
      expect(redirectUri).toContain("code_challenge=mock-challenge");
      expect(redirectUri).toContain("code_challenge_method=S256");

      // Should include state for CSRF protection
      const stateMatch = redirectUri.match(/state=([^&]+)/);
      expect(stateMatch).toBeTruthy();

      // State should be UUID format
      const stateValue = decodeURIComponent(stateMatch![1]);
      expect(stateValue).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("maintains OAuth 2.0 + PKCE security standards in logout flow", async () => {
      const { startProviderLogout } = await import("../authFlow");

      await startProviderLogout();

      const urlMatch = mockLocation.href.match(
        /post_logout_redirect_uri=([^&]+)/,
      );
      const authUrl = decodeURIComponent(urlMatch![1]);

      const requiredParams = [
        "response_type=code",
        "client_id=", // Just check client_id param exists
        "redirect_uri=",
        "scope=openid+profile+offline_access",
        "state=",
        "code_challenge=mock-challenge",
        "code_challenge_method=S256",
      ];

      requiredParams.forEach((param) => {
        expect(authUrl).toContain(param);
      });
    });

    it("properly URL encodes the post-logout redirect URI", async () => {
      const { startProviderLogout } = await import("../authFlow");

      await startProviderLogout();

      // Main logout URL should contain encoded redirect URI
      expect(mockLocation.href).toContain("post_logout_redirect_uri=https%3A");

      // Should not contain unencoded special characters in the main URL
      const mainUrl = mockLocation.href;
      const postRedirectParam = mainUrl.split("post_logout_redirect_uri=")[1];

      // The auth URL should be properly encoded
      expect(postRedirectParam).toContain("%3A%2F%2F"); // ://
      expect(postRedirectParam).toContain("%2F"); // /
      expect(postRedirectParam).toContain("%3D"); // =
    });
  });

  describe("Logout Flow Integration", () => {
    it("ensures seamless user experience: logout → ScaleKit logout → ScaleKit login", async () => {
      const { startProviderLogout } = await import("../authFlow");

      await startProviderLogout();

      const flowSteps = {
        step1: "Clear local tokens",
        step2: "Generate new PKCE for fresh auth",
        step3: "Redirect to ScaleKit logout",
        step4: "ScaleKit logout redirects to ScaleKit login",
        step5: "User can start fresh authentication",
      };

      // Verify step 1: Clear tokens
      expect(mockClearAllAuth).toHaveBeenCalled();

      // Verify step 2: New PKCE generated
      expect(mockStoreCodeVerifier).toHaveBeenCalledWith(
        "mock-random-verifier",
      );

      // Verify step 3: Logout URL constructed
      expect(mockLocation.href).toContain("/logout");

      // Verify step 4: Post-logout redirect to auth URL
      const urlMatch = mockLocation.href.match(
        /post_logout_redirect_uri=([^&]+)/,
      );
      const redirectUri = decodeURIComponent(urlMatch![1]);
      expect(redirectUri).toContain("/oauth/authorize");

      expect(flowSteps).toMatchSnapshot();
    });
  });
});
