export const config = {
  scalekitClientId: import.meta.env.VITE_SCALEKIT_CLIENT_ID as string,
  scalekitAuthBaseUrl: import.meta.env.VITE_SCALEKIT_AUTH_BASE_URL as string,
  scalekitAuthorizePath: import.meta.env
    .VITE_SCALEKIT_AUTH_AUTHORIZE_PATH as string,
  scalekitTokenPath: import.meta.env.VITE_SCALEKIT_AUTH_TOKEN_PATH as string,
  scalekitLogoutPath: import.meta.env.VITE_SCALEKIT_AUTH_LOGOUT_PATH as string,
  scalekitRedirectUri: `${location.origin}/callback`,
};

// Debug: Log config values on initialization
if (import.meta.env.DEV || !config.scalekitClientId) {
  console.log("ScaleKit Config:", {
    clientId: config.scalekitClientId || "UNDEFINED",
    authBaseUrl: config.scalekitAuthBaseUrl || "UNDEFINED",
    authorizePath: config.scalekitAuthorizePath || "UNDEFINED",
    tokenPath: config.scalekitTokenPath || "UNDEFINED",
    logoutPath: config.scalekitLogoutPath || "UNDEFINED",
    redirectUri: config.scalekitRedirectUri,
    env: import.meta.env,
  });
}
