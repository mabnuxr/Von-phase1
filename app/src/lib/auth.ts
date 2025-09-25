export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const CODE_VERIFIER_KEY = "pkce_code_verifier";

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function storeCodeVerifier(codeVerifier: string) {
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
}

export function readCodeVerifier(): string | null {
  return sessionStorage.getItem(CODE_VERIFIER_KEY);
}

export function clearCodeVerifier() {
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
}

export function clearAllAuth() {
  // Clear all auth data from sessionStorage
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
  // Also clear using the helper functions for consistency
  clearTokens();
  clearCodeVerifier();
}

export function logCurrentToken(context: string) {
  if (import.meta.env.DEV) {
    const token = getAccessToken();
    if (token) {
      console.log(
        `[Auth] ${context} - token present (length: ${token.length})`,
      );
    } else {
      console.log(`[Auth] ${context} - no access_token found`);
    }
  }
}
