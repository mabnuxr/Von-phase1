export const config = {
  // Backend API configuration
  // In development, use the Vite proxy (/api) to avoid CORS issues
  // In production, use the full API URL from environment variable
  apiBaseUrl: import.meta.env.DEV
    ? "" // Use relative URLs in development (proxy will handle routing)
    : (import.meta.env.VITE_API_BASE_URL as string),

  // Pusher configuration
  pusherKey: import.meta.env.VITE_PUSHER_KEY as string,
  pusherCluster: import.meta.env.VITE_PUSHER_CLUSTER as string,
  pusherAuthEndpoint: import.meta.env.DEV
    ? "/api/v1/pusher/auth"
    : `${import.meta.env.VITE_API_BASE_URL}/api/v1/pusher/auth`,

  // ScaleKit OAuth configuration
  scalekitClientId: import.meta.env.VITE_SCALEKIT_CLIENT_ID as string,
  scalekitAuthBaseUrl: import.meta.env.VITE_SCALEKIT_AUTH_BASE_URL as string,
  scalekitAuthorizePath: import.meta.env
    .VITE_SCALEKIT_AUTH_AUTHORIZE_PATH as string,
  scalekitTokenPath: import.meta.env.VITE_SCALEKIT_AUTH_TOKEN_PATH as string,
  scalekitLogoutPath: import.meta.env.VITE_SCALEKIT_AUTH_LOGOUT_PATH as string,
  scalekitRedirectUri: `${location.origin}/callback`,

  // OAuth standard parameters
  oauthResponseType: "code",
  oauthScope: "openid profile offline_access email",
  oauthCodeChallengeMethod: "S256",
  oauthGrantType: "authorization_code",
};

// Debug: Log config values on initialization
if (import.meta.env.DEV || !config.scalekitClientId) {
  console.log("App Config:", {
    apiBaseUrl: config.apiBaseUrl || "UNDEFINED",
    clientId: config.scalekitClientId || "UNDEFINED",
    authBaseUrl: config.scalekitAuthBaseUrl || "UNDEFINED",
    authorizePath: config.scalekitAuthorizePath || "UNDEFINED",
    tokenPath: config.scalekitTokenPath || "UNDEFINED",
    logoutPath: config.scalekitLogoutPath || "UNDEFINED",
    redirectUri: config.scalekitRedirectUri,
    env: import.meta.env,
  });
}
