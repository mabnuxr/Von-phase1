export const config = {
  clientId: import.meta.env.VITE_CLIENT_ID as string,
  authBase:
    (import.meta.env.VITE_AUTH_BASE_URL as string) ||
    "https://vonlabs-afcu5dgbaafqi.scalekit.dev",
  authorizePath:
    (import.meta.env.VITE_AUTH_AUTHORIZE_PATH as string) || "/oauth/authorize",
  tokenPath: (import.meta.env.VITE_AUTH_TOKEN_PATH as string) || "/oauth/token",
  logoutPath: (import.meta.env.VITE_AUTH_LOGOUT_PATH as string) || "/logout",
  redirectUri: `${location.origin}/callback`,
  apiBase:
    (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5176",
};
