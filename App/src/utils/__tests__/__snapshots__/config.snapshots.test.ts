import { describe, it, expect } from "vitest";

describe("Config Snapshots", () => {
  it("should match config structure", async () => {
    // Mock environment variables for consistent snapshots
    const mockEnv = {
      VITE_CLIENT_ID: "test-client-id",
      VITE_AUTH_BASE_URL: "https://test.scalekit.dev",
      VITE_AUTH_AUTHORIZE_PATH: "/oauth/authorize",
      VITE_AUTH_TOKEN_PATH: "/oauth/token",
      VITE_AUTH_LOGOUT_PATH: "/logout",
      VITE_API_BASE_URL: "http://localhost:5176",
    };

    // Mock location for consistent redirect URI
    const mockLocation = {
      origin: "http://localhost:5173",
    };

    Object.defineProperty(global, "location", {
      value: mockLocation,
      writable: true,
    });

    // Create a config structure for snapshot
    const configSnapshot = {
      clientId: mockEnv.VITE_CLIENT_ID,
      authBase: mockEnv.VITE_AUTH_BASE_URL,
      authorizePath: mockEnv.VITE_AUTH_AUTHORIZE_PATH,
      tokenPath: mockEnv.VITE_AUTH_TOKEN_PATH,
      logoutPath: mockEnv.VITE_AUTH_LOGOUT_PATH,
      redirectUri: `${mockLocation.origin}/callback`,
      apiBase: mockEnv.VITE_API_BASE_URL,
    };

    expect(configSnapshot).toMatchSnapshot();
  });

  it("should match URL construction patterns", () => {
    const baseUrl = "https://auth.example.com";
    const paths = ["/oauth/authorize", "/oauth/token", "/logout"];

    const urlPatterns = paths.map((path) => {
      const url = new URL(path, baseUrl);
      return {
        path,
        fullUrl: url.toString(),
        protocol: url.protocol,
        host: url.host,
        pathname: url.pathname,
      };
    });

    expect(urlPatterns).toMatchSnapshot();
  });

  it("should match search params structure", () => {
    const url = new URL("/oauth/authorize", "https://auth.example.com");

    // Add typical OAuth params
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", "test-client");
    url.searchParams.set("redirect_uri", "http://localhost:5173/callback");
    url.searchParams.set("scope", "openid profile offline_access");
    url.searchParams.set("state", "test-state-123");
    url.searchParams.set("code_challenge", "test-challenge");
    url.searchParams.set("code_challenge_method", "S256");

    const paramsSnapshot = {
      paramCount: url.searchParams.size,
      paramKeys: Array.from(url.searchParams.keys()).sort(),
      hasRequiredParams: {
        response_type: url.searchParams.has("response_type"),
        client_id: url.searchParams.has("client_id"),
        redirect_uri: url.searchParams.has("redirect_uri"),
        scope: url.searchParams.has("scope"),
        code_challenge: url.searchParams.has("code_challenge"),
      },
    };

    expect(paramsSnapshot).toMatchSnapshot();
  });
});
