export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const CODE_VERIFIER_KEY = "pkce_code_verifier";
export const OAUTH_STATE_KEY = "oauth_state";

// Custom event for auth state changes within the same tab
export const AUTH_STATE_CHANGE_EVENT = "auth-state-change";

// Type definitions for auth events
export interface AuthStateChangeDetail {
  type: "login" | "logout";
  hasToken: boolean;
}

export type AuthStateChangeEvent = CustomEvent<AuthStateChangeDetail>;

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    // Note: Storage events are automatically fired across different tabs/windows
    // when localStorage changes. For same-tab notifications, dispatch custom event:
    window.dispatchEvent(
      new CustomEvent(AUTH_STATE_CHANGE_EVENT, {
        detail: { type: "login", hasToken: true },
      }),
    );
  } catch (error) {
    console.error("[Auth] Failed to set tokens:", error);
    throw error;
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // Dispatch custom event for same-tab notifications only after successful clear
    window.dispatchEvent(
      new CustomEvent(AUTH_STATE_CHANGE_EVENT, {
        detail: { type: "logout", hasToken: false },
      }),
    );
  } catch (error) {
    console.error("[Auth] Failed to clear tokens:", error);
    // Don't throw to maintain backward compatibility, but log the error
  }
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

export function storeOAuthState(state: string) {
  localStorage.setItem(OAUTH_STATE_KEY, state);
}

export function readOAuthState(): string | null {
  return localStorage.getItem(OAUTH_STATE_KEY);
}

export function clearOAuthState() {
  localStorage.removeItem(OAUTH_STATE_KEY);
}

export function clearAllAuth() {
  // Clear all auth data from localStorage
  clearTokens();
  clearCodeVerifier();
  clearOAuthState();
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
