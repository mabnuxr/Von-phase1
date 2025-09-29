export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const CODE_VERIFIER_KEY = "pkce_code_verifier";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    // Force a storage event to ensure sync across tabs/windows
    window.dispatchEvent(new Event("storage"));
  } catch (error) {
    console.error("[Auth] Failed to set tokens:", error);
    throw error;
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function storeCodeVerifier(codeVerifier: string) {
  localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
}

export function readCodeVerifier(): string | null {
  return localStorage.getItem(CODE_VERIFIER_KEY);
}

export function clearCodeVerifier() {
  localStorage.removeItem(CODE_VERIFIER_KEY);
}

export function clearAllAuth() {
  // Clear all auth data from localStorage
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
