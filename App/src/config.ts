export const config = {
  scalekitClientId: import.meta.env.VITE_SCALEKIT_CLIENT_ID as string,
  scalekitAuthBaseUrl: import.meta.env.VITE_SCALEKIT_AUTH_BASE_URL as string,
  scalekitAuthorizePath: import.meta.env.VITE_SCALEKIT_AUTH_AUTHORIZE_PATH as string,
  scalekitTokenPath: import.meta.env.VITE_SCALEKIT_AUTH_TOKEN_PATH as string,
  scalekitLogoutPath: import.meta.env.VITE_SCALEKIT_AUTH_LOGOUT_PATH as string,
  scalekitRedirectUri: `${location.origin}/callback`,
};
