export const config = {
  clientId: import.meta.env.VITE_CLIENT_ID as string,
  authBase: (import.meta.env.VITE_AUTH_BASE_URL as string) || 'https://vonlabs-afcu5dgbaafqi.scalekit.dev',
  authorizePath: (import.meta.env.VITE_AUTH_AUTHORIZE_PATH as string) || '/oauth/authorize',
  tokenPath: (import.meta.env.VITE_AUTH_TOKEN_PATH as string) || '/oauth/token',
  redirectUri: `${location.origin}/callback`,
};


