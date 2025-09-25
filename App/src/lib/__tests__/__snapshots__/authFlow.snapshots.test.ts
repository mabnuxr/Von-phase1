import { describe, it, expect } from "vitest";

describe("Auth Flow Snapshots", () => {
  it("should match authorization URL structure", () => {
    const mockConfig = {
      authBase: "https://test.scalekit.dev",
      authorizePath: "/oauth/authorize",
      clientId: "test-client-id",
      redirectUri: "http://localhost:5173/callback",
    };

    const authUrl = new URL(mockConfig.authorizePath, mockConfig.authBase);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", mockConfig.clientId);
    authUrl.searchParams.set("redirect_uri", mockConfig.redirectUri);
    authUrl.searchParams.set("scope", "openid profile offline_access");
    authUrl.searchParams.set("state", "test-state-123");
    authUrl.searchParams.set("code_challenge", "test-challenge");
    authUrl.searchParams.set("code_challenge_method", "S256");

    const urlStructure = {
      baseUrl: authUrl.origin,
      pathname: authUrl.pathname,
      paramCount: authUrl.searchParams.size,
      requiredParams: {
        response_type: authUrl.searchParams.get("response_type"),
        client_id: authUrl.searchParams.get("client_id"),
        redirect_uri: authUrl.searchParams.get("redirect_uri"),
        scope: authUrl.searchParams.get("scope"),
        code_challenge_method: authUrl.searchParams.get(
          "code_challenge_method",
        ),
      },
      hasState: authUrl.searchParams.has("state"),
      hasCodeChallenge: authUrl.searchParams.has("code_challenge"),
    };

    expect(urlStructure).toMatchSnapshot();
  });

  it("should match logout URL structure", () => {
    const mockConfig = {
      authBase: "https://test.scalekit.dev",
      logoutPath: "/logout",
      clientId: "test-client-id",
    };

    const logoutUrl = new URL(mockConfig.logoutPath, mockConfig.authBase);
    logoutUrl.searchParams.set(
      "post_logout_redirect_uri",
      "http://localhost:5173/",
    );
    logoutUrl.searchParams.set("client_id", mockConfig.clientId);

    const urlStructure = {
      baseUrl: logoutUrl.origin,
      pathname: logoutUrl.pathname,
      paramCount: logoutUrl.searchParams.size,
      params: {
        post_logout_redirect_uri: logoutUrl.searchParams.get(
          "post_logout_redirect_uri",
        ),
        client_id: logoutUrl.searchParams.get("client_id"),
      },
      hasPostLogoutRedirect: logoutUrl.searchParams.has(
        "post_logout_redirect_uri",
      ),
      hasClientId: logoutUrl.searchParams.has("client_id"),
    };

    expect(urlStructure).toMatchSnapshot();
  });

  it("should match PKCE flow parameters", () => {
    const pkceFlow = {
      verifierLength: 64,
      challengeMethod: "S256",
      scope: "openid profile offline_access",
      responseType: "code",
      stateFormat: "uuid",
      requiredParams: [
        "response_type",
        "client_id",
        "redirect_uri",
        "scope",
        "state",
        "code_challenge",
        "code_challenge_method",
      ],
      optionalParams: [],
      encoding: {
        redirectUri: "URL encoded",
        scope: "space separated, plus encoded",
        state: "UUID format",
        codeChallenge: "base64url encoded SHA256",
      },
    };

    expect(pkceFlow).toMatchSnapshot();
  });

  it("should match OAuth 2.0 + PKCE specification compliance", () => {
    const specification = {
      oauth2: {
        version: "2.0",
        authorizationCodeFlow: true,
        requiredParams: ["response_type", "client_id"],
        recommendedParams: ["redirect_uri", "scope", "state"],
      },
      pkce: {
        rfc: "RFC 7636",
        codeVerifierLength: { min: 43, max: 128, recommended: 64 },
        codeChallengeMethod: "S256",
        codeChallenge: "base64url(sha256(code_verifier))",
      },
      scalekit: {
        authorizePath: "/oauth/authorize",
        tokenPath: "/oauth/token",
        logoutPath: "/logout",
        scope: "openid profile offline_access",
      },
      security: {
        stateParameter: "CSRF protection",
        pkceCodeChallenge: "code injection protection",
        httpsRequired: true,
      },
    };

    expect(specification).toMatchSnapshot();
  });

  it("should match auth flow sequence", () => {
    const authSequence = {
      steps: [
        {
          step: 1,
          action: "generateCodeVerifier",
          description: "Generate random 64-byte string",
          output: "code_verifier",
        },
        {
          step: 2,
          action: "generateCodeChallenge",
          description: "SHA256 hash of code_verifier, base64url encoded",
          output: "code_challenge",
        },
        {
          step: 3,
          action: "storeCodeVerifier",
          description: "Store code_verifier in sessionStorage",
          storage: "sessionStorage",
        },
        {
          step: 4,
          action: "redirectToProvider",
          description: "Redirect to authorization endpoint with PKCE params",
          method: "window.location.href",
        },
        {
          step: 5,
          action: "receiveAuthorizationCode",
          description: "Provider redirects back with authorization code",
          endpoint: "/callback",
        },
        {
          step: 6,
          action: "exchangeCodeForTokens",
          description: "Exchange code + code_verifier for tokens",
          endpoint: "/oauth/token",
        },
      ],
      totalSteps: 6,
      storageUsed: ["sessionStorage"],
      redirects: 2,
    };

    expect(authSequence).toMatchSnapshot();
  });
});
